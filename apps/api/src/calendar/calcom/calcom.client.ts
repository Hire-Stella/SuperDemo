import type { CalcomAccount, CalcomEventType } from '@superdemo/contracts';

const BASE_URL = 'https://api.cal.com/v2';
const TIMEOUT_MS = 15_000;

/*
 * Cal.com versions its v2 endpoints per resource with a `cal-api-version`
 * header, and an old default answers in an older shape — so each call names the
 * version whose response it parses.
 */
const V_SLOTS = '2024-09-04';
const V_BOOKINGS = '2024-08-13';
const V_EVENT_TYPES = '2024-06-14';

/** A Cal.com answer that was not a success, with the message Cal.com gave. */
export class CalcomError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export interface CalcomSlot {
  start: string;
  end: string | null;
}

export interface CalcomBooking {
  id: number;
  uid: string;
  status: string;
  start: string;
  end: string;
  eventTypeId: number | null;
  title: string | null;
  attendee: { name: string; email: string | null; phone: string | null } | null;
  notes: string | null;
  metadata: Record<string, string>;
}

export interface CreateBookingArgs {
  eventTypeId: number;
  start: Date;
  name: string;
  /** Cal.com needs an email or a phone number for the attendee, not both. */
  email: string | null;
  phoneE164: string | null;
  timeZone: string;
  notes: string | null;
  metadata: Record<string, string>;
}

/**
 * The few Cal.com v2 calls the calendar needs, authenticated with one centre's
 * API key. Stateless: a new client per call is cheap, and it means a key is
 * never held anywhere longer than the request that decrypted it.
 */
export class CalcomClient {
  constructor(private readonly apiKey: string) {}

  async me(): Promise<CalcomAccount> {
    const data = await this.request<Record<string, unknown>>('GET', '/me');
    return {
      id: Number(data.id),
      username: str(data.username),
      email: str(data.email) ?? '',
      name: str(data.name),
      timeZone: str(data.timeZone),
    };
  }

  async eventTypes(): Promise<CalcomEventType[]> {
    const data = await this.request<unknown>('GET', '/event-types', { version: V_EVENT_TYPES });
    // Returned flat for a user's own key; older answers nested them in groups.
    const list = Array.isArray(data)
      ? data
      : asArray(asRecord(data).eventTypeGroups).flatMap((g) => asArray(asRecord(g).eventTypes));
    return list
      .map(asRecord)
      .filter((e) => !e.hidden)
      .map((e) => ({
        id: Number(e.id),
        title: str(e.title) ?? `Event ${String(e.id)}`,
        slug: str(e.slug) ?? '',
        lengthMinutes: Number(e.lengthInMinutes ?? e.length ?? 30),
      }));
  }

  /** Free slots in [start, end), returned in `timeZone`. */
  async slots(eventTypeId: number, start: Date, end: Date, timeZone: string): Promise<CalcomSlot[]> {
    const data = await this.request<Record<string, unknown>>('GET', '/slots', {
      version: V_SLOTS,
      query: {
        eventTypeId: String(eventTypeId),
        start: start.toISOString(),
        end: end.toISOString(),
        timeZone,
        format: 'range',
      },
    });
    // { "2026-10-09": [{ start, end }, …], … } — keyed by date in `timeZone`.
    return Object.values(data)
      .flatMap(asArray)
      .map(asRecord)
      .map((s) => ({ start: str(s.start) ?? '', end: str(s.end) }))
      .filter((s) => s.start);
  }

  async createBooking(args: CreateBookingArgs): Promise<CalcomBooking> {
    const data = await this.request<Record<string, unknown>>('POST', '/bookings', {
      version: V_BOOKINGS,
      body: {
        start: args.start.toISOString(),
        eventTypeId: args.eventTypeId,
        attendee: {
          name: args.name,
          ...(args.email ? { email: args.email } : {}),
          timeZone: args.timeZone,
          language: 'en',
          ...(args.phoneE164 ? { phoneNumber: args.phoneE164 } : {}),
        },
        ...(args.notes ? { bookingFieldsResponses: { notes: args.notes } } : {}),
        metadata: args.metadata,
      },
    });
    return toBooking(data);
  }

  async cancelBooking(uid: string, reason: string): Promise<void> {
    await this.request('POST', `/bookings/${encodeURIComponent(uid)}/cancel`, {
      version: V_BOOKINGS,
      body: { cancellationReason: reason },
    });
  }

