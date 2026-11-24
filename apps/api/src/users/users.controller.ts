import { Controller, Get, Post, Patch, Body, Param, Req } from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service.js';
import { RequirePermissions } from '../auth/decorators/permissions.decorator.js';
import { CurrentUser, type CurrentUserPayload } from '../auth/decorators/current-user.decorator.js';
import { createUserSchema, updateUserSchema } from '@kmsdc/validation';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('users.read')
  async list(@CurrentUser() user: CurrentUserPayload) {
    return this.usersService.list(user.clinicId);
  }

  @Get(':id')
  @RequirePermissions('users.read')
  async getById(@Param('id') id: string) {
    return this.usersService.getById(id);
  }

  @Post()
  @RequirePermissions('users.manage')
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const input = createUserSchema.parse(body);
    return this.usersService.create(
      user.clinicId,
      input,
      user.id,
      req.ip,
      req.headers['user-agent'],
      req.headers['x-request-id'] as string | undefined,
    );
  }

  @Patch(':id')
  @RequirePermissions('users.manage')
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const input = updateUserSchema.parse(body);
    return this.usersService.update(
      id,
      input,
      user.id,
      user.clinicId,
      req.ip,
      req.headers['user-agent'],
      req.headers['x-request-id'] as string | undefined,
    );
  }
}
