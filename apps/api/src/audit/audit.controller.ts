import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service.js';
import { RequirePermissions } from '../auth/decorators/permissions.decorator.js';
import { CurrentUser, type CurrentUserPayload } from '../auth/decorators/current-user.decorator.js';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions('audit.read')
  async list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const l = limit ? parseInt(limit, 10) : 50;
    const o = offset ? parseInt(offset, 10) : 0;
    return this.auditService.list(user.clinicId, l, o);
  }
}
