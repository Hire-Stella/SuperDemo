/**
 * Appointments for one centre — shared by seed.ts (fresh databases) and
 * seed-calendar.ts (every centre in an existing one).
 *
 * Realistic rather than random: UAE names and numbers, times on the centre's
 * own slot grid in its own timezone, a mix of who booked them, and two
 * cancellations — because a week view of eleven identical "dashboard" rows
 * demos the layout and nothing else, and the source badges and struck-through
 * cancelled rows are the parts worth showing.
 *
 * Deterministic per centre: the same org gets the same week every time, so a
 * screenshot taken before a rehearsal still matches the screen during it.
 */
import type { PrismaClient } from '@prisma/client';
import {
  CalendarConfig,
  addDaysIso,
  weekdayOfIso,
  zonedParts,
  zonedTimeToUtc,
} from '@superdemo/contracts';

const PEOPLE = [
  { name: 'Ahmed Al Mansoori', phone: '+971501234871', email: 'ahmed.mansoori@gmail.com' },
  { name: 'Fatima Rahman', phone: '+971552318840', email: null },
  { name: 'Rohan Mehta', phone: '+971564410293', email: 'rohan.mehta@outlook.com' },
  { name: 'Sara Khalil', phone: '+971507719322', email: null },
  { name: 'Daniel Okafor', phone: '+971585530671', email: 'd.okafor@yahoo.com' },
  { name: 'Aisha Siddiqui', phone: '+971529904415', email: null },
  { name: 'Mohammed Al Hashimi', phone: '+971503382716', email: 'm.hashimi@icloud.com' },
  { name: 'Priya Nair', phone: '+971547762019', email: 'priya.nair@gmail.com' },
  { name: 'Omar Farouk', phone: '+971556621847', email: null },
  { name: 'Leila Haddad', phone: '+971501187362', email: 'leila.h@hotmail.com' },
  { name: 'James Whitfield', phone: '+971589043126', email: 'jwhitfield@proton.me' },
  { name: 'Noor Al Suwaidi', phone: '+971523376690', email: null },
] as const;

const NOTES = [
  'Wants to compare plans before deciding',
  'Asked for an Arabic-speaking consultant',
  'Follow-up from website enquiry',
  'Prefers WhatsApp for reminders',
  null,
  null,
  'Bringing a colleague',
  'Rescheduled from last week',
] as const;

/** Booked-by mix: mostly the voice agent and the website, which is the story. */
const SOURCES = ['voice', 'website', 'voice', 'dashboard', 'website', 'voice'] as const;

/** A small PRNG seeded from the org id, so each centre gets its own week. */
function rngFor(seed: string): () => number {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  let state = h >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Create ~10 bookings across this week and next for one centre.
 *
 * `prisma` must already be pinned to the org (withOrg) or be unscoped; orgId
 * is written explicitly either way. Returns how many were created.
 */
export async function seedBookingsFor(
  prisma: PrismaClient,
  org: { id: string; timezone: string },
  rawConfig: unknown,
): Promise<number> {
  const parsed = CalendarConfig.safeParse(rawConfig ?? {});
  const config = parsed.success ? parsed.data : CalendarConfig.parse({});
  const tz = org.timezone || 'Asia/Dubai';
  const rnd = rngFor(org.id);

  // Monday of this week, in the centre's own calendar.
  const today = zonedParts(new Date(), tz).date;
  const monday = addDaysIso(today, -((weekdayOfIso(today) + 6) % 7));
  const days = Array.from({ length: 14 }, (_, i) => addDaysIso(monday, i)).filter((d) =>
    config.workingDays.includes(weekdayOfIso(d)),
  );
  if (days.length === 0) return 0;

  const [oh, om] = config.openTime.split(':').map(Number) as [number, number];
  const [ch, cm] = config.closeTime.split(':').map(Number) as [number, number];
  const slotsPerDay = Math.floor((ch * 60 + cm - (oh * 60 + om)) / config.slotMinutes);
  if (slotsPerDay < 1) return 0;

  const target = 10 + Math.floor(rnd() * 3); // 10–12
  const used = new Set<string>();
  let created = 0;

  for (let i = 0; i < target * 4 && created < target; i += 1) {
    const date = days[Math.floor(rnd() * days.length)]!;
    const slot = Math.floor(rnd() * slotsPerDay);
    const key = `${date}#${slot}`;
    if (used.has(key)) continue;
    used.add(key);

    const minutes = oh * 60 + om + slot * config.slotMinutes;
    const hhmm = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    const startsAt = zonedTimeToUtc(date, hhmm, tz);
    const person = PEOPLE[created % PEOPLE.length]!;

    const existing = await prisma.contact.findFirst({
      where: { orgId: org.id, phoneE164: person.phone },
    });
    const contact =
      existing ??
      (await prisma.contact.create({
        data: { orgId: org.id, phoneE164: person.phone, name: person.name, email: person.email },
      }));

    await prisma.calendarBooking.create({
      data: {
        orgId: org.id,
        contactId: contact.id,
        name: person.name,
        phoneE164: person.phone,
        email: person.email,
        startsAt,
        endsAt: new Date(startsAt.getTime() + config.slotMinutes * 60_000),
        // Two cancellations, at fixed positions so every centre shows them.
        status: created === 3 || created === 7 ? 'CANCELLED' : 'BOOKED',
        source: SOURCES[created % SOURCES.length]!,
        notes: NOTES[Math.floor(rnd() * NOTES.length)] ?? null,
        createdAt: new Date(startsAt.getTime() - (1 + Math.floor(rnd() * 72)) * 3_600_000),
      },
    });
    created += 1;
  }
  return created;
}
