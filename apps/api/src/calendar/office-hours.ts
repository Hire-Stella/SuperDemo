import { createHmac, timingSafeEqual } from 'node:crypto';
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
  /**
   * What to say for a day the office is closed, in place of the generic
   * sentence: a centre that hands weekend viewings to a person wants the
   * agent to offer that person, not to send the caller hunting for a weekday.
   */
  closedSpeech?: string;
  /** How far ahead a slot may be, in days from today; unlimited when unset. */
  maxDaysAhead?: number;
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
  /**
   * The accepted slot as it is spoken, "Monday the twenty-sixth of October at
   * ten AM", for the agent to read back word for word. Only when `ok`.
   */
  readback: string | null;
  /**
   * Proof that this slot passed the check, for the save step to hand back:
   * an HMAC of date and time under the server's secret. Only when `ok` and
   * the check was given a secret. A model that skipped the check and read a
   * slot back from memory has nothing to put here, and cannot make one up.
   */
  token: string | null;
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
  closed?: string;
  max_days?: string;
}): OfficeHours {
  const maxDays = Number(q.max_days);
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
    closedSpeech: q.closed?.trim().slice(0, 300) || undefined,
    maxDaysAhead: Number.isInteger(maxDays) && maxDays > 0 ? maxDays : undefined,
  };
}

export function checkOfficeHours(
  dayText: string,
  timeText: string,
  hours: OfficeHours,
  now: Date = new Date(),
  tokenSecret?: string,
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

  // A day that has gone is told so even if it falls on a closed day: that is
  // the caller's slip, and "closed on Saturdays" would send them hunting for
  // another day in the wrong week.
  if (date < today.date) {
    return result(false, date, time, `${spokenDate} has already passed. Which day would you like?`);
  }
  if (hours.maxDaysAhead && daysBetween(today.date, date) > hours.maxDaysAhead) {
    return result(
      false,
      date,
      time,
      `${spokenDate} is more than ${spokenNumber(hours.maxDaysAhead)} days away; we can book up to ${spokenNumber(hours.maxDaysAhead)} days ahead. Which day would suit you?`,
    );
  }
  if (!hours.days.includes(weekday)) {
    return result(
      false,
      date,
      time,
      hours.closedSpeech ??
        `The office is closed on ${dayName}s. We are open ${daysSpoken}, ${openSpoken}. Which day and time would suit you?`,
    );
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
      // Says the time now, so that two refusals in a row read as a fact
      // about the clock rather than as the same error twice.
      `${spokenClock(time)} today has already passed, it is ${spokenClock(today.time)} now. What later time would suit you?`,
    );
  }
  return result(true, date, time, `${spokenDate} at ${spokenClock(time)} is within office hours.`);

  function result(
    ok: boolean,
    d: string | null,
    t: string | null,
    speech: string,
  ): OfficeHoursCheck {
    // A slot that is not available carries no date or time: an agent that
    // reads `date` and `time` back as a booking cannot then offer a past or
    // closed slot, whatever it makes of `ok`. The weekday stays, because the
    // agent routes weekend requests on it.
    return {
      ok,
      date: ok ? d : null,
      time: ok ? t : null,
      weekday: d ? cap(WEEKDAYS[weekdayOfIso(d)]!) : null,
      speech,
      readback: ok && d && t ? `${spokenDateWords(d)} at ${spokenTimeWords(t)}` : null,
      token: ok && d && t && tokenSecret ? slotToken(d, t, tokenSecret) : null,
    };
  }
}

/** A clock time in what someone said, and the text it came from. */
export function parseTime(words: string): { time: string; matched: string } | null {
  // "two PM", "four forty-five PM", "ten fifteen AM": an agent told to speak
  // numbers as words sometimes writes them that way in a tool call too.
  const s = digitsForWords(words)
    .replace(/a\.m\./g, 'am')
    .replace(/p\.m\./g, 'pm');
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
  // No AM or PM: in an office day, 1 to 7 is the afternoon. "02:00", with
  // its leading zero, is already a 24-hour time and stays as it is.
  const zeroPadded = clock !== null && clock[1]!.length === 2 && clock[1]!.startsWith('0');
  if (!zeroPadded && h >= 1 && h <= 7) h += 12;
  return { time: hhmm(h, min), matched: m[0] };
}

