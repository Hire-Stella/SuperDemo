import { Controller, Get, HttpCode, Post, Put } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  type DemoCallOutput,
  type DemoCallsView,
  PlaceDemoCallInput,
  SaveDemoDialerInput,
  WebCallInput,
  type WebCallOutput,
  composeE164,
  countryByCode,
  isPlausibleNumber,
} from '@superdemo/contracts';
import { DograhService } from './dograh.service';
import { Roles } from '../../auth/guards';
import { ZodBody } from '../../shared/zod.pipe';
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
  ) {}

  @Roles('ADMIN', 'SUPERVISOR')
  @Get()
  view(): Promise<DemoCallsView> {
    return this.dograh.dialersView(this.tenants.requireOrgId());
  }

  /** Point one slot at a workflow, or switch it on and off. */
  @Roles('ADMIN', 'SUPERVISOR')
  @Put()
  save(@ZodBody(SaveDemoDialerInput) body: SaveDemoDialerInput): Promise<DemoCallsView> {
    return this.dograh.saveDialer(this.tenants.requireOrgId(), body);
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
  webCall(@ZodBody(WebCallInput) body: WebCallInput): Promise<WebCallOutput> {
    return this.dograh.webCallScript(this.tenants.requireOrgId(), body.kind);
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
    const r = await this.dograh.placeDialerCall(
      this.tenants.requireOrgId(),
      body.kind,
      phoneE164,
      body.note,
    );
    return { ...r, dialled: r.ok ? phoneE164 : null };
  }
}
