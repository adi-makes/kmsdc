export type CommunicationChannel = 'WHATSAPP' | 'SMS' | 'EMAIL' | 'WEB';
export type ConversationStatus = 'OPEN' | 'WAITING_ON_PATIENT' | 'CLOSED';
export type MessageDirection = 'INBOUND' | 'OUTBOUND';
export type MessageDeliveryStatus =
  'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'MOCK_DELIVERED';
export type MessageTemplateCategory = 'OPERATIONAL' | 'PROMOTIONAL';

export interface SendMessageResult {
  providerMessageId: string;
  status: MessageDeliveryStatus;
  mock: boolean;
}
