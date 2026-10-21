import { addDaysIso, ISO_DATE, spokenClock, weekdayOfIso, zonedParts } from '@superdemo/contracts';

/**
 * "Is this a time the office is open?", answered from the caller's own words.
 *
 * Built for voice agents on small models, which are unreliable at exactly the
 * two things this does: turning "tomorrow at 3" into a calendar date, and
 * checking that date against opening days and hours. The agent passes the
 * words through untouched and reads back the `speech` sentence, so no date
 * arithmetic or rule checking is left to the model.
 *
 * Deliberately not a calendar: nothing is stored and nothing is "taken", so
 * any number of people can book the same time. It only says whether a time
 * falls inside the hours it is given.
 */

export interface OfficeHours {
  timeZone: string;
  /** 0 = Sunday … 6 = Saturday. */
  days: number[];
  /** HH:MM, inclusive. */
  open: string;
  /** HH:MM, exclusive: an appointment must start before closing. */
  close: string;
  /** Times that cannot be booked on one weekday, e.g. a lunch hour. */
  breaks: { weekday: number; from: string; to: string }[];
}

export interface OfficeHoursCheck {
  ok: boolean;
  /** YYYY-MM-DD, when a day was understood. */
  date: string | null;
  /** HH:MM, 24-hour, when a time was understood. */
  time: string | null;
  weekday: string | null;
  /** What the agent says next, verbatim. */
  speech: string;
}

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const SHORT_WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

export const DEFAULT_OFFICE_HOURS: OfficeHours = {
  timeZone: 'Asia/Dubai',
  days: [1, 2, 3, 4, 5],
  open: '09:00',
  close: '17:00',
  breaks: [],
};

/**
 * The hours from query parameters, falling back to the defaults for anything
 * missing or malformed. Breaks are written `1@12:00-13:00`, comma-separated.
 */
export function officeHoursFrom(q: {
  tz?: string;
  days?: string;
  open?: string;
  close?: string;
  breaks?: string;
}): OfficeHours {
  const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;
  const days = (q.days ?? '')
    .split(',')
    .map((d) => Number(d.trim()))
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  const breaks = (q.breaks ?? '')
    .split(',')
    .map((b) => /^\s*([0-6])@([0-2]\d:[0-5]\d)-([0-2]\d:[0-5]\d)\s*$/.exec(b))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => ({ weekday: Number(m[1]), from: m[2]!, to: m[3]! }));
  return {
    timeZone: q.tz && isTimeZone(q.tz) ? q.tz : DEFAULT_OFFICE_HOURS.timeZone,
    days: days.length ? [...new Set(days)].sort() : DEFAULT_OFFICE_HOURS.days,
    open: q.open && hhmm.test(q.open) ? q.open : DEFAULT_OFFICE_HOURS.open,
    close: q.close && hhmm.test(q.close) ? q.close : DEFAULT_OFFICE_HOURS.close,
    breaks,
  };
}

export function checkOfficeHours(
  dayText: string,
  timeText: string,
  hours: OfficeHours,
  now: Date = new Date(),
): OfficeHoursCheck {
  const today = zonedParts(now, hours.timeZone);
  // The agent may put the whole phrase in either field.
  const words = `${dayText} ${timeText}`.toLowerCase().replace(/\s+/g, ' ').trim();
  const parsedTime = parseTime(words);
  const dayWords = parsedTime ? words.replace(parsedTime.matched, ' ') : words;
  const date = parseDay(dayWords, today.date, today.weekday);
  const time = parsedTime?.time ?? null;
  const openSpoken = `${spokenClock(hours.open)} to ${spokenClock(hours.close)}`;
  const daysSpoken = spokenDays(hours.days);

  if (date === 'invalid' || (date === null && time === null)) {
    return result(false, null, null, 'Sorry, which day and time would you like?');
  }
  if (date === null) {
    return result(false, null, time, `Which day would you like at ${spokenClock(time!)}?`);
  }

  const weekday = weekdayOfIso(date);
  const dayName = cap(WEEKDAYS[weekday]!);
  const spokenDate = spokenDay(date);

  if (!hours.days.includes(weekday)) {
    return result(
      false,
      date,
      time,
      `The office is closed on ${dayName}s. We are open ${daysSpoken}, ${openSpoken}. Which day and time would suit you?`,
    );
  }
  if (date < today.date) {
    return result(false, date, time, `${spokenDate} has already passed. Which day would you like?`);
  }
  if (time === null) {
    return result(
      false,
      date,
      null,
      `What time on ${spokenDate} would you like? We are open ${openSpoken}.`,
    );
  }
  if (time < hours.open || time >= hours.close) {
    return result(
      false,
      date,
      time,
      `${spokenClock(time)} is outside office hours. We are open ${openSpoken}. What time between ${spokenClock(hours.open)} and ${spokenClock(hours.close)} would suit you?`,
    );
  }
  const brk = hours.breaks.find((b) => b.weekday === weekday && time >= b.from && time < b.to);
  if (brk) {
    return result(
      false,
      date,
      time,
      `${dayName} from ${spokenClock(brk.from)} to ${spokenClock(brk.to)} is not available. Would a time before ${spokenClock(brk.from)} or from ${spokenClock(brk.to)} suit you?`,
    );
  }
  if (date === today.date && time <= today.time) {
    return result(
      false,
      date,
      time,
      `${spokenClock(time)} today has already passed. What later time would suit you?`,
    );
  }
  return result(true, date, time, `${spokenDate} at ${spokenClock(time)} is within office hours.`);

  function result(
    ok: boolean,
    d: string | null,
    t: string | null,
    speech: string,
  ): OfficeHoursCheck {
    return {
      ok,
      date: d,
      time: t,
      weekday: d ? cap(WEEKDAYS[weekdayOfIso(d)]!) : null,
      speech,
    };
  }
}

