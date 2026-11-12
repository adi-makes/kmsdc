/**
 * Environment-variable schemas shared across apps.
 *
 * Every process validates its environment at start-up and fails fast with a readable
 * message. Secrets are never logged: only variable names and validation issues are printed.
 */
import { z } from 'zod';

const port = z.coerce.number().int().min(1).max(65_535);

/** Treats "", "0", "false", "no" as false; "1", "true", "yes" as true. */
export const booleanFromString = z
  .enum(['', '0', '1', 'true', 'false', 'yes', 'no'])
  .default('false')
  .transform((v) => v === '1' || v === 'true' || v === 'yes');

export const nodeEnvSchema = z.enum(['development', 'test', 'production']).default('development');

/** Values every server-side process needs. */
export const sharedServerEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CLINIC_TIMEZONE: z.string().min(1).default('Asia/Kolkata'),
  DATABASE_URL: z
    .url()
    .refine((v) => v.startsWith('postgres://') || v.startsWith('postgresql://'), {
      message: 'must be a postgres:// or postgresql:// URL',
    }),
  REDIS_URL: z.url().refine((v) => v.startsWith('redis://') || v.startsWith('rediss://'), {
    message: 'must be a redis:// or rediss:// URL',
  }),
});

export const storageEnvSchema = z.object({
  S3_ENDPOINT: z.url(),
  S3_REGION: z.string().min(1).default('ap-south-1'),
  S3_ACCESS_KEY_ID: z.string().min(3),
  S3_SECRET_ACCESS_KEY: z.string().min(8),
  S3_BUCKET_PRIVATE: z.string().min(3).default('kmsdc-private'),
  S3_FORCE_PATH_STYLE: booleanFromString,
  S3_SIGNED_URL_TTL_SECONDS: z.coerce.number().int().min(30).max(900).default(300),
});

export const apiEnvSchema = sharedServerEnvSchema.extend({
  API_PORT: port.default(4000),
  API_PUBLIC_URL: z.url().default('http://localhost:4000'),
  WEB_ORIGIN: z.url().default('http://localhost:3000'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  SESSION_IDLE_TIMEOUT_MINUTES: z.coerce.number().int().min(5).default(720),
  SESSION_ABSOLUTE_TIMEOUT_HOURS: z.coerce.number().int().min(1).default(168),
  COOKIE_SECURE: booleanFromString,
  ENABLE_SWAGGER: booleanFromString,
  TRUST_PROXY: booleanFromString,
  ...storageEnvSchema.shape,
});

export const workerEnvSchema = sharedServerEnvSchema.extend({
  WORKER_HEALTH_PORT: port.default(4001),
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(50).default(5),
  /** Hard safety switch: even with live credentials, nothing real is sent unless this is true. */
  ALLOW_LIVE_SENDS: booleanFromString,
});

export const webServerEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  /** Internal URL Next.js uses to proxy /api/v1/* to the NestJS API. */
  API_INTERNAL_URL: z.url().default('http://localhost:4000'),
});

export const webPublicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type WorkerEnv = z.infer<typeof workerEnvSchema>;
export type WebServerEnv = z.infer<typeof webServerEnvSchema>;
export type WebPublicEnv = z.infer<typeof webPublicEnvSchema>;

export class EnvValidationError extends Error {
  constructor(
    public readonly processName: string,
    public readonly issues: readonly string[],
  ) {
    super(
      `[${processName}] Invalid environment configuration:\n` +
        issues.map((i) => `  - ${i}`).join('\n') +
        '\nCopy .env.example to .env and fill in the missing values.',
    );
    this.name = 'EnvValidationError';
  }
}

/**
 * Parses `source` with `schema`; throws {@link EnvValidationError} listing every problem.
 * Values are never included in the error, only variable names and messages.
 */
export function parseEnv<TSchema extends z.ZodType>(
  processName: string,
  schema: TSchema,
  source: Record<string, string | undefined> = process.env,
): z.infer<TSchema> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => {
      const key = issue.path.join('.') || '(root)';
      return `${key}: ${issue.message}`;
    });
    throw new EnvValidationError(processName, issues);
  }
  return result.data;
}
