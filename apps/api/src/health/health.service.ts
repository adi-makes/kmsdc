import { Inject, Injectable, type OnApplicationShutdown } from '@nestjs/common';
import type { DependencyCheck, HealthReport } from '@kmsdc/types';
import { APP_VERSION } from '../config/env';
import { PG_POOL, REDIS_CLIENT, type RedisPinger, type SqlPinger } from './health.tokens';

const CHECK_TIMEOUT_MS = 2_000;

async function timed(check: () => Promise<unknown>): Promise<DependencyCheck> {
  const started = performance.now();
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      check(),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`timed out after ${CHECK_TIMEOUT_MS}ms`));
        }, CHECK_TIMEOUT_MS);
      }),
    ]);
    return { status: 'up', latencyMs: Math.round(performance.now() - started) };
  } catch (error) {
    // Only a short reason: connection strings and hostnames are not echoed back.
    const reason = error instanceof Error ? error.message.slice(0, 120) : 'unknown error';
    return { status: 'down', error: reason };
  } finally {
    clearTimeout(timer);
  }
}

@Injectable()
export class HealthService implements OnApplicationShutdown {
  private readonly startedAt = Date.now();

  constructor(
    @Inject(PG_POOL) private readonly db: SqlPinger,
    @Inject(REDIS_CLIENT) private readonly redis: RedisPinger,
  ) {}

  async report(): Promise<HealthReport> {
    const [database, redis] = await Promise.all([
      timed(() => this.db.query('SELECT 1')),
      timed(() => this.redis.ping()),
    ]);
    const checks = { database, redis };
    const down = Object.values(checks).filter((c) => c.status === 'down').length;
    return {
      service: 'api',
      status: down === 0 ? 'ok' : 'down',
      version: APP_VERSION,
      uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  async onApplicationShutdown(): Promise<void> {
    await Promise.allSettled([this.db.end(), this.redis.quit()]);
  }
}
