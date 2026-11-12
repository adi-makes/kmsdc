import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { buildReport, startHealthServer, timedCheck } from './health.js';

const servers: { close: () => void }[] = [];
afterEach(() => {
  for (const s of servers.splice(0)) s.close();
});

describe('timedCheck', () => {
  it('reports up with latency', async () => {
    const result = await timedCheck(() => Promise.resolve('PONG'));
    expect(result.status).toBe('up');
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });
  it('reports down on rejection and on timeout', async () => {
    expect((await timedCheck(() => Promise.reject(new Error('refused')))).error).toBe('refused');
    const slow = await timedCheck(() => new Promise((r) => setTimeout(r, 200)), 20);
    expect(slow).toMatchObject({ status: 'down', error: 'timed out after 20ms' });
  });
});

describe('health server', () => {
  it('returns 200 when all checks are up and 503 otherwise', async () => {
    let healthy = true;
    const server = await startHealthServer(0, () =>
      buildReport('test', Date.now(), {
        redis: () => Promise.resolve(healthy ? { status: 'up' } : { status: 'down', error: 'x' }),
      }),
    );
    servers.push(server);
    const { port } = server.address() as AddressInfo;
    const ok = await fetch(`http://127.0.0.1:${port}/health`);
    expect(ok.status).toBe(200);
    expect(((await ok.json()) as { service: string }).service).toBe('worker');
    healthy = false;
    expect((await fetch(`http://127.0.0.1:${port}/health`)).status).toBe(503);
    expect((await fetch(`http://127.0.0.1:${port}/health/live`)).status).toBe(200);
    expect((await fetch(`http://127.0.0.1:${port}/nope`)).status).toBe(404);
  });
});
