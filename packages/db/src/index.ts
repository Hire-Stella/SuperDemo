import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';
export { PrismaClient };
export * from './embedding';
export * from './tenant';

/**
 * Singleton across hot reloads. Nest's dev watcher and Next's route handlers
 * both re-import this module; without the global cache you exhaust Postgres
 * connections within a few saves.
 */
const globalForPrisma = globalThis as unknown as { __fitAiPrisma?: PrismaClient };

export function createPrismaClient(): PrismaClient {
  if (globalForPrisma.__fitAiPrisma) return globalForPrisma.__fitAiPrisma;
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [{ emit: 'event', level: 'query' }, 'warn', 'error']
        : ['warn', 'error'],
  });
  if (process.env.NODE_ENV !== 'production') globalForPrisma.__fitAiPrisma = client;
  return client;
}
