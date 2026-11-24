import { Module } from '@nestjs/common';
import { EnquiriesService } from './enquiries.service.js';
import { EnquiriesController } from './enquiries.controller.js';

@Module({
  controllers: [EnquiriesController],
  providers: [EnquiriesService],
  exports: [EnquiriesService],
})
export class EnquiriesModule {}
