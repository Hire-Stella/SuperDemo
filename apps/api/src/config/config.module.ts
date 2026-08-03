import { Global, Module } from '@nestjs/common';
import { type ApiEnv, parseApiEnv } from '@fit-ai/contracts';

export const ENV = Symbol('ENV');

/**
 * Environment is parsed exactly once, at module construction. A bad `.env`
 * kills the process at boot with a readable message rather than surfacing as
 * `undefined` three layers deep during a demo.
 */
@Global()
@Module({
  providers: [
    {
      provide: ENV,
      useFactory: (): ApiEnv => parseApiEnv(process.env),
    },
  ],
  exports: [ENV],
})
export class ConfigModule {}
