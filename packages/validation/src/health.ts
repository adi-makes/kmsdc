import { z } from 'zod';

export const dependencyCheckSchema = z.object({
  status: z.enum(['up', 'down']),
  latencyMs: z.number().optional(),
  error: z.string().optional(),
});

export const healthReportSchema = z.object({
  service: z.enum(['api', 'worker', 'web']),
  status: z.enum(['ok', 'degraded', 'down']),
  version: z.string(),
  uptimeSeconds: z.number(),
  timestamp: z.string(),
  checks: z.record(z.string(), dependencyCheckSchema),
});
