import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { Redis } from 'ioredis';
import type { ApiEnv } from '@superdemo/contracts';
import { ENV } from '../config/config.module';

export const REDIS = Symbol('REDIS');
/** Separate connection: a client in subscribe mode can't run other commands. */
export const REDIS_SUB = Symbol('REDIS_SUB');
/** BullMQ requires maxRetriesPerRequest: null on its connections. */
export const REDIS_BULL = Symbol('REDIS_BULL');

function make(url: string, opts: Record<string, unknown> = {}): Redis {
  return new Redis(url, { lazyConnect: false, ...opts });
}

@Global()
@Module({
  providers: [
    { provide: REDIS, useFactory: (env: ApiEnv) => make(env.REDIS_URL), inject: [ENV] },
    { provide: REDIS_SUB, useFactory: (env: ApiEnv) => make(env.REDIS_URL), inject: [ENV] },
    {
      provide: REDIS_BULL,
      useFactory: (env: ApiEnv) => make(env.REDIS_URL, { maxRetriesPerRequest: null }),
      inject: [ENV],
    },
  ],
  exports: [REDIS, REDIS_SUB, REDIS_BULL],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(
    @Inject(REDIS) private readonly pub: Redis,
    @Inject(REDIS_SUB) private readonly sub: Redis,
    @Inject(REDIS_BULL) private readonly bull: Redis,
  ) {}

  async onApplicationShutdown(): Promise<void> {
    await Promise.allSettled([this.pub.quit(), this.sub.quit(), this.bull.quit()]);
  }
}
