import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  type AvailabilityOutput,
  type BookingRow,
  addDaysIso,
  zonedParts,
  zonedTimeToUtc,
} from '@superdemo/contracts';
import { PrismaService } from '../../prisma/prisma.service';
import type { CalendarProvider, ProviderBookInput } from '../calendar.provider';
import { readCalendarSettings } from '../calendar-settings';
import { toBookingRow } from '../mock-calendar.provider';
import { CalcomError } from './calcom.client';
import { type CalcomConnection, CalcomService, placeholderEmail } from './calcom.service';

/** How long one day's slots are reused. The voice agent asks for up to 14 days in a row. */
const SLOTS_TTL_MS = 20_000;

/**
 * The calendar when a centre has connected Cal.com.
 *
 * Cal.com decides what is free — its availability, its other calendars, its
 * buffers — and every booking is made there first, so a clash is Cal.com's to
 * refuse. Only once it has accepted is the booking written to our table, which
 * stays the copy the week view reads.
 */
@Injectable()
export class CalcomCalendarProvider implements CalendarProvider {
  private readonly slotCache = new Map<string, { at: number; value: AvailabilityOutput }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly calcom: CalcomService,
  ) {}

  async availability(orgId: string, date: string): Promise<AvailabilityOutput> {
    const cacheKey = `${orgId}:${date}`;
    const cached = this.slotCache.get(cacheKey);
    if (cached && Date.now() - cached.at < SLOTS_TTL_MS) return withoutPast(cached.value);

    const conn = await this.require(orgId);
    const { timezone } = await readCalendarSettings(this.prisma, orgId);
    const from = zonedTimeToUtc(date, '00:00', timezone);
    const to = zonedTimeToUtc(addDaysIso(date, 1), '00:00', timezone);
    const length = conn.pub.eventType.lengthMinutes * 60_000;

    const raw = await conn.client
      .slots(conn.pub.eventType.id, from, to, timezone)
      .catch(unavailable);
    const slots = raw
      .map((s) => {
        const start = new Date(s.start);
        const end = s.end ? new Date(s.end) : new Date(start.getTime() + length);
        return { start, end };
      })
      .filter(({ start }) => !Number.isNaN(start.getTime()) && start >= from && start < to)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .map(({ start, end }) => ({
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        label: zonedParts(start, timezone).time,
      }));

    const value = { date, timezone, slots };
    this.slotCache.set(cacheKey, { at: Date.now(), value });
    return withoutPast(value);
  }

  async book(orgId: string, input: ProviderBookInput): Promise<BookingRow> {
    const conn = await this.require(orgId);
    if (input.startsAt.getTime() <= Date.now()) {
      throw new BadRequestException('That time has already passed. Please pick a later one.');
    }
    const { timezone } = await readCalendarSettings(this.prisma, orgId);

    const args = {
      eventTypeId: conn.pub.eventType.id,
      start: input.startsAt,
      name: input.name,
      email: input.email,
      phoneE164: input.phoneE164,
      timeZone: timezone,
      notes: input.notes,
      // Read back by the sync, so a booking we made keeps its real source.
      metadata: { source: input.source, ...(input.contactId ? { contactId: input.contactId } : {}) },
    };
    let booking;
    try {
      booking = await conn.client.createBooking(args).catch((err: unknown) => {
        // A phone number is enough for Cal.com unless the event type insists on
        // an email; then the placeholder stands in rather than losing the booking.
        if (!args.email && err instanceof CalcomError && err.status === 400 && /email/i.test(err.message)) {
          return conn.client.createBooking({ ...args, email: placeholderEmail(input.phoneE164) });
        }
        throw err;
      });
    } catch (err) {
      if (err instanceof CalcomError && err.status >= 400 && err.status < 500) {
        // Cal.com's own wording ("User either already has booking at this time
        // or is not available") is not something to read out to a caller.
        throw new ConflictException(
          `${zonedParts(input.startsAt, timezone).time.replace(/^0/, '')} is no longer available. Please pick another time.`,
        );
      }
      unavailable(err);
    } finally {
      this.forget(orgId);
    }

    return this.calcom.upsertLocal(orgId, booking, {
      source: input.source,
      contactId: input.contactId,
      phoneE164: input.phoneE164,
      notes: input.notes,
    });
  }

  async cancel(orgId: string, id: string): Promise<BookingRow> {
    const found = await this.prisma.calendarBooking.findFirst({ where: { id, orgId } });
    if (!found) throw new NotFoundException('No such booking');
    if (found.status === 'CANCELLED') return toBookingRow(found);

    if (found.externalUid) {
      const conn = await this.require(orgId);
      try {
        await conn.client.cancelBooking(found.externalUid, 'Cancelled from the contact centre');
      } catch (err) {
        // Already cancelled or deleted on Cal.com is the outcome we wanted.
        if (!(err instanceof CalcomError && (err.status === 400 || err.status === 404))) {
          unavailable(err);
        }
      } finally {
        this.forget(orgId);
      }
    }
    const row = await this.prisma.calendarBooking.update({
      where: { id: found.id },
      data: { status: 'CANCELLED' },
    });
    return toBookingRow(row);
  }

  private async require(orgId: string): Promise<CalcomConnection> {
    const conn = await this.calcom.connection(orgId);
    if (!conn) throw new BadRequestException('Cal.com is not connected for this centre');
    return conn;
  }

  /** Drop a centre's cached slots after anything that changes them. */
  forget(orgId: string): void {
    for (const key of this.slotCache.keys()) {
      if (key.startsWith(`${orgId}:`)) this.slotCache.delete(key);
    }
  }
}

function withoutPast(day: AvailabilityOutput): AvailabilityOutput {
  const now = Date.now();
  return { ...day, slots: day.slots.filter((s) => Date.parse(s.startsAt) > now) };
}

function unavailable(err: unknown): never {
  if (err instanceof CalcomError) {
    throw new ServiceUnavailableException(
      err.status === 401 || err.status === 403
        ? 'The calendar is not reachable right now (Cal.com refused the stored key).'
        : 'The calendar is not reachable right now. Please try again in a moment.',
    );
  }
  throw err;
}
