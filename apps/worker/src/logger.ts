import { pino, type Logger } from 'pino';

export function createLogger(level: string, pretty: boolean): Logger {
  return pino({
    name: 'worker',
    level,
    // Job payloads carry IDs only, but redact defensively (privacy-design.md §3).
    redact: {
      paths: ['*.phone', '*.email', '*.fullName', '*.body', '*.content', '*.token', '*.password'],
      censor: '[REDACTED]',
    },
    ...(pretty ? { transport: { target: 'pino-pretty', options: { singleLine: true } } } : {}),
  });
}
