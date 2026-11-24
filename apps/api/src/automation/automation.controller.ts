import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AutomationService } from './automation.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { RequirePermissions } from '../auth/decorators/permissions.decorator.js';
import {
  createWorkflowSchema,
  updateWorkflowSchema,
  triggerWorkflowSchema,
} from '@kmsdc/validation';

interface UserPayload {
  userId: string;
  clinicId: string;
}

@Controller('automation')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Get('workflows')
  @RequirePermissions('workflows.read')
  async listWorkflows(@CurrentUser() user: UserPayload) {
    return this.automationService.listWorkflows(user.clinicId);
  }

  @Get('workflows/:id')
  @RequirePermissions('workflows.read')
  async getWorkflow(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.automationService.getWorkflow(id, user.clinicId);
  }

  @Post('workflows')
  @RequirePermissions('workflows.manage')
  async createWorkflow(@CurrentUser() user: UserPayload, @Body() body: unknown) {
    const input = createWorkflowSchema.parse(body);
    return this.automationService.createWorkflow(input, user.clinicId, user.userId);
  }

  @Patch('workflows/:id')
  @RequirePermissions('workflows.manage')
  async updateWorkflow(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const input = updateWorkflowSchema.parse(body);
    return this.automationService.updateWorkflow(id, user.clinicId, input, user.userId);
  }

  @Post('trigger')
  @RequirePermissions('workflows.manage')
  async triggerWorkflow(@CurrentUser() user: UserPayload, @Body() body: unknown) {
    const input = triggerWorkflowSchema.parse(body);
    return this.automationService.triggerWorkflow(input, user.clinicId, user.userId);
  }

  @Post('executions/:id/approve')
  @RequirePermissions('workflows.approve')
  async approveExecution(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.automationService.approveExecution(id, user.clinicId, user.userId);
  }

  @Get('executions')
  @RequirePermissions('workflows.read')
  async listExecutions(
    @CurrentUser() user: UserPayload,
    @Query('status')
    status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'REQUIRES_APPROVAL' | 'CANCELLED',
  ) {
    return this.automationService.listExecutions(user.clinicId, status);
  }
}
