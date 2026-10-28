import {
  Controller,
  Get,
  HttpCode,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  type ConnectDograhSiteOutput,
  type DemoCallsView,
  type DograhConnectionView,
  type DograhWorkflowRow,
  BuildDemoAgentsInput,
  DEMO_DIALER_KINDS,
  DograhDialers,
  SaveDemoDialerInput,
  SaveDograhConnectionInput,
  type TestDograhConnectionOutput,
} from '@superdemo/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenancy/tenant-context.service';
import { DograhService } from '../integrations/dograh/dograh.service';
import { EnrichmentService } from '../integrations/enrichment/enrichment.service';
import { CurrentUser, Platform, Roles } from '../auth/guards';
import { ZodBody } from '../shared/zod.pipe';
import type { SessionUser } from '@superdemo/contracts';

/**
 * Voice configuration, moved out of the tenant's own hands.
 *
 * ## Why this is not a preference
 *
 * A centre with no Dograh key of its own inherits `DOGRAH_API_KEY`, which is
 * the *deployment's* key — and on this deployment every centre inherits it,
 * because nobody has ever saved their own. That key is not scoped to a tenant:
 * `/workflow/fetch` with it returns every workflow on the host. So the workflow
 * picker a centre's admin was being shown listed other clients' agents by name
 * — their business, their use case, sometimes their phrasing — and any of them
 * could be selected and then talked to.
 *
 * That is a cross-tenant read, and no amount of filtering fixes it from this
 * side: Dograh has no notion of which of our tenants a workflow belongs to.
 * The only sound answer is that choosing a workflow is a platform operator's
 * act, because the operator is the party entitled to see the whole host.
 *
 * ## What a centre's own admin keeps
 *
 * Everything that only touches their own centre: placing a demo call with the
 * agent the operator wired, talking to it in the browser, and reading which
 * agent that is. They lose the ability to browse the host, to repoint a slot,
 * and to store or replace the API key.
 *
 * ## Why the routes live here rather than on the tenant controllers
 *
 * A SUPERADMIN is write-banned outside `@Platform()` routes — see
 * applySuperadminScope. So "make this superadmin-only" cannot be done by
 * changing @Roles on a tenant route: that would lock out the tenant admin and
 * the operator both, leaving a setting nobody on the platform can change.
 */
@Platform()
@Roles('SUPERADMIN')
@Controller('platform/orgs/:id/voice')
export class PlatformVoiceController {
  private readonly log = new Logger(PlatformVoiceController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantContext,
    private readonly dograh: DograhService,
    private readonly enrichment: EnrichmentService,
  ) {}

  /** Fails loudly rather than writing another centre's row on a typo'd id. */
  private async assertOrg(id: string): Promise<void> {
    const org = await this.tenants.runAs(null, null, () =>
      this.prisma.organization.findUnique({ where: { id }, select: { id: true } }),
    );
    if (!org) throw new NotFoundException('Organisation not found');
  }

  @Get()
  async view(
    @Param('id') id: string,
    @CurrentUser() actor: SessionUser,
  ): Promise<{
    connection: DograhConnectionView;
    demoCalls: DemoCallsView;
    build: { status: string; error: string | null };
  }> {
    await this.assertOrg(id);
    return this.tenants.runAs(id, actor.id, async () => {
      const [connection, demoCalls, enrich] = await Promise.all([
        this.dograh.view(id),
        this.dograh.dialersView(id),
        this.enrichment.view(id),
      ]);
      return { connection, demoCalls, build: { status: enrich.status, error: enrich.error } };
    });
  }

  /** Every workflow on the host — which is exactly why this is operator-only. */
  @Get('workflows')
  async workflows(
    @Param('id') id: string,
    @CurrentUser() actor: SessionUser,
  ): Promise<DograhWorkflowRow[]> {
    await this.assertOrg(id);
    return this.tenants.runAs(id, actor.id, () => this.dograh.workflows(id));
  }

