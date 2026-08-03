import { Controller, Get, Inject } from '@nestjs/common';
import type { Redis } from 'ioredis';
import type { ApiEnv } from '@fit-ai/contracts';
import { PrismaService } from './prisma/prisma.service';
import { REDIS } from './redis/redis.module';
import { ENV } from './config/config.module';
import { Public } from './auth/guards';

@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS) private readonly redis: Redis,
    @Inject(ENV) private readonly env: ApiEnv,
  ) {}

  /** Liveness — is the process up. */
  @Public()
  @Get('health')
  health() {
    return { status: 'ok', uptimeSeconds: Math.round(process.uptime()) };
  }

  /**
   * Readiness — can it actually serve traffic. Gates deploys on Postgres and
   * Redis being reachable, and reports which drivers are active so an
   * environment can be identified at a glance.
   */
  @Public()
  @Get('ready')
  async ready() {
    const checks: Record<string, { ok: boolean; detail?: string }> = {};

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.postgres = { ok: true };
    } catch (error) {
      checks.postgres = { ok: false, detail: String(error) };
    }

    try {
      const pong = await this.redis.ping();
      checks.redis = { ok: pong === 'PONG' };
    } catch (error) {
      checks.redis = { ok: false, detail: String(error) };
    }

    const ok = Object.values(checks).every((c) => c.ok);
    return {
      status: ok ? 'ready' : 'degraded',
      checks,
      drivers: {
        telephony: this.env.TELEPHONY_DRIVER,
        messaging: this.env.MESSAGING_DRIVER,
        llm: this.env.LLM_DRIVER,
        crm: this.env.CRM_DRIVER,
        storage: this.env.STORAGE_DRIVER,
      },
    };
  }
}
