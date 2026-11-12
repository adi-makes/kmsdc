import { describe, expect, it, vi } from 'vitest';
import { ApiRequestError, createApiClient } from './client.js';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('createApiClient', () => {
  it('parses a valid health report', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        service: 'api',
        status: 'ok',
        version: '0.0.0',
        uptimeSeconds: 1,
        timestamp: new Date().toISOString(),
        checks: { database: { status: 'up', latencyMs: 2 } },
      }),
    );
    const client = createApiClient({ baseUrl: 'http://api', fetch: fetchMock });
    const report = await client.health();
    expect(report.status).toBe('ok');
    expect(fetchMock).toHaveBeenCalledWith('http://api/api/v1/health', expect.any(Object));
  });

  it('throws a typed error with the API error code', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(409, { error: { code: 'APPOINTMENT_CONFLICT', message: 'Slot taken' } }),
      );
    const client = createApiClient({ baseUrl: '', fetch: fetchMock });
    await expect(client.health()).rejects.toMatchObject({
      status: 409,
      code: 'APPOINTMENT_CONFLICT',
    });
    await expect(client.health()).rejects.toBeInstanceOf(ApiRequestError);
  });

  it('sends the CSRF token on mutations only', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse(200, {})));
    const client = createApiClient({ baseUrl: '', fetch: fetchMock, getCsrfToken: () => 'tok' });
    const { z } = await import('zod');
    await client.request('POST', '/x', z.object({}), { a: 1 });
    await client.request('GET', '/x', z.object({}));
    const postHeaders = (fetchMock.mock.calls[0]?.[1] as RequestInit).headers as Record<
      string,
      string
    >;
    const getHeaders = (fetchMock.mock.calls[1]?.[1] as RequestInit).headers as Record<
      string,
      string
    >;
    expect(postHeaders['X-CSRF-Token']).toBe('tok');
    expect(getHeaders['X-CSRF-Token']).toBeUndefined();
  });
});
