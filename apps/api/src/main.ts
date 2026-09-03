import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { parseApiEnv } from '@superdemo/contracts';
import { DriverErrorFilter } from './shared/driver-error.filter';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  // Parse before Nest boots so a bad .env fails with a readable message rather
  // than a stack trace from three layers down.
  const env = parseApiEnv(process.env);

  const app = await NestFactory.create(AppModule, {
    // Webhook signatures are computed over the exact bytes received, so the raw
    // body must be preserved alongside the parsed one. Nest's own option does
    // this without displacing its body parser — mounting express.json() by hand
    // silently left req.body undefined on every route, login included.
    rawBody: true,
    logger:
      env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug'],
  });

  app.setGlobalPrefix('api', { exclude: ['health', 'ready'] });

  app.use(
    helmet({
      // The dashboard is served from a different origin in dev, and recordings
      // stream as blobs — CSP is enforced at the web app, not here.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser());

  app.enableCors({
    origin: [env.WEB_ORIGIN],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    // content-disposition is not a CORS-safelisted response header, so without
    // this the dashboard cannot read the server-chosen filename and every export
    // silently downloads as "download.csv".
    exposedHeaders: ['content-disposition'],
  });

  app.useGlobalFilters(new DriverErrorFilter());

  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: false }),
  );

  // Drain in-flight calls rather than dropping them on redeploy.
  app.enableShutdownHooks();

  /*
   * PORT beats API_PORT.
   *
   * Managed hosts inject PORT and route to whatever the process binds; one that
   * binds something else fails its health check and is restarted forever with
   * nothing in the log explaining it. Read here rather than in the schema so
   * the value the process actually used is the value it prints below.
   */
  const port = Number(process.env['PORT'] ?? env.API_PORT);
  await app.listen(port);

  const log = new Logger('Bootstrap');
  log.log(`API listening on http://localhost:${port}/api`);
  log.log(
    `drivers → telephony=${env.TELEPHONY_DRIVER} messaging=${env.MESSAGING_DRIVER} ` +
      `llm=${env.LLM_DRIVER} crm=${env.CRM_DRIVER} storage=${env.STORAGE_DRIVER}`,
  );
}

void bootstrap();