  /** Every booking of one event type starting in [afterStart, beforeEnd), any status. */
  async bookings(eventTypeId: number, afterStart: Date, beforeEnd: Date): Promise<CalcomBooking[]> {
    const out: CalcomBooking[] = [];
    const take = 100;
    for (let skip = 0; skip < 2000; skip += take) {
      const res = await this.request<unknown>('GET', '/bookings', {
        version: V_BOOKINGS,
        query: {
          eventTypeId: String(eventTypeId),
          afterStart: afterStart.toISOString(),
          beforeEnd: beforeEnd.toISOString(),
          sortStart: 'asc',
          take: String(take),
          skip: String(skip),
        },
        raw: true,
      });
      const body = asRecord(res);
      const page = asArray(body.data).map((b) => toBooking(asRecord(b)));
      out.push(...page);
      const hasNext = asRecord(body.pagination).hasNextPage;
      if (page.length < take || hasNext === false) break;
    }
    return out;
  }

  /** Webhook ids pointing at exactly this URL — left over from an earlier connect. */
  async webhooksFor(subscriberUrl: string): Promise<string[]> {
    const data = await this.request<unknown>('GET', '/webhooks');
    return asArray(data)
      .map(asRecord)
      .filter((w) => w.subscriberUrl === subscriberUrl)
      .map((w) => String(w.id));
  }

  async createWebhook(subscriberUrl: string, secret: string): Promise<string> {
    const data = await this.request<Record<string, unknown>>('POST', '/webhooks', {
      body: {
        subscriberUrl,
        secret,
        active: true,
        triggers: ['BOOKING_CREATED', 'BOOKING_RESCHEDULED', 'BOOKING_CANCELLED'],
      },
    });
    return String(data.id);
  }

  async deleteWebhook(id: string): Promise<void> {
    await this.request('DELETE', `/webhooks/${id}`);
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    opts: {
      version?: string;
      query?: Record<string, string>;
      body?: unknown;
      /** Return the whole envelope rather than its `data`. */
      raw?: boolean;
    } = {},
  ): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    for (const [k, v] of Object.entries(opts.query ?? {})) url.searchParams.set(k, v);
    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          ...(opts.version ? { 'cal-api-version': opts.version } : {}),
          ...(opts.body ? { 'content-type': 'application/json' } : {}),
        },
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      throw new CalcomError(0, `Could not reach Cal.com: ${(err as Error).message}`);
    }
    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // Not JSON — an HTML error page from a proxy. The status says enough.
    }
    if (!res.ok) throw new CalcomError(res.status, errorMessage(json) ?? `Cal.com answered ${res.status}`);
    return (opts.raw ? json : asRecord(json).data) as T;
  }
}

function errorMessage(json: unknown): string | null {
  const err = asRecord(json).error;
  if (typeof err === 'string') return err;
  const e = asRecord(err);
  const m = e.message ?? asRecord(json).message;
  if (Array.isArray(m)) return m.join(' ');
  return typeof m === 'string' ? m : null;
}

function toBooking(b: Record<string, unknown>): CalcomBooking {
  const attendee = asRecord(asArray(b.attendees)[0]);
  const responses = asRecord(b.bookingFieldsResponses);
  const metadata: Record<string, string> = {};
  for (const [k, v] of Object.entries(asRecord(b.metadata))) {
    if (typeof v === 'string') metadata[k] = v;
  }
  return {
    id: Number(b.id),
    uid: str(b.uid) ?? String(b.id),
    status: (str(b.status) ?? 'accepted').toLowerCase(),
    start: str(b.start) ?? str(b.startTime) ?? '',
    end: str(b.end) ?? str(b.endTime) ?? '',
    eventTypeId: b.eventTypeId == null ? null : Number(b.eventTypeId),
    title: str(b.title),
    attendee: Object.keys(attendee).length
      ? {
          name: str(attendee.name) ?? str(responses.name) ?? 'Cal.com guest',
          email: str(attendee.email),
          phone:
            str(attendee.phoneNumber) ?? str(responses.attendeePhoneNumber) ?? str(responses.phone),
        }
      : null,
    notes: str(responses.notes) ?? str(b.description),
    metadata,
  };
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v : null;
}