/** A YYYY-MM-DD, null when no day was said, or 'invalid' when one was but not understood. */
export function parseDay(
  words: string,
  today: string,
  todayWeekday: number,
): string | null | 'invalid' {
  // "Friday next week" is the Friday after the coming one. Read before the
  // filler words go, because "next" is one of them.
  const nextWeek = /\bnext week\b/.test(words);
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
  const wd = WEEKDAYS.findIndex((w, i) => new RegExp(`\\b(${w}|${SHORT_WEEKDAYS[i]})\\b`).test(s));
  // "5 days from today", "in two weeks", "a week from now", "next week": a
  // count of days or weeks, read before "today"/"tomorrow" can match inside
  // them. A named weekday wins ("Friday next week" is handled below). The
  // filler stripping above has already removed "in", "a" and "next".
  if (wd < 0) {
    // "after 5 days", "10 days later", "after fifteen days" all land here too:
    // the count is what matters, not the word around it.
    const rel =
      /(?:\b(\d{1,2}|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|couple)\b(?: of)?\s+)?\b(day|days|week|weeks)\b/.exec(
        s,
      );
    if (rel) {
      const n = rel[1] ? (COUNT_WORDS[rel[1]] ?? Number(rel[1])) : 1;
      if (Number.isInteger(n) && n > 0)
        return addDaysIso(today, n * (rel[2]!.startsWith('week') ? 7 : 1));
    }
    if (nextWeek) return addDaysIso(today, 7);
  }
  if (/\btomorrow\b/.test(s)) return addDaysIso(today, 1);
  if (/\btoday\b/.test(s)) return today;

  if (wd >= 0) {
    // The coming one; said on the same weekday, it means a week later.
    const delta = (wd - todayWeekday + 7) % 7 || 7;
    return addDaysIso(today, delta + (nextWeek ? 7 : 0));
  }

  const monthIdx = MONTHS.findIndex((m) => new RegExp(`\\b${m.slice(0, 3)}[a-z]*\\b`).test(s));
  // "the twenty-sixth of October": an agent told to speak numbers as words
  // sometimes writes the day that way in a tool call too.
  const ordinal =
    /\b((?:twenty|thirty)(?:[\s-](?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth))?|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|thirtieth)\b/.exec(
      s,
    );
  const dayNum =
    /\b(\d{1,2})(?:st|nd|rd|th)?\b/.exec(s) ??
    (ordinal ? [ordinal[0], String(ordinalValue(ordinal[1]!))] : null);
  if (dayNum) {
    const d = Number(dayNum[1]);
    const [ty, tm] = today.split('-').map(Number) as [number, number];
    if (monthIdx >= 0) {
      let candidate = isoOf(ty, monthIdx + 1, d);
      // "The fifth of January" said in October means next January. "The
      // fifteenth of October" said on the twenty-first is a slip, and the
      // caller is better told it has passed than booked a year ahead.
      if (candidate && candidate < today && daysBetween(candidate, today) > 45) {
        candidate = isoOf(ty + 1, monthIdx + 1, d);
      }
      return candidate ?? 'invalid';
    }
    let candidate = isoOf(ty, tm, d);
    if (candidate && candidate < today)
      candidate = isoOf(tm === 12 ? ty + 1 : ty, tm === 12 ? 1 : tm + 1, d);
    return candidate ?? 'invalid';
  }
  return 'invalid';
}

const ORDINALS = [
  'first',
  'second',
  'third',
  'fourth',
  'fifth',
  'sixth',
  'seventh',
  'eighth',
  'ninth',
  'tenth',
  'eleventh',
  'twelfth',
  'thirteenth',
  'fourteenth',
  'fifteenth',
  'sixteenth',
  'seventeenth',
  'eighteenth',
  'nineteenth',
  'twentieth',
];

/** "twenty-sixth" → 26, "first" → 1, "thirtieth" → 30. */
function ordinalValue(word: string): number {
  const w = word.toLowerCase().replace(/\s/g, '-');
  if (w === 'thirtieth') return 30;
  if (w.startsWith('twenty') || w.startsWith('thirty')) {
    const base = w.startsWith('twenty') ? 20 : 30;
    const rest = w.split('-')[1];
    return rest ? base + ORDINALS.indexOf(rest) + 1 : base;
  }
  return ORDINALS.indexOf(w) + 1;
}

const COUNT_WORDS: Record<string, number> = {
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  couple: 2,
};

const UNITS: Record<string, number> = {
  zero: 0,
  oh: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
};
const TENS_WORDS: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fifty: 50 };

/**
 * Number words in a time, turned into digits: "four forty-five pm" becomes
 * "4:45 pm", "ten am" becomes "10 am", "two fifteen" becomes "2:15". Words
 * that are not a time are left alone.
 */
