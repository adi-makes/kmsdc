export const PG_POOL = Symbol('PG_POOL');
export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

/** Minimal surface the health checks need — keeps tests free of real connections. */
export interface SqlPinger {
  query(sql: string): Promise<unknown>;
  end(): Promise<void>;
}

export interface RedisPinger {
  ping(): Promise<string>;
  quit(): Promise<string>;
}
