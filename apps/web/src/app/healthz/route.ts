import { parseEnv, webServerEnvSchema } from '@kmsdc/config/env';
import { buildWebHealth } from '@/lib/health';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const env = parseEnv('web', webServerEnvSchema);
  const report = await buildWebHealth(env.API_INTERNAL_URL);
  return Response.json(report, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}
