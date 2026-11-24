import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { API_ENV, loadApiEnv } from '../config/env.js';

@Global()
@Module({
  providers: [
    {
      provide: API_ENV,
      useFactory: () => loadApiEnv(),
    },
    PrismaService,
  ],
  exports: [PrismaService, API_ENV],
})
export class PrismaModule {}
