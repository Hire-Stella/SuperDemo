import { Controller, Get, HttpCode, NotFoundException, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  type DemoCallOutput,
  type DemoCallsView,
  PlaceDemoCallInput,
  WebCallInput,
  type WebCallOutput,
  composeE164,
  countryByCode,
  isPlausibleNumber,
} from '@superdemo/contracts';
import { DograhService } from './dograh.service';
import { Roles } from '../../auth/guards';
import { ZodBody } from '../../shared/zod.pipe';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../tenancy/tenant-context.service';

/**
 * The three demo dialers — inbound, outbound and info — on their own route.
 *
 * Separate from DograhController because the two answer to different people.
 * That one stores a bearer credential for the client's whole voice platform and
 * is ADMIN-only; this one points already-stored credentials at a workflow and
 * rings a phone, which is the same right a SUPERVISOR already has over the
 * dialler and the softphone.
 */
@Controller('demo-calls')
export class DemoCallsController {
  constructor(
    private readonly dograh: DograhService,
    private readonly tenants: TenantContext,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * The sidebar hides this page when `demoCallsEnabled` is off, but a
   * bookmarked URL or a stray script does not read the sidebar — the same
   * reason `sites.service.ts` checks `websiteEnabled` before serving a page
   * rather than trusting the UI to have hidden the link.
   */
  private async assertEnabled(orgId: string): Promise<void> {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { demoCallsEnabled: true },
    });
    if (!org?.demoCallsEnabled) throw new NotFoundException('Demo calls is off for this centre');
  }

  /**
   * The three slots, as this centre's own staff may see them.
   *
   * `workflows` is emptied on the way out. It is every workflow on the Dograh
   * host, and a centre with no key of its own is using the deployment's — so
   * that list names other clients' agents. The operator picks from it on the
   * platform page; a centre's admin only needs to know which agent answers
   * here, which `workflowName` already says.
   */
  @Roles('ADMIN', 'SUPERVISOR')
  @Get()
  async view(): Promise<DemoCallsView> {
    const orgId = this.tenants.requireOrgId();
    await this.assertEnabled(orgId);
    const v = await this.dograh.dialersView(orgId);
    return { ...v, workflows: [], workflowsError: null };
  }

  /**
   * The browser-call script for one slot.
   *
   * Not throttled like the phone dialer: this costs nothing to place, rings
   * nobody's handset, and the expensive half — minting a token — happens at
   * most once per workflow because the service reuses any token that already
   * exists for it.
   */
  @Roles('ADMIN', 'SUPERVISOR')
  @Post('web-call')
  @HttpCode(200)
  async webCall(@ZodBody(WebCallInput) body: WebCallInput): Promise<WebCallOutput> {
    const orgId = this.tenants.requireOrgId();
    await this.assertEnabled(orgId);
    return this.dograh.webCallScript(orgId, body.kind);
  }

  /**
   * Ring a number with one slot's agent.
   *
   * Throttled at three a minute for the same reason as the Website page's demo
   * call, and the limit is shared across all three slots on purpose: this rings
   * a real handset on the client's carrier account, and "three per dialer"
   * would have made a page with three buttons nine times as expensive to sit
   * on. There is no campaign, pacing or opt-out list between this and the
   * phone.
   */
  @Roles('ADMIN', 'SUPERVISOR')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('call')
  @HttpCode(200)
  async call(@ZodBody(PlaceDemoCallInput) body: PlaceDemoCallInput): Promise<DemoCallOutput> {
    const orgId = this.tenants.requireOrgId();
    await this.assertEnabled(orgId);
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
    const r = await this.dograh.placeDialerCall(orgId, body.kind, phoneE164, body.note);
    return { ...r, dialled: r.ok ? phoneE164 : null };
  }
}
