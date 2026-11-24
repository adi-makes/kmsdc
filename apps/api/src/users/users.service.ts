import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { hash } from '@node-rs/argon2';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { CreateUserInput, UpdateUserInput } from '@kmsdc/validation';

const ARGON2_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(clinicId?: string) {
    const users = await this.prisma.user.findMany({
      where: clinicId
        ? {
            roles: {
              some: { clinicId },
            },
          }
        : {},
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
        mustChangePassword: true,
        lastLoginAt: true,
        createdAt: true,
        roles: {
          include: {
            role: true,
            clinic: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      status: u.status,
      mustChangePassword: u.mustChangePassword,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      roles: u.roles.map((r) => ({
        role: r.role.key,
        roleName: r.role.name,
        clinicId: r.clinicId,
      })),
    }));
  }

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      roles: user.roles.map((r) => ({
        role: r.role.key,
        roleName: r.role.name,
        clinicId: r.clinicId,
      })),
    };
  }

  async create(
    clinicId: string,
    input: CreateUserInput,
    actorId?: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const initialPassword = input.password ?? 'KmsdcTemp#2026';
    const passwordHash = await hash(initialPassword, ARGON2_OPTIONS);

    const roles = await this.prisma.role.findMany({
      where: { key: { in: input.roles } },
    });

    const user = await this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        fullName: input.fullName,
        passwordHash,
        mustChangePassword: true,
        roles: {
          create: roles.map((r) => ({
            clinicId,
            roleId: r.id,
            assignedById: actorId,
          })),
        },
      },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    await this.audit.log({
      clinicId,
      actorType: actorId ? 'USER' : 'SYSTEM',
      actorId,
      action: 'users.create',
      entityType: 'User',
      entityId: user.id,
      changes: {
        email: user.email,
        fullName: user.fullName,
        roles: input.roles,
      },
      ipAddress,
      userAgent,
      requestId,
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
    };
  }

  async update(
    userId: string,
    input: UpdateUserInput,
    actorId?: string,
    clinicId?: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          fullName: input.fullName,
          status: input.status,
          mustChangePassword: input.mustChangePassword,
        },
      });

      if (input.roles && clinicId) {
        await tx.userRole.deleteMany({ where: { userId } });
        const roles = await tx.role.findMany({
          where: { key: { in: input.roles } },
        });

        await tx.userRole.createMany({
          data: roles.map((r) => ({
            userId,
            clinicId,
            roleId: r.id,
            assignedById: actorId,
          })),
        });
      }
    });

    await this.audit.log({
      clinicId,
      actorType: 'USER',
      actorId,
      action: 'users.update',
      entityType: 'User',
      entityId: userId,
      changes: input,
      ipAddress,
      userAgent,
      requestId,
    });

    return this.getById(userId);
  }
}
