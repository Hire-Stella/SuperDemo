import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  type AvailabilityOutput,
  PublicBookingInput,
  type PublicBookingOutput,
  type VoiceAvailabilityOutput,
  VoiceBookInput,
  type VoiceBookOutput,
} from '@superdemo/contracts';
import { CalendarService } from './calendar.service';
import { CalcomService } from './calcom/calcom.service';
import { Public } from '../auth/guards';
import { ZodBody } from '../shared/zod.pipe';

/**
 * Booking from a centre's landing page.
 *
 * Mounted beside PublicSitesController under the same `public/sites/:slug`
 * prefix, so the page's whole public surface reads as one URL space — but kept
 * in this module, because what it does is book a calendar rather than serve a
 * page. Same rules as the lead form: every route public, the org always from
 * the slug, one 404 for every kind of "no page here".
 */
@Public()
@Controller('public/sites')
export class PublicSiteCalendarController {
  constructor(private readonly calendar: CalendarService) {}

  /** A read, but one that runs a slot computation — so not unlimited either. */
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Get(':slug/availability')
  async availability(
    @Param('slug') slug: string,
    @Query('date') date: string,
  ): Promise<AvailabilityOutput> {
    const out = await this.calendar.publicAvailability(slug, date);
    if (!out) throw new NotFoundException('No page here');
    return out;
  }

  /**
   * Ten a minute per address, the same budget as a callback request and for
   * the same reasons — see PublicSitesController.lead. A booking is worse to
   * abuse than a lead, since a script could fill a centre's week, which is why
   * it is not looser.
   */
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post(':slug/bookings')
  @HttpCode(200)
  book(
    @Param('slug') slug: string,
    @ZodBody(PublicBookingInput) body: PublicBookingInput,
  ): Promise<PublicBookingOutput> {
    return this.calendar.publicBook(slug, body);
  }
}

/**
 * The voice agent's calendar tools.
 *
 * A Dograh workflow calls these as plain HTTP tools mid-call, with no session
 * and no way to log in — so the per-centre token in the path is the whole
 * credential, minted by CalendarService.ensureToken and written into the
 * agent's tool URLs when it is provisioned. Path rather than header because
 * a tool definition in most voice platforms is a URL and little else.
 *
 * Both routes answer 200 with a `speech` sentence for anything the caller
 * said wrong; only an unknown token is an error. See CalendarService.voiceBook.
 */
@Public()
@Controller('public/calendar')
export class VoiceCalendarController {
  constructor(private readonly calendar: CalendarService) {}

  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Get(':token/availability')
  availability(
    @Param('token') token: string,
    @Query('date') date?: string,
  ): Promise<VoiceAvailabilityOutput> {
    return this.calendar.voiceAvailability(token, date);
  }

  /**
   * Parsed with the lenient schema rather than CreateBookingInput: an LLM
   * sends numbers as numbers and times in whatever shape it last saw, and a
   * 400 with field errors is something it cannot read out. A body that is not
   * even an object still falls through to a spoken refusal.
   */
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post(':token/book')
  @HttpCode(200)
  book(@Param('token') token: string, @Body() body: unknown): Promise<VoiceBookOutput> {
    const parsed = VoiceBookInput.safeParse(body && typeof body === 'object' ? body : {});
    return this.calendar.voiceBook(
      token,
      parsed.success ? parsed.data : { name: '', phone: '', start: '' },
    );
  }
}

/**
 * Cal.com's webhook. The token in the URL is the centre's calendar token and
 * the whole authentication: the body is not trusted or even read, it only
 * prompts a reconcile against Cal.com's API, so a forged call can do no more
 * than make us sync early.
 */
@Public()
@Controller('public/calcom')
export class CalcomWebhookController {
  constructor(private readonly calcom: CalcomService) {}

  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @Post(':token')
  @HttpCode(200)
  async hook(@Param('token') token: string): Promise<{ ok: true }> {
    await this.calcom.onWebhook(token);
    return { ok: true };
  }
}
