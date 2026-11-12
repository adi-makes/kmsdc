import { describe, expect, it, vi } from 'vitest';
import { buildWebHealth } from './health';

describe('buildWebHealth', () => {
  it('is ok when the API responds', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    const report = await buildWebHealth('http://api', fetchMock);
    expect(report.status).toBe('ok');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://api/api/v1/health/live');
  });
  it('is degraded (not down) when the API is unreachable', async () => {
    const report = await buildWebHealth(
      'http://api',
      vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    );
    expect(report.status).toBe('degraded');
    expect(report.checks.api).toMatchObject({ status: 'down', error: 'ECONNREFUSED' });
  });
});
