import { z } from 'zod';

/**
 * Appointments.
 *
 * A centre's calendar is booked from three places that trust each other very
 * differently: a signed-in member of staff on the dashboard, an anonymous
 * visitor on the landing page, and a voice agent calling an HTTP tool in the
 * middle of a phone call. All three ask the same two questions — "what is free
 * on this day" and "book this one" — so the shapes below are shared, and the
 * difference between the callers is only how the centre is identified (session,
 * slug, or calendar token).
 *
 * Every time here is either an ISO instant (UTC, for storage and comparison) or
 * a wall-clock string in the *centre's* timezone (for humans and for the agent
 * to say out loud). Never the browser's timezone: a supervisor in Cairo booking
 * for a Dubai centre must see Dubai's 09:00, not their own.
 */

export const CALENDAR_PROVIDERS = ['mock', 'calcom'] as const;
export const CalendarProviderKind = z.enum(CALENDAR_PROVIDERS);
export type CalendarProviderKind = z.infer<typeof CalendarProviderKind>;

export const BOOKING_SOURCES = ['dashboard', 'website', 'voice'] as const;
export const BookingSource = z.enum(BOOKING_SOURCES);
export type BookingSource = z.infer<typeof BookingSource>;

export const BookingStatus = z.enum(['BOOKED', 'CANCELLED']);
export type BookingStatus = z.infer<typeof BookingStatus>;

/** Monday-first, because that is how the week view and the hours card read. */
export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

const HHMM = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour HH:MM, e.g. 09:00');

export const CalendarConfig = z
  .object({
    provider: CalendarProviderKind.default('mock'),
    /** Length of one bookable slot. Also the step between slot starts. */
    slotMinutes: z.number().int().min(10).max(240).default(30),
    /** 0 = Sunday … 6 = Saturday. Mon–Sat by default: the UAE working week. */
    workingDays: z
      .array(z.number().int().min(0).max(6))
      .max(7)
      .default([1, 2, 3, 4, 5, 6])
      .transform((days) => [...new Set(days)].sort((a, b) => a - b)),
    openTime: HHMM.default('09:00'),
    closeTime: HHMM.default('18:00'),
  })
  .refine((c) => c.openTime < c.closeTime, {
    message: 'Closing time must be after opening time',
    path: ['closeTime'],
  });
export type CalendarConfig = z.infer<typeof CalendarConfig>;

/** What GET/PUT /calendar/config return: the config plus where it applies. */
export const CalendarConfigView = z.object({
  config: CalendarConfig,
  /** The centre's IANA timezone (Organization.timezone). Not editable here. */
  timezone: z.string(),
});
export type CalendarConfigView = z.infer<typeof CalendarConfigView>;

