import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import {
  type AvailabilityOutput,
  type BookingRow,
  type BookingSource,
  CalendarConfig,
  type CalendarConfigView,
  type CreateBookingInput,
  ISO_DATE,
  type PublicBookingInput,
  type PublicBookingOutput,
  type VoiceAvailabilityOutput,
  type VoiceBookInput,
  type VoiceBookOutput,
  addDaysIso,
  composeE164,
  countryByCode,
  isPlausibleNumber,
  zonedParts,
  zonedTimeToUtc,
} from '@superdemo/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenancy/tenant-context.service';
import type { CalendarProvider } from './calendar.provider';
import { MockCalendarProvider, toBookingRow } from './mock-calendar.provider';
import { readCalendarSettings } from './calendar-settings';

/**
 * A centre's appointment book.
 *
 * Three callers, three ways of naming the centre, one service — the same split
 * as SitesService and for the same reason:
 *
 *  * the dashboard, whose request already carries a tenant context;
 *  * the landing page, which names the centre by slug;
 *  * a voice agent's HTTP tool, which names it by calendar token.
 *
 * The public and voice methods resolve the org themselves and do all of their
 * work inside `runAs(org.id, …)`. That is load-bearing, not tidiness: on a
 * @Public() route the tenant extension sees a null org, which means unscoped
 * rather than denied, so a booking read that forgot its runAs would see every
 * centre's appointments.
 */
@Injectable()
export class CalendarService {
  private readonly log = new Logger(CalendarService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantContext,
    private readonly mock: MockCalendarProvider,
  ) {}

  /* ============================ tenant-facing ============================= */

  /**
   * Bookings overlapping [from, to), cancelled ones included.
   *
   * Cancelled rows are returned rather than filtered: the week view shows them
   * struck through, because "Ahmed's 10:00 was cancelled" is something the
   * person about to ring Ahmed wants to know.
   */
  async list(from?: string, to?: string): Promise<BookingRow[]> {
    const start = parseInstant(from) ?? new Date(Date.now() - 7 * DAY_MS);
    const end = parseInstant(to) ?? new Date(start.getTime() + 14 * DAY_MS);
    if (end <= start) throw new BadRequestException('`to` must be after `from`');
    // A cap rather than pagination: the page asks for one week at a time, and a
    // year-long request is a mistake or a scrape, not a view anyone renders.
    if (end.getTime() - start.getTime() > 62 * DAY_MS) {
      throw new BadRequestException('Ask for at most 62 days at a time');
    }
    const rows = await this.prisma.calendarBooking.findMany({
      where: { startsAt: { lt: end }, endsAt: { gt: start } },
      orderBy: { startsAt: 'asc' },
      take: 1000,
    });
    return rows.map(toBookingRow);
  }

  async availability(date: string): Promise<AvailabilityOutput> {
    const orgId = this.tenants.requireOrgId();
    const provider = await this.providerFor(orgId);
    return provider.availability(orgId, requireDate(date));
  }

  async create(input: CreateBookingInput, source: BookingSource = 'dashboard'): Promise<BookingRow> {
    const orgId = this.tenants.requireOrgId();
    return this.bookFor(orgId, input, source);
  }

  async cancel(id: string): Promise<BookingRow> {
    const orgId = this.tenants.requireOrgId();
    const provider = await this.providerFor(orgId);
    const row = await provider.cancel(orgId, id);
    this.log.log(`booking ${row.id} cancelled`);
    return row;
  }

  async config(): Promise<CalendarConfigView> {
    const orgId = this.tenants.requireOrgId();
    return readCalendarSettings(this.prisma, orgId);
  }

  async updateConfig(input: CalendarConfig): Promise<CalendarConfigView> {
    const orgId = this.tenants.requireOrgId();
    /*
     * Refused up front rather than saved and then failing every read: a centre
     * that selected Cal.com today would have a calendar that 400s on the page,
     * the landing page and mid-call, all from one dropdown.
     */
    if (input.provider === 'calcom') throw calcomNotConnected();
    const config = CalendarConfig.parse(input);
    await this.prisma.setting.upsert({
      where: { orgId },
      create: { orgId, calendarConfig: config },
      update: { calendarConfig: config },
    });
    this.log.log(
      `calendar hours updated: ${config.openTime}–${config.closeTime}, ` +
        `${config.slotMinutes}m slots, days ${config.workingDays.join('')}`,
    );
    return readCalendarSettings(this.prisma, orgId);
  }

