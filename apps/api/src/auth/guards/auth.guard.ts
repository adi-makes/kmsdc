import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthService } from '../auth.service.js';
import { IS_PUBLIC_KEY, PERMISSIONS_KEY } from '../decorators/permissions.decorator.js';
import type { AuthenticatedRequest } from '../decorators/current-user.decorator.js';
import type { PermissionKey } from '@kmsdc/types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request>();
    const cookies = request.cookies as Record<string, string> | undefined;
    const sessionCookie: string | undefined =
      cookies?.['__Host-kmsdc_session'] ??
      cookies?.['kmsdc_session'] ??
      (request.headers['x-session-token'] as string | undefined);

    if (!sessionCookie) {
      if (isPublic) return true;
      throw new UnauthorizedException('Authentication required');
    }

    const sessionData = await this.authService.validateSession(sessionCookie);
    if (!sessionData) {
      if (isPublic) return true;
      throw new UnauthorizedException('Invalid or expired session');
    }

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      const csrfHeader = request.headers['x-csrf-token'];
      if (
        !csrfHeader ||
        !this.authService.verifyCsrfToken(String(csrfHeader), sessionData.session.csrfTokenHash)
      ) {
        throw new ForbiddenException('Invalid CSRF token');
      }
    }

    (request as AuthenticatedRequest).user = {
      ...sessionData.user,
      sessionId: sessionData.session.id,
    };

    const requiredPermissions = this.reflector.getAllAndOverride<PermissionKey[] | undefined>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const userPermissions = new Set(sessionData.user.permissions);
    const hasPermission = requiredPermissions.every((perm) => userPermissions.has(perm));

    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }

    return true;
  }
}
