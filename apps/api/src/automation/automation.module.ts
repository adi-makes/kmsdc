import { Module } from '@nestjs/common';
import { AutomationService } from './automation.service.js';
import { AutomationController } from './automation.controller.js';
import { CommunicationModule } from '../communication/communication.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [CommunicationModule, AuditModule],
  controllers: [AutomationController],
  providers: [AutomationService],
  exports: [AutomationService],
})
export class AutomationModule {}
