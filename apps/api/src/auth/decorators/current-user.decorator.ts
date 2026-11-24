import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface CurrentUserPayload {
  id: string;
  email: string;
  fullName: string;
  clinicId: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: CurrentUserPayload;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
