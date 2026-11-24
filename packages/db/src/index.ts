import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';

export * from './generated/prisma/client.js';

export interface CreatePrismaClientOptions {
  connectionString: string;
  /** Maximum pool connections (default 10). */
  max?: number;
}

/** Creates a Prisma client using the node-postgres driver adapter (Prisma 7). */
export function createPrismaClient({
  connectionString,
  max = 10,
}: CreatePrismaClientOptions): PrismaClient {
  const adapter = new PrismaPg({ connectionString, max });
  return new PrismaClient({ adapter });
}

/** PostgreSQL error codes the application maps to domain errors. */
export const PG_ERROR = {
  uniqueViolation: '23505',
  foreignKeyViolation: '23503',
  exclusionViolation: '23P01',
  raiseException: 'P0001',
} as const;