  /**
   * The centre's calendar token, minted on first call.
   *
   * Exported for voice-agent provisioning: whoever builds a Dograh workflow
   * for this centre calls this and writes the token into the agent's HTTP tool
   * URLs. Lazily rather than at org creation so every centre that already
   * exists gets one the first time it is needed, without a backfill.
   *
   * Runs in the centre's own context regardless of the caller's, so it is safe
   * to call from a platform route or a worker.
   */
  async ensureToken(orgId: string): Promise<string> {
    return this.tenants.runAs(orgId, null, async () => {
      const setting = await this.prisma.setting.findFirst({
        where: { orgId },
        select: { calendarToken: true },
      });
      if (setting?.calendarToken) return setting.calendarToken;

      // 24 random bytes: unguessable, URL-safe, and short enough to sit in a
      // tool URL an operator might have to read off a screen.
      const token = `cal_${randomBytes(24).toString('base64url')}`;
      await this.prisma.setting.upsert({
        where: { orgId },
        create: { orgId, calendarToken: token },
        update: { calendarToken: token },
      });
      this.log.log(`minted a calendar token for org ${orgId}`);
      return token;
    });
  }

  /* ========================= public: landing page ========================= */

  /** Free slots for a visitor. Null for every "no page here" case alike. */
  async publicAvailability(slug: string, date: string): Promise<AvailabilityOutput | null> {
    const org = await this.publishedOrg(slug);
    if (!org) return null;
    const day = requireDate(date);
    return this.tenants.runAs(org.id, null, async () => {
      const provider = await this.providerFor(org.id);
      return provider.availability(org.id, day);
    });
  }

  /**
   * A booking from the landing page.
   *
   * The same constraints as captureLead, for the same reason: the org comes
   * from the slug and never the body, the number is normalised before any
   * write, and a filled honeypot gets the same success a person would.
   */
  async publicBook(slug: string, input: PublicBookingInput): Promise<PublicBookingOutput> {
    if (input.company && input.company.trim() !== '') {
      return { ok: true, message: 'Thank you — your appointment is booked.' };
    }
    const org = await this.publishedOrg(slug);
    if (!org) throw new NotFoundException('No page here');

    return this.tenants.runAs(org.id, null, async () => {
      const row = await this.bookFor(org.id, input, 'website');
      const { timezone } = await readCalendarSettings(this.prisma, org.id);
      const firstName = input.name.split(/\s+/)[0];
      return {
        ok: true,
        message: `Thank you, ${firstName} — you are booked for ${spokenDay(row.startsAt, timezone)} at ${spokenTime(row.startsAt, timezone)}.`,
      };
    });
  }

  /* ========================== public: voice agent ========================= */

  /**
   * What the agent can offer.
   *
   * With no date — or a date the agent garbled — this looks ahead for the
   * first day with anything free, because "when can I come in?" is the
   * question callers actually ask, and an agent told "nothing on that day"
   * would only have to ask again with a guess.
   */
  async voiceAvailability(token: string, date?: string): Promise<VoiceAvailabilityOutput> {
    const org = await this.orgByToken(token);
    return this.tenants.runAs(org.id, null, async () => {
      const provider = await this.providerFor(org.id);
      const { timezone } = await readCalendarSettings(this.prisma, org.id);
      const today = zonedParts(new Date(), timezone).date;
      const asked = date && ISO_DATE.test(date.trim()) ? date.trim() : null;

      let found: AvailabilityOutput | null = null;
      if (asked) {
        const day = await provider.availability(org.id, asked);
        if (day.slots.length > 0) found = day;
      }
      if (!found) {
        const from = asked && asked > today ? asked : today;
        for (let i = asked ? 1 : 0; i < LOOKAHEAD_DAYS && !found; i += 1) {
          const day = await provider.availability(org.id, addDaysIso(from, i));
          if (day.slots.length > 0) found = day;
        }
      }

      if (!found) {
        return {
          ok: false,
          date: null,
          timezone,
          slots: [],
          speech: `I'm sorry, I have nothing free in the next ${LOOKAHEAD_DAYS} days. I can take your details and have someone call you back.`,
        };
      }

      const slots = found.slots.map((s) => ({
        start: `${found.date} ${s.label}`,
        label: s.label,
      }));
      const offered = spread(found.slots, SPOKEN_SLOTS).map((s) => spokenTime(new Date(s.startsAt), timezone));
      const dayName = spokenDay(new Date(found.slots[0]!.startsAt), timezone);
      const more = found.slots.length > offered.length ? ', and a few other times in between' : '';
      const lead =
        asked && found.date !== asked
          ? `I have nothing free on ${spokenDay(zonedTimeToUtc(asked, '12:00', timezone), timezone)}. On ${dayName} I have `
          : `On ${dayName} I have `;
      return {
        ok: true,
        date: found.date,
        timezone,
        slots,
        speech: `${lead}${joinSpoken(offered)} free${more}.`,
      };
    });
  }

