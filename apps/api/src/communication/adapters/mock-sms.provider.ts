import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { SendMessageResult } from '@kmsdc/types';
import type { IMessagingProvider, SendMessageOptions } from './messaging-provider.interface.js';

@Injectable()
export class MockSmsProvider implements IMessagingProvider {
  readonly channel = 'SMS';
  readonly isMock = true;
  private readonly logger = new Logger(MockSmsProvider.name);

  async sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
    const fakeId = `mock_sms_${randomUUID()}`;
    await Promise.resolve();
    this.logger.log(
      `[MOCK SMS Delivery] To: ${options.recipient} | Body: "${options.body}" | MockID: ${fakeId}`,
    );
    return {
      providerMessageId: fakeId,
      status: 'MOCK_DELIVERED',
      mock: true,
    };
  }
}