export function digitsForWords(text: string): string {
  const hour = '(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)';
  const minute =
    '(?:(twenty|thirty|forty|fifty)(?:[\\s-](one|two|three|four|five|six|seven|eight|nine))?|oh[\\s-](one|two|three|four|five|six|seven|eight|nine)|(ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen))';
  const re = new RegExp(
    `\\b${hour}(?:[\\s-]${minute})?(?=\\s*(?:am|pm|a\\.m\\.|p\\.m\\.|o'?clock|$|[,.?!]))`,
    'gi',
  );
  return text.replace(re, (_m, h, tens, tensUnit, ohUnit, teen) => {
    const hh = UNITS[h.toLowerCase()]!;
    let mm: number | null = null;
    if (tens)
      mm = TENS_WORDS[tens.toLowerCase()]! + (tensUnit ? UNITS[tensUnit.toLowerCase()]! : 0);
    else if (ohUnit) mm = UNITS[ohUnit.toLowerCase()]!;
    else if (teen) mm = UNITS[teen.toLowerCase()]!;
    return mm === null ? String(hh) : `${hh}:${String(mm).padStart(2, '0')}`;
  });
}

/** Whole days from one YYYY-MM-DD to another. */
function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 864e5);
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

/** "Monday the twenty-sixth of October": a date as a voice should say it. */
function spokenDateWords(iso: string): string {
  const [, m, d] = iso.split('-').map(Number) as [number, number, number];
  return `${cap(WEEKDAYS[weekdayOfIso(iso)]!)} the ${spokenOrdinal(d)} of ${cap(MONTHS[m - 1]!)}`;
}

/** 1 → "first", 22 → "twenty-second", 30 → "thirtieth". */
function spokenOrdinal(n: number): string {
  if (n <= 20) return ORDINALS[n - 1]!;
  if (n === 30) return 'thirtieth';
  const tens = n < 30 ? 'twenty' : 'thirty';
  return `${tens}-${ORDINALS[(n % 10) - 1]}`;
}

/** "ten AM", "four forty-five PM", "twelve oh five PM": a time as it is spoken. */
function spokenTimeWords(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number) as [number, number];
  const hour = spokenNumber(h % 12 || 12);
  const suffix = h < 12 ? 'AM' : 'PM';
  if (m === 0) return `${hour} ${suffix}`;
  return `${hour} ${m < 10 ? `oh ${spokenNumber(m)}` : spokenNumber(m)} ${suffix}`;
}

/** A small count in words, for speech: 30 → "thirty", 45 → "forty-five". */
function spokenNumber(n: number): string {
  const ones = [
    'zero',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
  ];
  const tens = [
    '',
    '',
    'twenty',
    'thirty',
    'forty',
    'fifty',
    'sixty',
    'seventy',
    'eighty',
    'ninety',
  ];
  if (n < 20) return ones[n]!;
  if (n < 100) return tens[Math.floor(n / 10)]! + (n % 10 ? `-${ones[n % 10]}` : '');
  return String(n);
}

/** 2026 → "twenty twenty-six", 2030 → "twenty thirty", 2105 → "twenty-one oh five". */
function spokenYear(y: number): string {
  const rest = y % 100;
  return `${spokenNumber(Math.floor(y / 100))} ${rest === 0 ? 'hundred' : rest < 10 ? `oh ${spokenNumber(rest)}` : spokenNumber(rest)}`;
}

/** "Now" in the centre's zone, for an agent that must never guess the date. */
export interface OfficeHoursNow {
  ok: true;
  timeZone: string;
  date: string;
  weekday: string;
  time: string;
  speech: string;
  /** The same facts under the names a Dograh pre-call fetch merges into the call context. */
  initial_context: {
    today_date: string;
    today_weekday: string;
    today_spoken: string;
    time_now: string;
    time_now_spoken: string;
    now_sentence: string;
  };
}

export function officeHoursNow(timeZone: string, now: Date = new Date()): OfficeHoursNow {
  const p = zonedParts(now, timeZone);
  const weekday = cap(WEEKDAYS[p.weekday]!);
  const todaySpoken = spokenDateWords(p.date);
  const timeSpoken = spokenTimeWords(p.time);
  const place = timeZone.split('/').pop()!.replace(/_/g, ' ');
  const speech = `Right now it is ${timeSpoken} on ${todaySpoken} ${spokenYear(Number(p.date.slice(0, 4)))}, ${place} time.`;
  return {
    ok: true,
    timeZone,
    date: p.date,
    weekday,
    time: p.time,
    speech,
    initial_context: {
      today_date: p.date,
      today_weekday: weekday,
      today_spoken: todaySpoken,
      time_now: p.time,
      time_now_spoken: timeSpoken,
      now_sentence: speech,
    },
  };
}

/** The proof a slot passed the check: an HMAC of date and time, 24 url-safe characters. */
export function slotToken(date: string, time: string, secret: string): string {
  return createHmac('sha256', `office-hours-slot:${secret}`)
    .update(`${date}|${time}`)
    .digest('base64url')
    .slice(0, 24);
}

export function slotTokenValid(
  token: unknown,
  date: string,
  time: string,
  secret: string,
): boolean {
  if (typeof token !== 'string' || token.length !== 24) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(slotToken(date, time, secret)));
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
