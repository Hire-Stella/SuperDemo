import { Controller, Get, HttpCode, NotFoundException, Param, Post, Put } from '@nestjs/common';
import {
  type ConnectDograhSiteOutput,
  type DemoCallsView,
  type DograhConnectionView,
  type DograhWorkflowRow,
  SaveDemoDialerInput,
  SaveDograhConnectionInput,
  type TestDograhConnectionOutput,
} from '@superdemo/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenancy/tenant-context.service';
import { DograhService } from '../integrations/dograh/dograh.service';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantContext,
    private readonly dograh: DograhService,
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
  ): Promise<{ connection: DograhConnectionView; demoCalls: DemoCallsView }> {
    await this.assertOrg(id);
    return this.tenants.runAs(id, actor.id, async () => ({
      connection: await this.dograh.view(id),
      demoCalls: await this.dograh.dialersView(id),
    }));
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

  @Put('connection')
  async saveConnection(
    @Param('id') id: string,
    @ZodBody(SaveDograhConnectionInput) body: SaveDograhConnectionInput,
    @CurrentUser() actor: SessionUser,
  ): Promise<DograhConnectionView> {
    await this.assertOrg(id);
    return this.tenants.runAs(id, actor.id, () => this.dograh.save(id, body));
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
