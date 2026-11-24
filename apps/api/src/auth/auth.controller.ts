import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { Public } from './decorators/permissions.decorator.js';
import { CurrentUser, type CurrentUserPayload } from './decorators/current-user.decorator.js';
import {
  loginSchema,
  changePasswordSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from '@kmsdc/validation';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const input = loginSchema.parse(body);
    const ip = req.ip;
    const ua = req.headers['user-agent'];
    const requestId = req.headers['x-request-id'] as string | undefined;

    const result = await this.authService.login(input, ip, ua, requestId);

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieName = isProduction ? '__Host-kmsdc_session' : 'kmsdc_session';

    res.cookie(cookieName, result.sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    });

    return {
      csrfToken: result.csrfToken,
      user: result.user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: CurrentUserPayload | undefined,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req.cookies as Record<string, string> | undefined;
    const sessionToken: string | undefined =
      cookies?.['__Host-kmsdc_session'] ??
      cookies?.['kmsdc_session'] ??
      (req.headers['x-session-token'] as string | undefined);

    if (sessionToken) {
      await this.authService.logout(
        sessionToken,
        user?.id,
        user?.clinicId,
        req.ip,
        req.headers['user-agent'],
        req.headers['x-request-id'] as string | undefined,
      );
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieName = isProduction ? '__Host-kmsdc_session' : 'kmsdc_session';
    res.clearCookie(cookieName, { path: '/' });
  }

  @Get('me')
  me(@CurrentUser() user: CurrentUserPayload | undefined) {
    if (!user) throw new UnauthorizedException('Not authenticated');
    return { user };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const input = changePasswordSchema.parse(body);
    await this.authService.changePassword(
      user.id,
      input,
      req.ip,
      req.headers['user-agent'],
      req.headers['x-request-id'] as string | undefined,
    );
  }

  @Public()
  @Post('password-reset/request')
  @HttpCode(HttpStatus.ACCEPTED)
  async requestPasswordReset(@Body() body: unknown) {
    const input = requestPasswordResetSchema.parse(body);
    await this.authService.requestPasswordReset(input);
    return { message: 'If this email exists, a reset link will be sent.' };
  }

  @Public()
  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() body: unknown, @Req() req: Request) {
    const input = resetPasswordSchema.parse(body);
    await this.authService.resetPassword(
      input,
      req.ip,
      req.headers['user-agent'],
      req.headers['x-request-id'] as string | undefined,
    );
  }
}
