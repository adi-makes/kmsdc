import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { SendMessageResult } from '@kmsdc/types';
import type { IMessagingProvider, SendMessageOptions } from './messaging-provider.interface.js';

@Injectable()
export class MockWhatsAppProvider implements IMessagingProvider {
  readonly channel = 'WHATSAPP';
  readonly isMock = true;
  private readonly logger = new Logger(MockWhatsAppProvider.name);

  async sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
    const fakeId = `mock_wa_${randomUUID()}`;
    await Promise.resolve();
    this.logger.log(
      `[MOCK WhatsApp Delivery] To: ${options.recipient} | Template: ${options.templateKey ?? 'custom'} | Body: "${options.body}" | MockID: ${fakeId}`,
    );
    return {
      providerMessageId: fakeId,
      status: 'MOCK_DELIVERED',
      mock: true,
    };
  }
}
