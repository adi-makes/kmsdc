import type { Prisma } from '@kmsdc/db';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import type {
  CreateConversationInput,
  SendConversationMessageInput,
  CreateMessageTemplateInput,
  UpdateConversationInput,
} from '@kmsdc/validation';
import { MockWhatsAppProvider } from './adapters/mock-whatsapp.provider.js';
import { MockSmsProvider } from './adapters/mock-sms.provider.js';
import type { IMessagingProvider } from './adapters/messaging-provider.interface.js';
import type { CommunicationChannel } from '@kmsdc/types';

@Injectable()
export class CommunicationService {
  private readonly providers: Map<CommunicationChannel, IMessagingProvider> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    mockWhatsApp: MockWhatsAppProvider,
    mockSms: MockSmsProvider,
  ) {
    this.providers.set('WHATSAPP', mockWhatsApp);
    this.providers.set('SMS', mockSms);
  }

  async listConversations(params: {
    clinicId: string;
    channel?: CommunicationChannel;
    status?: 'OPEN' | 'WAITING_ON_PATIENT' | 'CLOSED';
    patientId?: string;
    assignedToId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.ConversationWhereInput = { clinicId: params.clinicId };
    if (params.channel) where.channel = params.channel;
    if (params.status) where.status = params.status;
    if (params.patientId) where.patientId = params.patientId;
    if (params.assignedToId) where.assignedToId = params.assignedToId;

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              patientNumber: true,
              fullName: true,
              primaryPhone: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          messages: {
            take: 1,
            orderBy: { sentAt: 'desc' },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
        take: params.limit ?? 50,
        skip: params.offset ?? 0,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return { data: conversations, total };
  }

  async getConversation(id: string, clinicId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        patient: true,
        assignedTo: { select: { id: true, fullName: true, email: true } },
        messages: { orderBy: { sentAt: 'asc' } },
      },
    });

    if (!conversation || conversation.clinicId !== clinicId) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async createConversation(input: CreateConversationInput, clinicId: string, _actorId?: string) {
    if (input.patientId) {
      const patient = await this.prisma.patient.findUnique({
        where: { id: input.patientId },
      });
      if (!patient || patient.clinicId !== clinicId) {
        throw new NotFoundException('Patient not found');
      }
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        clinicId,
        patientId: input.patientId,
        channel: input.channel,
        contactPoint: input.contactPoint,
        subject: input.subject,
        status: 'OPEN',
        messages: input.initialMessage
          ? {
              create: {
                direction: 'INBOUND',
                body: input.initialMessage,
                channel: input.channel,
                deliveryStatus: 'DELIVERED',
              },
            }
          : undefined,
      },
      include: { messages: true },
    });

    return conversation;
  }

  async updateConversation(
    id: string,
    clinicId: string,
    input: UpdateConversationInput,
    actorId?: string,
  ) {
    await this.getConversation(id, clinicId);

    const updated = await this.prisma.conversation.update({
      where: { id },
      data: {
        status: input.status,
        assignedToId: input.assignedToId,
        patientId: input.patientId,
      },
      include: { assignedTo: true, patient: true },
    });

    if (actorId) {
      await this.audit.log({
        clinicId,
        actorType: 'USER',
        actorId,
        action: 'conversation.update',
        entityType: 'Conversation',
        entityId: id,
        changes: input,
      });
    }

    return updated;
  }

  async sendMessage(
    conversationId: string,
    clinicId: string,
    input: SendConversationMessageInput,
    actorId?: string,
  ) {
    const conversation = await this.getConversation(conversationId, clinicId);

    // Consent Check
    if (conversation.patientId) {
      const requiredPurpose =
        input.category === 'PROMOTIONAL' ? 'PROMOTIONAL_MESSAGING' : 'OPERATIONAL_MESSAGING';

      const consent = await this.prisma.patientConsent.findFirst({
        where: {
          patientId: conversation.patientId,
          purpose: requiredPurpose,
          status: 'GRANTED',
        },
        orderBy: { effectiveAt: 'desc' },
      });

      // Promotional messages strictly require explicit consent
      if (input.category === 'PROMOTIONAL' && !consent) {
        throw new ForbiddenException(
          'Cannot send promotional message: patient has not granted promotional consent',
        );
      }
    }

    const provider = this.providers.get(conversation.channel);
    let sendResult: {
      providerMessageId: string;
      status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'MOCK_DELIVERED';
      mock: boolean;
    } = {
      providerMessageId: `internal_${Date.now()}`,
      status: 'SENT',
      mock: false,
    };

    if (provider) {
      sendResult = await provider.sendMessage({
        recipient: conversation.contactPoint,
        body: input.body,
        templateKey: input.templateKey,
      });
    }

    const message = await this.prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId,
          senderId: actorId,
          direction: 'OUTBOUND',
          body: input.body,
          channel: conversation.channel,
          deliveryStatus: sendResult.status,
          providerMessageId: sendResult.providerMessageId,
          templateKey: input.templateKey,
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          status: 'WAITING_ON_PATIENT',
        },
      });

      await tx.outboxEvent.create({
        data: {
          type: 'communication.message.sent',
          aggregateType: 'Message',
          aggregateId: msg.id,
          payload: {
            conversationId,
            channel: conversation.channel,
            recipient: conversation.contactPoint,
            deliveryStatus: sendResult.status,
            mock: sendResult.mock,
          },
        },
      });

      return msg;
    });

    return message;
  }

  // --- Templates ---

  async listTemplates(clinicId: string) {
    return this.prisma.messageTemplate.findMany({
      where: { clinicId },
      orderBy: { key: 'asc' },
    });
  }

  async createTemplate(input: CreateMessageTemplateInput, clinicId: string, actorId?: string) {
    const existing = await this.prisma.messageTemplate.findUnique({
      where: { key: input.key },
    });
    if (existing) {
      throw new BadRequestException(`Template with key '${input.key}' already exists`);
    }

    const template = await this.prisma.messageTemplate.create({
      data: {
        clinicId,
        key: input.key,
        name: input.name,
        category: input.category,
        channel: input.channel,
        body: input.body,
        variables: input.variables,
      },
    });

    if (actorId) {
      await this.audit.log({
        clinicId,
        actorType: 'USER',
        actorId,
        action: 'templates.create',
        entityType: 'MessageTemplate',
        entityId: template.id,
        changes: { key: input.key, name: input.name },
      });
    }

    return template;
  }

  // --- Webhooks ---

  verifyWhatsAppWebhook(
    mode?: string,
    token?: string,
    challenge?: string,
    expectedToken = 'kmsdc_wa_verify',
  ): string {
    if (mode === 'subscribe' && token === expectedToken && challenge) {
      return challenge;
    }
    throw new ForbiddenException('Invalid webhook verification token or mode');
  }

  async handleWhatsAppInbound(payload: unknown, clinicId: string) {
    // Basic WhatsApp Business API payload parser
    const body = payload as {
      entry?: Array<{
        changes?: Array<{
          value?: {
            messages?: Array<{
              from?: string;
              id?: string;
              text?: { body?: string };
            }>;
          };
        }>;
      }>;
    };
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0]?.value;
    const messageData = changes?.messages?.[0];

    if (!messageData || !messageData.from || !messageData.id) {
      return { status: 'ignored', reason: 'No message payload' };
    }

    const fromPhone = messageData.from; // e.g. "919876543210"
    const textBody = messageData.text?.body ?? '[Non-text message]';
    const waId = messageData.id;

    // Find or create conversation for this contact point
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        clinicId,
        channel: 'WHATSAPP',
        contactPoint: fromPhone,
      },
    });

    if (!conversation) {
      // Find patient by phone if registered
      const patient = await this.prisma.patient.findFirst({
        where: { clinicId, primaryPhone: fromPhone },
      });

      conversation = await this.prisma.conversation.create({
        data: {
          clinicId,
          patientId: patient?.id,
          channel: 'WHATSAPP',
          contactPoint: fromPhone,
          status: 'OPEN',
          unreadCount: 1,
        },
      });
    } else {
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          unreadCount: { increment: 1 },
          status: 'OPEN',
        },
      });
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: 'INBOUND',
        body: textBody,
        channel: 'WHATSAPP',
        deliveryStatus: 'DELIVERED',
        providerMessageId: waId,
      },
    });

    return { status: 'processed', messageId: message.id, conversationId: conversation.id };
  }
}
