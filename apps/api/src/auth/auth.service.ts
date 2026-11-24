import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import { randomBytes, createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { API_ENV } from '../config/env.js';
import type { ApiEnv } from '@kmsdc/config/env';
import type {
  LoginInput,
  ChangePasswordInput,
  RequestPasswordResetInput,
  ResetPasswordInput,
} from '@kmsdc/validation';

const ARGON2_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export interface SessionResult {
  sessionToken: string;
  csrfToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    clinicId: string;
    roles: string[];
    permissions: string[];
    mustChangePassword: boolean;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(API_ENV) private readonly env: ApiEnv,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async login(
    input: LoginInput,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ): Promise<SessionResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
            clinic: true,
          },
        },
      },
    });

    if (!user || user.status === 'DISABLED') {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await verify(user.passwordHash, input.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const defaultRole = user.roles[0];
    const clinicId = defaultRole?.clinicId ?? (await this.getDefaultClinicId());

    const rawSessionToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawSessionToken);
    const csrfToken = randomBytes(32).toString('hex');
    const csrfTokenHash = this.hashToken(csrfToken);

    const now = new Date();
    const idleTimeoutMs = this.env.SESSION_IDLE_TIMEOUT_MINUTES * 60 * 1000;
    const absTimeoutMs = this.env.SESSION_ABSOLUTE_TIMEOUT_HOURS * 60 * 60 * 1000;

    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        csrfTokenHash,
        ipAddress,
        userAgent,
        idleExpiresAt: new Date(now.getTime() + idleTimeoutMs),
        absoluteExpiresAt: new Date(now.getTime() + absTimeoutMs),
      },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: now },
    });

    const roles: string[] = Array.from(new Set(user.roles.map((r) => r.role.key)));
    const permissions: string[] = Array.from(
      new Set(user.roles.flatMap((r) => r.role.permissions.map((rp) => rp.permission.key))),
    );

    await this.audit.log({
      clinicId,
      actorType: 'USER',
      actorId: user.id,
      action: 'auth.login',
      entityType: 'User',
      entityId: user.id,
      ipAddress,
      userAgent,
      requestId,
    });

    return {
      sessionToken: rawSessionToken,
      csrfToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        clinicId,
        roles,
        permissions,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  async logout(
    rawSessionToken: string,
    actorId?: string,
    clinicId?: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ): Promise<void> {
    const tokenHash = this.hashToken(rawSessionToken);
    await this.prisma.session.deleteMany({
      where: { tokenHash },
    });

    if (actorId) {
      await this.audit.log({
        clinicId,
        actorType: 'USER',
        actorId,
        action: 'auth.logout',
        entityType: 'Session',
        ipAddress,
        userAgent,
        requestId,
      });
    }
  }

  async validateSession(rawSessionToken: string) {
    const tokenHash = this.hashToken(rawSessionToken);
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
                clinic: true,
              },
            },
          },
        },
      },
    });

    if (!session || session.revokedAt) return null;

    const now = new Date();
    if (session.idleExpiresAt < now || session.absoluteExpiresAt < now) {
      await this.prisma.session.delete({ where: { id: session.id } });
      return null;
    }

    if (session.user.status === 'DISABLED') {
      await this.prisma.session.delete({ where: { id: session.id } });
      return null;
    }

    const idleTimeoutMs = this.env.SESSION_IDLE_TIMEOUT_MINUTES * 60 * 1000;
    const newExpiresAt = new Date(now.getTime() + idleTimeoutMs);
    const cappedExpiresAt =
      newExpiresAt > session.absoluteExpiresAt ? session.absoluteExpiresAt : newExpiresAt;

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        lastSeenAt: now,
        idleExpiresAt: cappedExpiresAt,
      },
    });

    const defaultRole = session.user.roles[0];
    const clinicId = defaultRole?.clinicId ?? (await this.getDefaultClinicId());

    const roles: string[] = Array.from(new Set(session.user.roles.map((r) => r.role.key)));
    const permissions: string[] = Array.from(
      new Set(session.user.roles.flatMap((r) => r.role.permissions.map((rp) => rp.permission.key))),
    );

    return {
      session,
      user: {
        id: session.user.id,
        email: session.user.email,
        fullName: session.user.fullName,
        clinicId,
        roles,
        permissions,
        mustChangePassword: session.user.mustChangePassword,
      },
    };
  }

  verifyCsrfToken(csrfToken: string, csrfTokenHash: string): boolean {
    return this.hashToken(csrfToken) === csrfTokenHash;
  }

  async changePassword(
    userId: string,
    input: ChangePasswordInput,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isValid = await verify(user.passwordHash, input.currentPassword);
    if (!isValid) throw new BadRequestException('Current password does not match');

    const passwordHash = await hash(input.newPassword, ARGON2_OPTIONS);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      },
    });

    await this.prisma.session.deleteMany({
      where: { userId },
    });

    await this.audit.log({
      actorType: 'USER',
      actorId: userId,
      action: 'auth.change_password',
      entityType: 'User',
      entityId: userId,
      ipAddress,
      userAgent,
      requestId,
    });
  }

  async requestPasswordReset(input: RequestPasswordResetInput): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (!user || user.status === 'DISABLED') {
      return null;
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return rawToken;
  }

  async resetPassword(
    input: ResetPasswordInput,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ): Promise<void> {
    const tokenHash = this.hashToken(input.token);
    const resetRecord = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
      throw new BadRequestException('Password reset token is invalid or has expired');
    }

    const passwordHash = await hash(input.newPassword, ARGON2_OPTIONS);
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetRecord.userId },
        data: {
          passwordHash,
          mustChangePassword: false,
          passwordChangedAt: now,
        },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: now },
      }),
      this.prisma.session.deleteMany({
        where: { userId: resetRecord.userId },
      }),
    ]);

    await this.audit.log({
      actorType: 'USER',
      actorId: resetRecord.userId,
      action: 'auth.reset_password',
      entityType: 'User',
      entityId: resetRecord.userId,
      ipAddress,
      userAgent,
      requestId,
    });
  }

  private async getDefaultClinicId(): Promise<string> {
    const clinic = await this.prisma.clinic.findFirst();
    return clinic?.id ?? '';
  }
}
