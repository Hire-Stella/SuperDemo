import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenancy/tenant-context.service';
import { DograhService } from '../integrations/dograh/dograh.service';
import { EnrichmentService } from '../integrations/enrichment/enrichment.service';
import { missingKinds } from './platform-settings.controller';

/** Arbitrary, fixed: identifies this job's advisory lock across processes. */
const LOCK_KEY = 4_242_001;

/**
 * Fill empty demo slots once, shortly after the API starts.
 *
 * Replaces the manual `pnpm agents:backfill --apply` step after a deploy. A
 * centre whose demo slots are switched on but have no agent — made before
 * agents were built automatically, or while no Dograh was connected — is
 * queued for a build, provided a Dograh now resolves for it (its own, the
 * platform setting or the environment). Centres with nothing to connect to
 * are left alone; saving the platform setting queues them later.
 *
 * Once per boot, not on a timer: a centre whose build keeps failing is retried
 * at the next deploy rather than every few minutes. The advisory lock keeps a
 * second process (the worker, another replica) from queueing the same centres
 * at the same moment.
 */
@Injectable()
export class AgentsBootstrapService implements OnApplicationBootstrap {
  private readonly log = new Logger(AgentsBootstrapService.name);
  private static readonly DELAY_MS = 30_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantContext,
    private readonly dograh: DograhService,
    private readonly enrichment: EnrichmentService,
  ) {}

  onApplicationBootstrap(): void {
    if (process.env.NODE_ENV === 'test' || process.env.VITEST) return;
    setTimeout(() => void this.run(), AgentsBootstrapService.DELAY_MS).unref();
  }

  async run(): Promise<number> {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const [lock] = await tx.$queryRaw<{ locked: boolean }[]>`
            SELECT pg_try_advisory_xact_lock(${LOCK_KEY}) AS locked`;
          if (!lock?.locked) return 0;
          return this.queueAll();
        },
        { timeout: 120_000 },
      );
    } catch (e) {
      this.log.warn(`startup agent fill skipped — ${e instanceof Error ? e.message : e}`);
      return 0;
    }
  }

  private async queueAll(): Promise<number> {
    const rows = await this.tenants.runAs(null, null, () =>
      this.prisma.setting.findMany({
        where: { enrichStatus: { notIn: ['queued', 'running'] } },
        select: { orgId: true, dograhDialers: true },
      }),
    );
    let queued = 0;
    for (const row of rows) {
      const missing = missingKinds(row.dograhDialers);
      if (missing.length === 0) continue;
      try {
        const connection = await this.tenants.runAs(row.orgId, null, () => this.dograh.view(row.orgId));
        if (!connection.connected) continue;
        await this.tenants.runAs(row.orgId, null, () => this.enrichment.enqueueBuildAgents(row.orgId, missing));
        queued++;
      } catch (e) {
        this.log.warn(`startup agent fill: org=${row.orgId} skipped — ${e instanceof Error ? e.message : e}`);
      }
    }
    if (queued > 0) this.log.log(`startup agent fill: queued ${queued} centre(s) with empty demo slots`);
    return queued;
  }
}
