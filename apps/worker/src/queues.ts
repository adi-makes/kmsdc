/** Queue names. Every queue the worker consumes is declared here. */
export const QUEUES = {
  /** Internal maintenance jobs (heartbeat; later: session cleanup, outbox relay). */
  system: 'system',
} as const;

export const HEARTBEAT_JOB = 'heartbeat';
export const HEARTBEAT_INTERVAL_MS = 30_000;
