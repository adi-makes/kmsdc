import type { CommunicationChannel, SendMessageResult } from '@kmsdc/types';

export interface SendMessageOptions {
  recipient: string;
  body: string;
  templateKey?: string;
  variables?: Record<string, string>;
}

export interface IMessagingProvider {
  readonly channel: CommunicationChannel;
  readonly isMock: boolean;
  sendMessage(options: SendMessageOptions): Promise<SendMessageResult>;
}
