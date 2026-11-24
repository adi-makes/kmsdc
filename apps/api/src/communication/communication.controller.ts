import { Body, Controller, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CommunicationService } from './communication.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { RequirePermissions, Public } from '../auth/decorators/permissions.decorator.js';
import {
  createConversationSchema,
  sendConversationMessageSchema,
  createMessageTemplateSchema,
  updateConversationSchema,
  whatsappWebhookQuerySchema,
} from '@kmsdc/validation';
import type { CommunicationChannel } from '@kmsdc/types';

interface UserPayload {
  userId: string;
  clinicId: string;
}

@Controller('communication')
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  @Get('conversations')
  @RequirePermissions('inbox.read')
  async listConversations(
    @CurrentUser() user: UserPayload,
    @Query('channel') channel?: CommunicationChannel,
    @Query('status') status?: 'OPEN' | 'WAITING_ON_PATIENT' | 'CLOSED',
    @Query('patientId') patientId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.communicationService.listConversations({
      clinicId: user.clinicId,
      channel,
      status,
      patientId,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
      offset: offset ? Number.parseInt(offset, 10) : undefined,
    });
  }

  @Get('conversations/:id')
  @RequirePermissions('inbox.read')
  async getConversation(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.communicationService.getConversation(id, user.clinicId);
  }

  @Post('conversations')
  @RequirePermissions('inbox.reply')
  async createConversation(@CurrentUser() user: UserPayload, @Body() body: unknown) {
    const input = createConversationSchema.parse(body);
    return this.communicationService.createConversation(input, user.clinicId, user.userId);
  }

  @Patch('conversations/:id')
  @RequirePermissions('inbox.reply')
  async updateConversation(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const input = updateConversationSchema.parse(body);
    return this.communicationService.updateConversation(id, user.clinicId, input, user.userId);
  }

  @Post('conversations/:id/messages')
  @RequirePermissions('inbox.reply')
  async sendMessage(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const input = sendConversationMessageSchema.parse(body);
    return this.communicationService.sendMessage(id, user.clinicId, input, user.userId);
  }

  // --- Templates ---

  @Get('templates')
  @RequirePermissions('inbox.read')
  async listTemplates(@CurrentUser() user: UserPayload) {
    return this.communicationService.listTemplates(user.clinicId);
  }

  @Post('templates')
  @RequirePermissions('templates.manage')
  async createTemplate(@CurrentUser() user: UserPayload, @Body() body: unknown) {
    const input = createMessageTemplateSchema.parse(body);
    return this.communicationService.createTemplate(input, user.clinicId, user.userId);
  }

  // --- Webhooks ---

  @Public()
  @Get('webhooks/whatsapp')
  verifyWebhook(@Query() query: unknown, @Res() res: Response) {
    const parsed = whatsappWebhookQuerySchema.parse(query);
    const challenge = this.communicationService.verifyWhatsAppWebhook(
      parsed['hub.mode'],
      parsed['hub.verify_token'],
      parsed['hub.challenge'],
    );
    res.status(200).send(challenge);
  }

  @Public()
  @Post('webhooks/whatsapp')
  async handleWebhook(@Body() body: unknown, @Query('clinicId') clinicId?: string) {
    // If clinicId is not provided in query, fallback to the default kottakal clinic ID if needed
    return this.communicationService.handleWhatsAppInbound(body, clinicId || '');
  }
}
