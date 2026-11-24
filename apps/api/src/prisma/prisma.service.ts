import { Injectable, OnModuleDestroy, Inject } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@kmsdc/db';
import type { ApiEnv } from '@kmsdc/config/env';
import { API_ENV } from '../config/env.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(@Inject(API_ENV) env: ApiEnv) {
    const adapter = new PrismaPg({ connectionString: env.DATABASE_URL, max: 10 });
    super({ adapter });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