  /**
   * A booking made by the voice agent mid-call.
   *
   * Never throws for anything the caller said: every refusal comes back as
   * `{ ok: false, speech }` with HTTP 200, because an LLM tool call that gets a
   * 400 tends to apologise vaguely, whereas one that gets a sentence reads it
   * out — and "that time has just gone, I have 10:30 or 11:00" keeps a call
   * going where "something went wrong" ends it. Only an unknown token is an
   * HTTP error, since that is a misconfigured agent, not a caller.
   */
  async voiceBook(token: string, input: VoiceBookInput): Promise<VoiceBookOutput> {
    const org = await this.orgByToken(token);
    return this.tenants.runAs(org.id, null, async () => {
      const { timezone } = await readCalendarSettings(this.prisma, org.id);

      const name = input.name.replace(/[.\s]+$/, '').trim();
      if (name.length < 2) {
        return { ok: false, speech: 'Could I take your name for the booking, please?' };
      }
      const startsAt = parseLenientStart(input.start, timezone);
      if (!startsAt) {
        return {
          ok: false,
          speech: 'Sorry, I did not catch which time you would like. Which day and time suits you?',
        };
      }
      const country = countryByCode(input.country?.toUpperCase() || 'AE');
      const phoneE164 = composeE164(country, input.phone);
      if (!isPlausibleNumber(country, phoneE164)) {
        return {
          ok: false,
          speech: 'Sorry, I did not get the full phone number. Could you say it again, including the area code?',
        };
      }

      try {
        const row = await this.bookFor(
          org.id,
          {
            name,
            phone: phoneE164,
            country: country.code,
            startsAt: startsAt.toISOString(),
            notes: input.notes,
          },
          'voice',
        );
        return {
          ok: true,
          bookingId: row.id,
          startsAt: row.startsAt.toISOString(),
          speech: `You're booked for ${spokenDay(row.startsAt, timezone)} at ${spokenTime(row.startsAt, timezone)}. We'll see you then, ${name.split(/\s+/)[0]}.`,
        };
      } catch (err) {
        if (!(err instanceof HttpException)) throw err;
        // Offer the alternatives in the same breath, so the agent does not
        // need a second tool call to recover.
        const local = zonedParts(startsAt, timezone);
        const alt = await this.mock
          .availability(org.id, local.date)
          .then((d) =>
            nearest(d.slots, startsAt, 3).map((s) => spokenTime(new Date(s.startsAt), timezone)),
          )
          .catch(() => [] as string[]);
        const reason = messageOf(err);
        return {
          ok: false,
          speech: alt.length
            ? `${reason} On that day I still have ${joinSpoken(alt)}.`
            : reason,
        };
      }
    });
  }

  /* ================================ helpers =============================== */

  /**
   * The provider this centre's config selects.
   *
   * Only the mock exists. Cal.com is a named option so the selection is real
   * code rather than a comment, and refuses clearly until it is built.
   */
  private async providerFor(orgId: string): Promise<CalendarProvider> {
    const { config } = await readCalendarSettings(this.prisma, orgId);
    if (config.provider === 'calcom') throw calcomNotConnected();
    return this.mock;
  }

  /**
   * Normalise, upsert the contact, then hand to the provider.
   *
   * The contact is matched by phone exactly as captureLead does — findFirst
   * then create, because the extension's injected orgId does not fit an
   * upsert's compound unique — and a name or email we already hold is never
   * overwritten by what was typed into a booking form.
   */
  private async bookFor(
    orgId: string,
    input: CreateBookingInput,
    source: BookingSource,
  ): Promise<BookingRow> {
    const country = countryByCode(input.country);
    const phoneE164 = composeE164(country, input.phone);
    if (!isPlausibleNumber(country, phoneE164)) {
      throw new BadRequestException(
        `That does not look like a ${country.name} number. Include the area code, e.g. ${country.example}.`,
      );
    }
    const startsAt = new Date(input.startsAt);
    if (Number.isNaN(startsAt.getTime())) throw new BadRequestException('Pick a time from the list');

    const provider = await this.providerFor(orgId);

    const existing = await this.prisma.contact.findFirst({ where: { orgId, phoneE164 } });
    const contact = existing
      ? await this.prisma.contact.update({
          where: { id: existing.id },
          data: {
            name: existing.name ?? input.name,
            email: existing.email ?? (input.email || null),
          },
        })
      : await this.prisma.contact.create({
          data: { orgId, phoneE164, name: input.name, email: input.email || null },
        });

    const row = await provider.book(orgId, {
      name: input.name,
      phoneE164,
      email: input.email || null,
      startsAt,
      notes: input.notes || null,
      source,
      contactId: contact.id,
    });
    this.log.log(`booking ${row.id} (${source}) ${row.startsAt.toISOString()} for ${phoneE164}`);
    return row;
  }

