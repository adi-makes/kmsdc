export type HealthStatus = 'ok' | 'degraded' | 'down';

export interface DependencyCheck {
  status: 'up' | 'down';
  latencyMs?: number;
  /** Short, non-sensitive description of the failure. */
  error?: string;
}

export interface HealthReport {
  service: 'api' | 'worker' | 'web';
  status: HealthStatus;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
  checks: Record<string, DependencyCheck>;
}
