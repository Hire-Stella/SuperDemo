import { Controller, Get, HttpCode, Post, Put } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  DemoCallInput,
  type DemoCallOutput,
  type EnrichmentView,
  StartEnrichmentInput,
  composeE164,
  countryByCode,
  isPlausibleNumber,
  type ConnectDograhSiteOutput,
  type DograhConnectionView,
  type DograhWorkflowRow,
  SaveDograhConnectionInput,
  type TestDograhConnectionOutput,
} from '@superdemo/contracts';
import { DograhService } from './dograh.service';
import { EnrichmentService } from '../enrichment/enrichment.service';
import { Roles } from '../../auth/guards';
import { ZodBody } from '../../shared/zod.pipe';
import { TenantContext } from '../../tenancy/tenant-context.service';

/**
 * Connecting a centre's landing page to its own Dograh.
 *
 * ADMIN only — a SUPERVISOR may edit the page's copy but storing a bearer
 * credential for the client's whole voice platform is a narrower right than
 * editing marketing text. That is stricter than SitesController on purpose.
 */
@Controller('sites/mine/dograh')
export class DograhController {
  constructor(
    private readonly dograh: DograhService,
    private readonly enrichment: EnrichmentService,
    private readonly tenants: TenantContext,
  ) {}

  @Roles('ADMIN')
  @Get()
  view(): Promise<DograhConnectionView> {
    return this.dograh.view(this.tenants.requireOrgId());
  }

  @Roles('ADMIN')
  @Put()
  save(@ZodBody(SaveDograhConnectionInput) body: SaveDograhConnectionInput): Promise<DograhConnectionView> {
    return this.dograh.save(this.tenants.requireOrgId(), body);
  }

  /** Does the stored credential work? Answers rather than throws, so the editor
   *  can render the reason next to the field that caused it. */
  @Roles('ADMIN')
  @Post('test')
  test(): Promise<TestDograhConnectionOutput> {
    return this.dograh.test(this.tenants.requireOrgId());
  }

  @Roles('ADMIN')
  @Get('workflows')
  workflows(): Promise<DograhWorkflowRow[]> {
    return this.dograh.workflows(this.tenants.requireOrgId());
  }

  /** Mint the public embed token, domain-locked to where the page is served. */
  @Roles('ADMIN')
  @Post('connect')
  connect(): Promise<ConnectDograhSiteOutput> {
    return this.dograh.connectSite(this.tenants.requireOrgId());
  }

  /* --------------------- website-generated page and agent -------------------- */

  @Roles('ADMIN', 'SUPERVISOR')
  @Get('enrichment')
  enrichmentView(): Promise<EnrichmentView> {
    return this.enrichment.view(this.tenants.requireOrgId());
  }

  /**
   * Re-read the website and regenerate.
   *
   * ADMIN only and separate from the read above: this spends money on somebody
   * else's LLM and can overwrite copy a supervisor wrote.
   */
  @Roles('ADMIN')
  @Post('enrichment')
  @HttpCode(202)
  async startEnrichment(
    @ZodBody(StartEnrichmentInput) body: StartEnrichmentInput,
  ): Promise<{ ok: true }> {
    await this.enrichment.restart(
      this.tenants.requireOrgId(),
      body.websiteUrl,
      body.overwriteContent,
    );
    return { ok: true };
  }

  /**
   * Place a demo call from the platform.
   *
   * Three a minute. This rings a real telephone on the client's carrier
   * account, so the cost of a stuck retry loop or a bored demo-giver is real
   * money and a real person's phone — and unlike the dialler there is no
   * campaign, pacing or opt-out list between this and the handset.
   */
  @Roles('ADMIN', 'SUPERVISOR')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('demo-call')
  @HttpCode(200)
  async demoCall(@ZodBody(DemoCallInput) body: DemoCallInput): Promise<DemoCallOutput> {
    const country = countryByCode(body.country);
    const phoneE164 = composeE164(country, body.phone);
    if (!isPlausibleNumber(country, phoneE164)) {
      return {
        ok: false,
        detail: `That does not look like a ${country.name} number. Include the area code, e.g. ${country.example}.`,
        workflowRunId: null,
        dialled: null,
      };
    }
    const r = await this.dograh.demoCall(this.tenants.requireOrgId(), phoneE164, body.note);
    return { ...r, dialled: r.ok ? phoneE164 : null };
  }
}
