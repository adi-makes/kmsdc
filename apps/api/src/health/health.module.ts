import { Module } from '@nestjs/common';
import type { ApiEnv } from '@kmsdc/config/env';
import { Redis } from 'ioredis';
import { Pool } from 'pg';
import { API_ENV } from '../config/env';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PG_POOL, REDIS_CLIENT } from './health.tokens';

@Module({
  controllers: [HealthController],
  providers: [
    HealthService,
    {
      provide: PG_POOL,
      inject: [API_ENV],
      useFactory: (env: ApiEnv) =>
        new Pool({ connectionString: env.DATABASE_URL, max: 2, connectionTimeoutMillis: 2_000 }),
    },
    {
      provide: REDIS_CLIENT,
      inject: [API_ENV],
      useFactory: (env: ApiEnv) =>
        new Redis(env.REDIS_URL, { lazyConnect: false, maxRetriesPerRequest: 1 }),
    },
  ],
})
export class HealthModule {}
