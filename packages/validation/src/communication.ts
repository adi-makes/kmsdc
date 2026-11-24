import { z } from 'zod';

export const COMMUNICATION_CHANNELS = ['WHATSAPP', 'SMS', 'EMAIL', 'WEB'] as const;
export type CommunicationChannel = (typeof COMMUNICATION_CHANNELS)[number];

export const CONVERSATION_STATUSES = ['OPEN', 'WAITING_ON_PATIENT', 'CLOSED'] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

export const MESSAGE_DIRECTIONS = ['INBOUND', 'OUTBOUND'] as const;
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number];

export const MESSAGE_DELIVERY_STATUSES = [
  'QUEUED',
  'SENT',
  'DELIVERED',
  'READ',
  'FAILED',
  'MOCK_DELIVERED',
] as const;
export type MessageDeliveryStatus = (typeof MESSAGE_DELIVERY_STATUSES)[number];

export const MESSAGE_TEMPLATE_CATEGORIES = ['OPERATIONAL', 'PROMOTIONAL'] as const;
export type MessageTemplateCategory = (typeof MESSAGE_TEMPLATE_CATEGORIES)[number];

export const createConversationSchema = z.object({
  patientId: z.uuid().optional(),
  channel: z.enum(COMMUNICATION_CHANNELS).default('WHATSAPP'),
  contactPoint: z.string().trim().min(3).max(100),
  subject: z.string().trim().max(200).optional(),
  initialMessage: z.string().trim().min(1).max(4000).optional(),
});
export type CreateConversationInput = z.infer<typeof createConversationSchema>;

export const sendConversationMessageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
  templateKey: z.string().trim().max(100).optional(),
  category: z.enum(MESSAGE_TEMPLATE_CATEGORIES).default('OPERATIONAL'),
});
export type SendConversationMessageInput = z.infer<typeof sendConversationMessageSchema>;

export const createMessageTemplateSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9_.-]+$/, 'Key must be alphanumeric with dashes/underscores'),
  name: z.string().trim().min(2).max(100),
  category: z.enum(MESSAGE_TEMPLATE_CATEGORIES).default('OPERATIONAL'),
  channel: z.enum(COMMUNICATION_CHANNELS).default('WHATSAPP'),
  body: z.string().trim().min(1).max(2000),
  variables: z.array(z.string().trim()).default([]),
});
export type CreateMessageTemplateInput = z.infer<typeof createMessageTemplateSchema>;

export const updateConversationSchema = z.object({
  status: z.enum(CONVERSATION_STATUSES).optional(),
  assignedToId: z.uuid().nullable().optional(),
  patientId: z.uuid().nullable().optional(),
});
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;

export const whatsappWebhookQuerySchema = z.object({
  'hub.mode': z.string().optional(),
  'hub.verify_token': z.string().optional(),
  'hub.challenge': z.string().optional(),
});
export type WhatsAppWebhookQuery = z.infer<typeof whatsappWebhookQuerySchema>;
