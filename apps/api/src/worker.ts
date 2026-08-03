import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { parseApiEnv } from '@fit-ai/contracts';
import { AppModule } from './app.module';
import { OutboxService } from './outbox/outbox.service';

/**
 * Worker entrypoint — same codebase, no HTTP listener.
 *
 * In development `pnpm dev` runs the API with its outbox drainer inline, which
 * is simpler and adequate. In production this runs as a separate process so a
 * slow CRM push can never add latency to a live call, and so the two can be
 * scaled independently.
 */
async function bootstrap(): Promise<void> {
  const env = parseApiEnv(process.env);
  const log = new Logger('Worker');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  app.enableShutdownHooks();

  const outbox = app.get(OutboxService);
  outbox.startPolling(2000);

  log.log(`worker started (crm=${env.CRM_DRIVER}) — draining outbox every 2s`);

  const shutdown = async (signal: string): Promise<void> => {
    log.log(`${signal} received — draining once more then exiting`);
    await outbox.drain().catch(() => undefined);
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

void bootstrap();
