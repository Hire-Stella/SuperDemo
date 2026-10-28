import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  Inject,
  Logger,
  Post,
  Put,
} from '@nestjs/common';
import {
  type ApiEnv,
  DEMO_DIALER_KINDS,
  type DemoDialerKind,
  DograhDialers,
  type PlatformDograhView,
  SavePlatformDograhInput,
  type SavePlatformDograhOutput,
  type SessionUser,
  type TestPlatformDograhOutput,
} from '@superdemo/contracts';
import { ENV } from '../config/config.module';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenancy/tenant-context.service';
import { DograhService } from '../integrations/dograh/dograh.service';
import { EnrichmentService } from '../integrations/enrichment/enrichment.service';
import { CurrentUser, Platform, Roles } from '../auth/guards';
import { ZodBody } from '../shared/zod.pipe';
import { type PlatformDograh, PlatformSettingsService } from './platform-settings.service';

/** A Setting row with no Dograh of its own — it falls back to the platform's. */
const NO_OWN_DOGRAH = {
  OR: [{ dograhBaseUrl: null }, { dograhBaseUrl: '' }],
  dograhSecretsEnc: null,
};

/**
 * The platform-wide Dograh: the voice host every centre without its own uses.
 *
 * Operator-only for the same reason as PlatformVoiceController — the key sees
 * every workflow on the host. @Platform is also what lets a SUPERADMIN write
 * here at all (applySuperadminScope bans their writes elsewhere).
 *
 * The key goes in and never comes back out: responses carry only whether one
 * is stored and its last four characters.
 */
@Platform()
@Roles('SUPERADMIN')
@Controller('platform/settings/dograh')
export class PlatformSettingsController {
  private readonly log = new Logger(PlatformSettingsController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantContext,
    private readonly settings: PlatformSettingsService,
    private readonly dograh: DograhService,
    private readonly enrichment: EnrichmentService,
    @Inject(ENV) private readonly env: ApiEnv,
  ) {}

  @Get()
  async view(): Promise<PlatformDograhView> {
    return this.buildView(await this.settings.dograh());
  }

  /**
   * Save the platform Dograh, then build the agents centres were waiting on.
   *
   * The credential is tested before it is stored: a host or key that does not
   * answer would silently break every centre that falls back to it, so it is
   * refused with Dograh's own reason instead.
   */
  @Put()
  async save(
    @ZodBody(SavePlatformDograhInput) body: SavePlatformDograhInput,
    @CurrentUser() actor: SessionUser,
  ): Promise<SavePlatformDograhOutput> {
    const stored = await this.settings.dograh();
    const key = body.apiKey ?? stored.apiKey;
    if (key) {
      const test = await this.dograh.testConnection(body.baseUrl, key);
      if (!test.ok) throw new BadRequestException(test.detail);
    }

    const saved = await this.settings.saveDograh(body, actor.id);

    // Platform scope: AuditLog is tenant-scoped, and "" is the platform's orgId.
    await this.tenants.runAs(null, actor.id, () =>
      this.prisma.auditLog.create({
        data: {
          orgId: '',
          actorId: actor.id,
          action: 'platform.dograh.update',
          target: 'platform',
          metadata: {
            baseUrl: saved.baseUrl,
            keyChanged: Boolean(body.apiKey),
            apiKeyLast4: saved.apiKeyLast4,
          },
        },
      }),
    );

    const view = await this.buildView(saved);
    const queuedCentres =
      view.effectiveSource === 'none' ? 0 : await this.queueMissingAgents(actor.id);
    return { view, queuedCentres };
  }

  /** Test a host and key without saving; the stored key when none is typed. */
  @Post('test')
  @HttpCode(200)
  async test(
    @ZodBody(SavePlatformDograhInput) body: SavePlatformDograhInput,
  ): Promise<TestPlatformDograhOutput> {
    const key = body.apiKey ?? (await this.settings.dograh()).apiKey;
    if (!key) return { ok: false, detail: 'No API key to test — enter one' };
    return this.dograh.testConnection(body.baseUrl, key);
  }

  private async buildView(p: PlatformDograh): Promise<PlatformDograhView> {
    const envBase = Boolean(this.env.DOGRAH_BASE_URL?.trim());
    const envKey = Boolean(this.env.DOGRAH_API_KEY?.trim());
    const centresUsing = await this.tenants.runAs(null, null, () =>
      this.prisma.setting.count({ where: NO_OWN_DOGRAH }),
    );
    return {
      baseUrl: p.baseUrl,
      hasApiKey: Boolean(p.apiKey || p.apiKeyLast4),
      apiKeyLast4: p.apiKeyLast4,
      effectiveSource:
        p.baseUrl && p.apiKey ? 'platform' : envBase && envKey ? 'deployment' : 'none',
      deploymentFallback: { baseUrl: envBase, hasApiKey: envKey },
      centresUsing,
      updatedAt: p.updatedAt,
    };
  }

  /**
   * Queue a build for every fallback centre with switched-on, empty slots.
   *
   * Skips centres with a build or enrichment already queued or running — that
   * one fills the same slots, and a second would race it into duplicates. One
   * centre failing to queue is logged and does not stop the rest.
   */
  private async queueMissingAgents(actorId: string): Promise<number> {
    const rows = await this.tenants.runAs(null, null, () =>
      this.prisma.setting.findMany({
        where: { ...NO_OWN_DOGRAH, enrichStatus: { notIn: ['queued', 'running'] } },
        select: { orgId: true, dograhDialers: true, enrichStatus: true },
      }),
    );
    let queued = 0;
    for (const row of rows) {
      if (row.enrichStatus === 'queued' || row.enrichStatus === 'running') continue;
      const missing = missingKinds(row.dograhDialers);
      if (missing.length === 0) continue;
      try {
        await this.tenants.runAs(row.orgId, actorId, () =>
          this.enrichment.enqueueBuildAgents(row.orgId, missing),
        );
        queued++;
        this.log.log(`platform Dograh saved; building ${missing.join(', ')} for org=${row.orgId}`);
      } catch (e) {
        this.log.warn(
          `platform Dograh saved but could not queue agents for org=${row.orgId} — ` +
            `${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
    return queued;
  }
}

/** Switched-on slots with no agent behind them (neither workflow id nor uuid). */
function missingKinds(raw: unknown): DemoDialerKind[] {
  const parsed = DograhDialers.safeParse(raw ?? {});
  if (!parsed.success) return [];
  return DEMO_DIALER_KINDS.filter((kind) => {
    const slot = parsed.data[kind];
    return slot.enabled && !slot.workflowId && !slot.workflowUuid;
  });
}
