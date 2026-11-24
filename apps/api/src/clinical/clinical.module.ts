import { Module } from '@nestjs/common';
import { ClinicalService } from './clinical.service.js';
import { ClinicalController } from './clinical.controller.js';

@Module({
  controllers: [ClinicalController],
  providers: [ClinicalService],
  exports: [ClinicalService],
})
export class ClinicalModule {}
