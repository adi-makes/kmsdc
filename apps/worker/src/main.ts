import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import pg from 'pg';
import { APP_VERSION, loadWorkerEnv } from './env.js';
import { buildReport, startHealthServer, timedCheck } from './health.js';
import { createLogger } from './logger.js';
import { HEARTBEAT_INTERVAL_MS, HEARTBEAT_JOB, QUEUES } from './queues.js';

async function main(): Promise<void> {
  const env = loadWorkerEnv();
  const log = createLogger(env.LOG_LEVEL, env.NODE_ENV === 'development');
  const startedAt = Date.now();

  // BullMQ requires maxRetriesPerRequest: null for blocking worker connections.
  const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  const pingClient = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 1 });
  const db = new pg.Pool({
    connectionString: env.DATABASE_URL,
    max: 2,
    connectionTimeoutMillis: 2_000,
  });

  const systemQueue = new Queue(QUEUES.system, { connection });
  let lastHeartbeatAt: number | undefined;

  const systemWorker = new Worker(
    QUEUES.system,
    (job) => {
      if (job.name === HEARTBEAT_JOB) {
        lastHeartbeatAt = Date.now();
        log.debug({ jobId: job.id }, 'heartbeat processed');
        return Promise.resolve({ ok: true });
      }
      return Promise.reject(new Error(`Unknown job "${job.name}" on ${QUEUES.system}`));
    },
    { connection, concurrency: env.WORKER_CONCURRENCY },
  );
  systemWorker.on('failed', (job, error) => {
    log.error({ jobId: job?.id, jobName: job?.name, err: error.message }, 'job failed');
  });

  await systemQueue.upsertJobScheduler(
    'system-heartbeat',
    { every: HEARTBEAT_INTERVAL_MS },
    { name: HEARTBEAT_JOB, data: {}, opts: { removeOnComplete: 100, removeOnFail: 500 } },
  );

  const server = await startHealthServer(env.WORKER_HEALTH_PORT, () =>
    buildReport(APP_VERSION, startedAt, {
      redis: () => timedCheck(() => pingClient.ping()),
      database: () => timedCheck(() => db.query('SELECT 1')),
      queueProcessor: () =>
        Promise.resolve(
          systemWorker.isRunning()
            ? {
                status: 'up' as const,
                ...(lastHeartbeatAt === undefined
                  ? {}
                  : { latencyMs: Date.now() - lastHeartbeatAt }),
              }
            : { status: 'down' as const, error: 'worker not running' },
        ),
    }),
  );
  log.info(
    { port: env.WORKER_HEALTH_PORT, liveSends: env.ALLOW_LIVE_SENDS },
    `worker started (${env.NODE_ENV})`,
  );

  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    log.info({ signal }, 'shutting down');
    server.close();
    await systemWorker.close();
    await systemQueue.close();
    await Promise.allSettled([connection.quit(), pingClient.quit(), db.end()]);
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
