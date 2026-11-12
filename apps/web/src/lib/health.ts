import type { DependencyCheck, HealthReport } from '@kmsdc/types';

const startedAt = Date.now();

/** Web health includes reachability of the API it proxies to. */
export async function buildWebHealth(
  apiBaseUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<HealthReport> {
  const started = performance.now();
  let api: DependencyCheck;
  try {
    const res = await fetchImpl(`${apiBaseUrl}/api/v1/health/live`, {
      signal: AbortSignal.timeout(2_000),
      cache: 'no-store',
    });
    api = res.ok
      ? { status: 'up', latencyMs: Math.round(performance.now() - started) }
      : { status: 'down', error: `HTTP ${res.status}` };
  } catch (error) {
    api = {
      status: 'down',
      error: error instanceof Error ? error.message.slice(0, 120) : 'unknown',
    };
  }
  return {
    service: 'web',
    // The site can still serve static pages without the API, so it is degraded, not down.
    status: api.status === 'up' ? 'ok' : 'degraded',
    version: process.env.APP_VERSION ?? process.env.npm_package_version ?? 'dev',
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
    checks: { api },
  };
}