export const BookingRow = z.object({
  id: z.string(),
  name: z.string(),
  phoneE164: z.string(),
  email: z.string().nullable(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  status: BookingStatus,
  source: BookingSource,
  notes: z.string().nullable(),
  contactId: z.string().nullable(),
  createdAt: z.coerce.date(),
});
export type BookingRow = z.infer<typeof BookingRow>;

export const CreateBookingInput = z.object({
  name: z.string().trim().min(2, 'Please give a name').max(80),
  phone: z.string().trim().min(6, 'A phone number to reach them on').max(24),
  /** ISO 3166-1 alpha-2, from the country picker. */
  country: z.string().length(2).default('AE'),
  email: z.string().email('That email does not look right').max(120).optional().or(z.literal('')),
  /** An instant, as offered by /availability. Must land exactly on a slot. */
  startsAt: z.string().datetime({ offset: true, message: 'Pick a time from the list' }),
  notes: z.string().trim().max(600).optional().or(z.literal('')),
});
export type CreateBookingInput = z.infer<typeof CreateBookingInput>;

export const AvailabilitySlot = z.object({
  startsAt: z.string(),
  endsAt: z.string(),
  /** Wall-clock start in the centre's timezone, "09:30". */
  label: z.string(),
});
export type AvailabilitySlot = z.infer<typeof AvailabilitySlot>;

export const AvailabilityOutput = z.object({
  /** YYYY-MM-DD, in the centre's timezone. */
  date: z.string(),
  timezone: z.string(),
  slots: z.array(AvailabilitySlot),
});
export type AvailabilityOutput = z.infer<typeof AvailabilityOutput>;

/** From the landing page. Same as a dashboard booking plus the honeypot. */
export const PublicBookingInput = CreateBookingInput.extend({
  /**
   * Honeypot, exactly as on SiteLeadInput: filled means a bot, and the request
   * is accepted-and-discarded rather than rejected.
   */
  company: z.string().max(200).optional(),
});
export type PublicBookingInput = z.infer<typeof PublicBookingInput>;

export const PublicBookingOutput = z.object({
  ok: z.boolean(),
  /** What the page tells the visitor. Server-authored so it can be honest. */
  message: z.string(),
});
export type PublicBookingOutput = z.infer<typeof PublicBookingOutput>;

/**
 * A voice agent's booking request.
 *
 * Lenient on purpose: an LLM fills this from a conversation, so the phone may
 * arrive as a number, the start as "2026-10-14 09:30" rather than an instant,
 * and the name with a trailing full stop. Each field is coerced to a string
 * here and interpreted by the service, which replies with something the agent
 * can say rather than a validation error it cannot.
 */
export const VoiceBookInput = z.object({
  name: z.coerce.string().trim().max(120).default(''),
  phone: z.coerce.string().trim().max(40).default(''),
  /** ISO instant, or "YYYY-MM-DD HH:MM" in the centre's own timezone. */
  start: z.coerce.string().trim().max(60).default(''),
  notes: z.coerce.string().trim().max(600).optional(),
  country: z.coerce.string().trim().max(2).optional(),
});
export type VoiceBookInput = z.infer<typeof VoiceBookInput>;

export const VoiceAvailabilityOutput = z.object({
  ok: z.boolean(),
  date: z.string().nullable(),
  timezone: z.string(),
  /** "YYYY-MM-DD HH:MM" values the agent can pass straight back to /book. */
  slots: z.array(z.object({ start: z.string(), label: z.string() })),
  /** One sentence the agent can read out as-is. */
  speech: z.string(),
});
export type VoiceAvailabilityOutput = z.infer<typeof VoiceAvailabilityOutput>;

export const VoiceBookOutput = z.object({
  ok: z.boolean(),
  speech: z.string(),
  bookingId: z.string().optional(),
  startsAt: z.string().optional(),
});
export type VoiceBookOutput = z.infer<typeof VoiceBookOutput>;

/* ============================ timezone helpers ============================ */

/*
 * Wall-clock ↔ instant conversion with nothing but Intl.
 *
 * Shared here rather than pulled from a library because the API, the seed and
 * the web app all need the same answer, and only one of them already has a
 * timezone dependency. Intl knows every IANA zone and its DST rules, which is
 * the hard part; the arithmetic below is just asking it for an offset.
 */

const partsFormatters = new Map<string, Intl.DateTimeFormat>();
function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let f = partsFormatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
    });
    partsFormatters.set(timeZone, f);
  }
  return f;
}

/** The wall clock in `timeZone` at instant `d`. */
export function zonedParts(
  d: Date,
  timeZone: string,
): { date: string; time: string; weekday: number } {
  const p: Record<string, string> = {};
  for (const part of partsFormatter(timeZone).formatToParts(d)) p[part.type] = part.value;
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    time: `${p.hour}:${p.minute}`,
    weekday: WEEKDAY_LABELS.indexOf(p.weekday as (typeof WEEKDAY_LABELS)[number]),
  };
}

/** Offset of `timeZone` from UTC at instant `d`, in minutes (Dubai → +240). */
function offsetMinutes(d: Date, timeZone: string): number {
  const p: Record<string, string> = {};
  for (const part of partsFormatter(timeZone).formatToParts(d)) p[part.type] = part.value;
  const asUtc = Date.UTC(+p.year!, +p.month! - 1, +p.day!, +p.hour!, +p.minute!, +p.second!);
  return Math.round((asUtc - Math.floor(d.getTime() / 1000) * 1000) / 60_000);
}

/**
 * The instant at which it is `time` on `date` in `timeZone`.
 *
 * Guess with the offset at the naive UTC reading, then correct once with the
 * offset at the guess — the second pass is what makes a date on the far side
 * of a DST change land on the right hour.
 */
export function zonedTimeToUtc(date: string, time: string, timeZone: string): Date {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const [hh, mm] = time.split(':').map(Number) as [number, number];
  const naive = Date.UTC(y, m - 1, d, hh, mm);
  const first = naive - offsetMinutes(new Date(naive), timeZone) * 60_000;
  return new Date(naive - offsetMinutes(new Date(first), timeZone) * 60_000);
}

/** YYYY-MM-DD plus `days`, calendar arithmetic with no timezone involved. */
export function addDaysIso(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** 0 = Sunday, for a YYYY-MM-DD. */
export function weekdayOfIso(date: string): number {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
