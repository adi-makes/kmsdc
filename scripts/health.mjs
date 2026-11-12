#!/usr/bin/env node
// Checks every local service and prints a status table. Exit code 1 if anything is down.
const targets = [
  ['web', 'http://localhost:3000/healthz'],
  ['api', 'http://localhost:4000/api/v1/health'],
  ['api via web proxy', 'http://localhost:3000/api/v1/health'],
  ['worker', 'http://localhost:4001/health'],
  ['minio', `http://localhost:${process.env.MINIO_API_PORT ?? 9010}/minio/health/live`],
  ['mailpit', `http://localhost:${process.env.MAILPIT_UI_PORT ?? 8035}/livez`],
];

let failed = 0;
for (const [name, url] of targets) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    const body = await res.text();
    let detail = '';
    try {
      const json = JSON.parse(body);
      if (json.checks) {
        detail = Object.entries(json.checks)
          .map(([k, v]) => `${k}:${v.status}`)
          .join(' ');
      }
    } catch {
      /* non-JSON body */
    }
    if (!res.ok) failed++;
    console.log(`${res.ok ? '✔' : '✘'} ${name.padEnd(18)} ${res.status} ${detail}`);
  } catch (error) {
    failed++;
    console.log(`✘ ${name.padEnd(18)} unreachable (${error.cause?.code ?? error.message})`);
  }
}
process.exit(failed ? 1 : 0);