/** A clock time in what someone said, and the text it came from. */
export function parseTime(words: string): { time: string; matched: string } | null {
  const s = words.replace(/a\.m\./g, 'am').replace(/p\.m\./g, 'pm');
  const noon = /\b(noon|midday)\b/.exec(s);
  if (noon) return { time: '12:00', matched: noon[0] };

  const withMeridiem = /\b(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)\b/.exec(s);
  if (withMeridiem) {
    let h = Number(withMeridiem[1]);
    const m = Number(withMeridiem[2] ?? 0);
    if (h < 1 || h > 12 || m > 59) return null;
    if (withMeridiem[3] === 'pm' && h !== 12) h += 12;
    if (withMeridiem[3] === 'am' && h === 12) h = 0;
    return { time: hhmm(h, m), matched: withMeridiem[0] };
  }

  const clock = /\b(\d{1,2})[:.](\d{2})\b/.exec(s);
  const bare = /\b(?:at\s+)?(\d{1,2})\s*o'?clock\b|\bat\s+(\d{1,2})\b(?!\s*(?:st|nd|rd|th)\b)/.exec(
    s,
  );
  const m = clock ?? bare;
  if (!m) return null;
  let h = Number(clock ? clock[1] : (bare![1] ?? bare![2]));
  const min = clock ? Number(clock[2]) : 0;
  if (h > 23 || min > 59) return null;
  // No AM or PM: in an office day, 1 to 7 is the afternoon.
  if (h >= 1 && h <= 7) h += 12;
  return { time: hhmm(h, min), matched: m[0] };
}

/** A YYYY-MM-DD, null when no day was said, or 'invalid' when one was but not understood. */
export function parseDay(
  words: string,
  today: string,
  todayWeekday: number,
): string | null | 'invalid' {
  const s = words
    .replace(/[,.!?]/g, ' ')
    .replace(
      /\b(on|at|the|this|coming|next|please|for|of|in|around|about|a|viewing|appointment|book|me)\b/g,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return null;

  const iso = /\b\d{4}-\d{2}-\d{2}\b/.exec(s);
  if (iso && ISO_DATE.test(iso[0])) return iso[0];
  if (/\bday after tomorrow\b/.test(s)) return addDaysIso(today, 2);
  if (/\btomorrow\b/.test(s)) return addDaysIso(today, 1);
  if (/\btoday\b/.test(s)) return today;

  const wd = WEEKDAYS.findIndex((w, i) => new RegExp(`\\b(${w}|${SHORT_WEEKDAYS[i]})\\b`).test(s));
  if (wd >= 0) {
    // The coming one; said on the same weekday, it means a week later.
    const delta = (wd - todayWeekday + 7) % 7 || 7;
    return addDaysIso(today, delta);
  }

  const monthIdx = MONTHS.findIndex((m) => new RegExp(`\\b${m.slice(0, 3)}[a-z]*\\b`).test(s));
  const dayNum = /\b(\d{1,2})(?:st|nd|rd|th)?\b/.exec(s);
  if (dayNum) {
    const d = Number(dayNum[1]);
    const [ty, tm] = today.split('-').map(Number) as [number, number];
    if (monthIdx >= 0) {
      let candidate = isoOf(ty, monthIdx + 1, d);
      if (candidate && candidate < today) candidate = isoOf(ty + 1, monthIdx + 1, d);
      return candidate ?? 'invalid';
    }
    let candidate = isoOf(ty, tm, d);
    if (candidate && candidate < today)
      candidate = isoOf(tm === 12 ? ty + 1 : ty, tm === 12 ? 1 : tm + 1, d);
    return candidate ?? 'invalid';
  }
  return 'invalid';
}

function isoOf(y: number, m: number, d: number): string | null {
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return dt.toISOString().slice(0, 10);
}

/** "Friday 16 October". */
function spokenDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
    .format(new Date(Date.UTC(y, m - 1, d)))
    .replace(',', '');
}

/** "Monday to Friday", or a list when the days are not a run. */
function spokenDays(days: number[]): string {
  const sorted = [...days].sort((a, b) => a - b);
  const run = sorted.every((d, i) => i === 0 || d === sorted[i - 1]! + 1);
  if (run && sorted.length > 2) {
    return `${cap(WEEKDAYS[sorted[0]!]!)} to ${cap(WEEKDAYS[sorted[sorted.length - 1]!]!)}`;
  }
  const names = sorted.map((d) => cap(WEEKDAYS[d]!));
  return names.length <= 1
    ? names.join('')
    : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}

function hhmm(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function isTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
