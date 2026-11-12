import type { HealthReport } from '@kmsdc/types';
import { apiErrorSchema, healthReportSchema, type ApiError } from '@kmsdc/validation';
import type { z } from 'zod';

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiError | null,
  ) {
    super(body?.error.message ?? `Request failed with status ${status}`);
    this.name = 'ApiRequestError';
  }

  get code(): string | undefined {
    return this.body?.error.code;
  }
}

export interface ApiClientOptions {
  /** e.g. '' (same origin, browser) or 'http://localhost:4000' (server-side). */
  baseUrl: string;
  fetch?: typeof fetch;
  /** Returns the CSRF token to send on state-changing requests. */
  getCsrfToken?: () => string | undefined;
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export function createApiClient(options: ApiClientOptions) {
  const doFetch = options.fetch ?? fetch;

  async function request<T extends z.ZodType>(
    method: Method,
    path: string,
    schema: T,
    body?: unknown,
  ): Promise<z.infer<T>> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (method !== 'GET') {
      const token = options.getCsrfToken?.();
      if (token) headers['X-CSRF-Token'] = token;
    }
    const response = await doFetch(`${options.baseUrl}/api/v1${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? null : JSON.stringify(body),
    });
    const json: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const parsed = apiErrorSchema.safeParse(json);
      throw new ApiRequestError(response.status, parsed.success ? parsed.data : null);
    }
    return schema.parse(json);
  }

  return {
    request,
    health: (): Promise<HealthReport> => request('GET', '/health', healthReportSchema),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
