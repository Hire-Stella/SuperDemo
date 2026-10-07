import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  type AvailabilityOutput,
  type AvailabilitySlot,
  type BookingRow,
  type BookingSource,
  type BookingStatus,
  weekdayOfIso,
  zonedParts,
  zonedTimeToUtc,
} from '@superdemo/contracts';
import { PrismaService } from '../prisma/prisma.service';
import type { CalendarProvider, ProviderBookInput } from './calendar.provider';
import { type CalendarSettings, readCalendarSettings } from './calendar-settings';

/**
 * The calendar with no outside system behind it.
 *
 * "Mock" in the sense that no Cal.com or Google is involved — the bookings are
 * real rows, the slots are computed from the centre's real hours, and a slot
 * one caller took is genuinely unavailable to the next. That is the point: the
 * voice agent and the landing page can be demoed end to end against it and
 * behave exactly as they will once a real calendar is plugged in underneath.
 *
 * The slot grid is anchored at opening time: with 09:00 and 30 minutes, slots
 * start at 09:00, 09:30, … and the last one is the last that *ends* by closing
 * time. A booking must land on that grid, which is what makes "is it free" a
 * simple overlap test rather than a fit-anything-anywhere search.
 */
@Injectable()
export class MockCalendarProvider implements CalendarProvider {
  constructor(private readonly prisma: PrismaService) {}

  async availability(orgId: string, date: string): Promise<AvailabilityOutput> {
    const settings = await readCalendarSettings(this.prisma, orgId);
    const grid = this.grid(settings, date);
    if (grid.length === 0) return { date, timezone: settings.timezone, slots: [] };

    const taken = await this.prisma.calendarBooking.findMany({
      where: {
        orgId,
        status: 'BOOKED',
        startsAt: { lt: grid[grid.length - 1]!.end },
        endsAt: { gt: grid[0]!.start },
      },
      select: { startsAt: true, endsAt: true },
    });

    const now = Date.now();
    const slots: AvailabilitySlot[] = grid
      // Strictly after now: a slot starting this minute cannot be reached by
      // anyone who is only now being offered it.
      .filter((s) => s.start.getTime() > now)
      .filter((s) => !taken.some((b) => b.startsAt < s.end && b.endsAt > s.start))
      .map((s) => ({
        startsAt: s.start.toISOString(),
        endsAt: s.end.toISOString(),
        label: s.label,
      }));

    return { date, timezone: settings.timezone, slots };
  }

  async book(orgId: string, input: ProviderBookInput): Promise<BookingRow> {
    const settings = await readCalendarSettings(this.prisma, orgId);
    const { config, timezone } = settings;
    const local = zonedParts(input.startsAt, timezone);

    // Each of these is a different thing for the person to fix, so each gets
    // its own sentence rather than one "invalid slot".
    if (!config.workingDays.includes(local.weekday)) {
      throw new BadRequestException(
        `The centre is closed on ${FULL_DAY[local.weekday]}s. Please pick another day.`,
      );
    }
    const slot = this.grid(settings, local.date).find(
      (s) => s.start.getTime() === input.startsAt.getTime(),
    );
    if (!slot) {
      const inHours = local.time >= config.openTime && local.time < config.closeTime;
      throw new BadRequestException(
        inHours
          ? `Appointments start every ${config.slotMinutes} minutes from ${clock(config.openTime)}. Please pick a time from the list.`
          : `${clock(local.time)} is outside opening hours, which are ${clock(config.openTime)} to ${clock(config.closeTime)}.`,
      );
    }
    if (slot.start.getTime() <= Date.now()) {
      throw new BadRequestException('That time has already passed. Please pick a later one.');
    }

    /*
     * Check-then-insert under a lock.
     *
     * Two callers offered the same free slot a second apart — a visitor on the
     * page and the voice agent on a call — would both pass a plain overlap
     * check and both insert. A transaction-scoped advisory lock per centre
     * serialises bookings within one centre only, so the cost is nil and the
     * second caller sees the first one's row and gets a 409 instead of a
     * double booking. Raw SQL is outside the tenant extension, which is fine:
     * it touches no table, only a lock keyed by this centre's id.
     */
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`calendar:${orgId}`}))`;
      const clash = await tx.calendarBooking.findFirst({
        where: {
          orgId,
          status: 'BOOKED',
          startsAt: { lt: slot.end },
          endsAt: { gt: slot.start },
        },
        select: { id: true },
      });
      if (clash) {
        throw new ConflictException(
          `${clock(slot.label)} on ${dayLabel(slot.start, timezone)} has just been taken. Please pick another time.`,
        );
      }
      return tx.calendarBooking.create({
        data: {
          // Explicit as well as injected: the public and voice paths run inside
          // runAs, but a booking that ever landed with orgId "" would be
          // invisible to every centre, so this one does not rely on it.
          orgId,
          contactId: input.contactId,
          name: input.name,
          phoneE164: input.phoneE164,
          email: input.email,
          startsAt: slot.start,
          endsAt: slot.end,
          source: input.source,
          notes: input.notes,
        },
      });
    });
    return toBookingRow(row);
  }

  async cancel(orgId: string, id: string): Promise<BookingRow> {
    const found = await this.prisma.calendarBooking.findFirst({ where: { id, orgId } });
    if (!found) throw new NotFoundException('No such booking');
    if (found.status === 'CANCELLED') return toBookingRow(found);
    const row = await this.prisma.calendarBooking.update({
      where: { id: found.id },
      data: { status: 'CANCELLED' },
    });
    return toBookingRow(row);
  }

  /** Every slot the centre offers on a local date, booked or not, past or not. */
  private grid(
    { config, timezone }: CalendarSettings,
    date: string,
  ): { start: Date; end: Date; label: string }[] {
    if (!config.workingDays.includes(weekdayOfIso(date))) return [];
    const open = toMinutes(config.openTime);
    const close = toMinutes(config.closeTime);
    const out: { start: Date; end: Date; label: string }[] = [];
    for (let m = open; m + config.slotMinutes <= close; m += config.slotMinutes) {
      const label = fromMinutes(m);
      const start = zonedTimeToUtc(date, label, timezone);
      out.push({ start, end: new Date(start.getTime() + config.slotMinutes * 60_000), label });
    }
    return out;
  }
}

const FULL_DAY = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/*
 * These messages are read out by the voice agent as well as shown on a page,
 * so they are written to be spoken: "9:30 on Tuesday 13 October", not
 * "09:30 on 2026-10-13".
 */
function clock(hhmm: string): string {
  return hhmm.replace(/^0/, '');
}

function dayLabel(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone })
    .format(d)
    .replace(',', '');
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number) as [number, number];
  return h * 60 + m;
}

function fromMinutes(total: number): string {
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function toBookingRow(r: {
  id: string;
  name: string;
  phoneE164: string;
  email: string | null;
  startsAt: Date;
  endsAt: Date;
  status: string;
  source: string;
  notes: string | null;
  contactId: string | null;
  createdAt: Date;
}): BookingRow {
  return {
    id: r.id,
    name: r.name,
    phoneE164: r.phoneE164,
    email: r.email,
    startsAt: r.startsAt,
    endsAt: r.endsAt,
    status: r.status as BookingStatus,
    source: r.source as BookingSource,
    notes: r.notes,
    contactId: r.contactId,
    createdAt: r.createdAt,
  };
}