  /**
   * Save the centre's Dograh, then build whatever agents it is waiting on.
   *
   * A centre created before its Dograh was connected has its chosen slots
   * switched on and empty, and the build that would have filled them could not
   * run — there was nothing to build on. Connecting is the moment that changes,
   * so it is also the moment to start the build, rather than leaving the
   * operator to discover a second button after the first one worked.
   *
   * Only when the saved credential actually answers: queueing a build against
   * a host that refuses would just turn into a failed status minutes later.
   * And never at the expense of the save — the connection is stored by the
   * time any of this runs, so a hiccup here is logged and the response is the
   * same view the panel has always received.
   */
  @Put('connection')
  async saveConnection(
    @Param('id') id: string,
    @ZodBody(SaveDograhConnectionInput) body: SaveDograhConnectionInput,
    @CurrentUser() actor: SessionUser,
  ): Promise<DograhConnectionView> {
    await this.assertOrg(id);
    const view = await this.tenants.runAs(id, actor.id, () => this.dograh.save(id, body));
    try {
      await this.tenants.runAs(id, actor.id, () => this.buildMissingAgents(id));
    } catch (e) {
      this.log.warn(
        `voice: saved Dograh for org=${id} but could not queue its agents — ` +
          `${e instanceof Error ? e.message : String(e)}`,
      );
    }
    return view;
  }

  /**
   * Queue a build for the switched-on slots with no agent, if Dograh answers.
   *
   * Skipped while a build or enrichment is already queued or running: that one
   * will fill the same slots, and a second would race it into duplicate agents.
   */
  private async buildMissingAgents(id: string): Promise<void> {
    const test = await this.dograh.test(id);
    if (!test.ok) return;
    const setting = await this.prisma.setting.findFirst({
      where: { orgId: id },
      select: { dograhDialers: true, enrichStatus: true },
    });
    if (!setting) return;
    if (setting.enrichStatus === 'queued' || setting.enrichStatus === 'running') return;
    const parsed = DograhDialers.safeParse(setting.dograhDialers ?? {});
    if (!parsed.success) return;
    const missing = DEMO_DIALER_KINDS.filter(
      (kind) => parsed.data[kind].enabled && !parsed.data[kind].workflowId,
    );
    if (missing.length === 0) return;
    this.log.log(`voice: Dograh connected for org=${id}; building ${missing.join(', ')}`);
    await this.enrichment.enqueueBuildAgents(id, missing);
  }

  @Post('test')
  @HttpCode(200)
  async test(
    @Param('id') id: string,
    @CurrentUser() actor: SessionUser,
  ): Promise<TestDograhConnectionOutput> {
    await this.assertOrg(id);
    return this.tenants.runAs(id, actor.id, () => this.dograh.test(id));
  }

  /** Mint the landing page's embed token for the chosen workflow. */
  @Post('connect')
  @HttpCode(200)
  async connect(
    @Param('id') id: string,
    @CurrentUser() actor: SessionUser,
  ): Promise<ConnectDograhSiteOutput> {
    await this.assertOrg(id);
    return this.tenants.runAs(id, actor.id, () => this.dograh.connectSite(id));
  }

  /**
   * Build the demo-call agents this centre is missing, in the background.
   *
   * Returns at once; the panel polls `GET` (which carries `build`) until the
   * chosen slots fill or the build reports a failure.
   */
  @Post('build-agents')
  @HttpCode(202)
  async buildAgents(
    @Param('id') id: string,
    @ZodBody(BuildDemoAgentsInput) body: BuildDemoAgentsInput,
  ): Promise<{ queued: true }> {
    await this.assertOrg(id);
    await this.enrichment.enqueueBuildAgents(id, body.kinds);
    return { queued: true };
  }

  /** Give this centre's agents the calendar's check-availability and book tools. */
  @Post('booking')
  @HttpCode(200)
  async enableBooking(
    @Param('id') id: string,
    @CurrentUser() actor: SessionUser,
  ): Promise<{ ok: boolean; detail: string; workflows: number[] }> {
    await this.assertOrg(id);
    return this.tenants.runAs(id, actor.id, () => this.dograh.enableBooking(id));
  }

  /** Point one demo-call slot at a workflow, or switch it on and off. */
  @Put('dialers')
  async saveDialer(
    @Param('id') id: string,
    @ZodBody(SaveDemoDialerInput) body: SaveDemoDialerInput,
    @CurrentUser() actor: SessionUser,
  ): Promise<DemoCallsView> {
    await this.assertOrg(id);
    return this.tenants.runAs(id, actor.id, () => this.dograh.saveDialer(id, body));
  }
}
