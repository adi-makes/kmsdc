import { Module } from '@nestjs/common';
import { CommunicationService } from './communication.service.js';
import { CommunicationController } from './communication.controller.js';
import { MockWhatsAppProvider } from './adapters/mock-whatsapp.provider.js';
import { MockSmsProvider } from './adapters/mock-sms.provider.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [AuditModule],
  controllers: [CommunicationController],
  providers: [CommunicationService, MockWhatsAppProvider, MockSmsProvider],
  exports: [CommunicationService],
})
export class CommunicationModule {}
