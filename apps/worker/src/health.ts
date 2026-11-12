import { createServer, type Server } from 'node:http';
import type { DependencyCheck, HealthReport } from '@kmsdc/types';

export type CheckFn = () => Promise<DependencyCheck>;

export async function timedCheck(
  fn: () => Promise<unknown>,
  timeoutMs = 2_000,
): Promise<DependencyCheck> {
  const started = performance.now();
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      fn(),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
    return { status: 'up', latencyMs: Math.round(performance.now() - started) };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message.slice(0, 120) : 'unknown',
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function buildReport(
  version: string,
  startedAt: number,
  checks: Record<string, CheckFn>,
): Promise<HealthReport> {
  const entries = await Promise.all(
    Object.entries(checks).map(async ([name, fn]) => [name, await fn()] as const),
  );
  const results = Object.fromEntries(entries);
  const allUp = entries.every(([, c]) => c.status === 'up');
  return {
    service: 'worker',
    status: allUp ? 'ok' : 'down',
    version,
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
    checks: results,
  };
}

/** Tiny HTTP server: GET /health (readiness) and GET /health/live (liveness). */
export function startHealthServer(
  port: number,
  getReport: () => Promise<HealthReport>,
): Promise<Server> {
  const server = createServer((req, res) => {
    const path = req.url?.split('?')[0];
    if (req.method !== 'GET' || (path !== '/health' && path !== '/health/live')) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Not found' } }));
      return;
    }
    if (path === '/health/live') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }
    getReport()
      .then((report) => {
        res.writeHead(report.status === 'ok' ? 200 : 503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(report));
      })
      .catch(() => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Health check failed' } }),
        );
      });
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, () => {
      resolve(server);
    });
  });
}