  /**
   * The org behind a landing-page slug, or null — the same three-way "no page
   * here" as SitesService.publicBySlug: unknown slug, inactive or page-less
   * centre, unpublished page. One answer so a probe cannot tell them apart.
   */
  private async publishedOrg(slug: string): Promise<{ id: string } | null> {
    const org = await this.prisma.organization.findUnique({
      where: { slug: slug.toLowerCase() },
      select: { id: true, isActive: true, websiteEnabled: true },
    });
    if (!org || !org.isActive || !org.websiteEnabled) return null;
    const site = await this.tenants.runAs(org.id, null, () =>
      this.prisma.site.findUnique({ where: { orgId: org.id }, select: { isPublished: true } }),
    );
    return site?.isPublished ? { id: org.id } : null;
  }

  /**
   * The org a calendar token belongs to.
   *
   * Setting is tenant-scoped, but this runs with no context — which is what
   * lets the unique token find its row across all centres. The token is the
   * whole credential, so an unknown one and a suspended centre are the same
   * 404.
   */
  private async orgByToken(token: string): Promise<{ id: string }> {
    if (!/^cal_[A-Za-z0-9_-]{16,64}$/.test(token)) throw new NotFoundException('Unknown calendar');
    const setting = await this.prisma.setting.findUnique({
      where: { calendarToken: token },
      select: { orgId: true, org: { select: { isActive: true } } },
    });
    if (!setting || !setting.org.isActive) throw new NotFoundException('Unknown calendar');
    return { id: setting.orgId };
  }
}

/* ================================ helpers ================================= */

const DAY_MS = 86_400_000;
/** How far the voice agent looks for the next opening before giving up. */
const LOOKAHEAD_DAYS = 14;
/** How many times the agent reads out. More than six and the caller forgets the first. */
const SPOKEN_SLOTS = 6;

function calcomNotConnected(): BadRequestException {
  return new BadRequestException('Cal.com is not connected yet');
}

function requireDate(date: string | undefined): string {
  const d = date?.trim() ?? '';
  if (!ISO_DATE.test(d) || Number.isNaN(Date.parse(`${d}T00:00:00Z`))) {
    throw new BadRequestException('Pass ?date=YYYY-MM-DD');
  }
  return d;
}

function parseInstant(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new BadRequestException(`Not a date: ${value}`);
  return d;
}

/**
 * A start time as an LLM might write it.
 *
 * An explicit offset or Z is taken as an instant. Anything that looks like a
 * date and a wall-clock time without one — "2026-10-14 09:30",
 * "2026-10-14T9:30", "2026-10-14 9.30" — is read in the centre's timezone,
 * because that is the timezone the agent was given the slots in.
 */
function parseLenientStart(raw: string, timezone: string): Date | null {
  const s = raw.trim();
  if (!s) return null;
  const local = /^(\d{4}-\d{2}-\d{2})[ T]+(\d{1,2})[:.](\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(s);
  if (local) {
    const [, date, h, m] = local as unknown as [string, string, string, string];
    if (+h > 23 || +m > 59) return null;
    return zonedTimeToUtc(date, `${h.padStart(2, '0')}:${m}`, timezone);
  }
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** "Tuesday 14 October", in the centre's timezone. */
function spokenDay(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone,
  })
    .format(d)
    .replace(',', '');
}

/** "9:00", "14:30" — 24-hour, no leading zero, which a TTS voice reads cleanly. */
function spokenTime(d: Date, timeZone: string): string {
  return zonedParts(d, timeZone).time.replace(/^0/, '');
}

/** "a, b and c". */
function joinSpoken(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/**
 * Up to `n` items spread across the list rather than the first `n`.
 *
 * Reading out 9:00, 9:30, 10:00, 10:30, 11:00 and 11:30 tells a caller who
 * wanted the afternoon nothing; spreading across the day lets them pick a part
 * of it and ask for the exact time.
 */
function spread<T>(items: T[], n: number): T[] {
  if (items.length <= n) return items;
  const step = (items.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, i) => items[Math.round(i * step)]!);
}

/**
 * The `n` slots closest to what the caller asked for, in time order — someone
 * who wanted 10:00 wants to hear 9:30 and 10:30, not the first and last of the
 * day.
 */
function nearest(
  slots: AvailabilityOutput['slots'],
  to: Date,
  n: number,
): AvailabilityOutput['slots'] {
  return [...slots]
    .sort(
      (a, b) =>
        Math.abs(Date.parse(a.startsAt) - to.getTime()) -
        Math.abs(Date.parse(b.startsAt) - to.getTime()),
    )
    .slice(0, n)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

function messageOf(err: HttpException): string {
  const body = err.getResponse();
  if (typeof body === 'string') return body;
  const m = (body as { message?: string | string[] }).message;
  return Array.isArray(m) ? m.join(' ') : (m ?? err.message);
}
