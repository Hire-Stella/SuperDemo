import { describe, expect, it } from 'vitest';
import {
  checkOfficeHours,
  officeHoursFrom,
  officeHoursNow,
  parseDay,
  parseTime,
  slotTokenValid,
} from './office-hours';

// Thursday 15 October 2026, 2:30 PM in Dubai.
const NOW = new Date('2026-10-15T10:30:00Z');
const TBRE = officeHoursFrom({
  tz: 'Asia/Dubai',
  days: '1,2,3,4,5',
  open: '09:00',
  close: '17:00',
  breaks: '1@12:00-13:00',
});
const check = (day: string, time = '') => checkOfficeHours(day, time, TBRE, NOW);

describe('checkOfficeHours', () => {
  it('turns "tomorrow" into the right date', () => {
    expect(check('tomorrow', '4pm')).toMatchObject({
      ok: true,
      date: '2026-10-16',
      time: '16:00',
      weekday: 'Friday',
      speech: 'Friday 16 October at 4 PM is within office hours.',
    });
  });

  it('accepts any minute inside the hours, not just a slot grid', () => {
    expect(check('Friday', '2:15 PM')).toMatchObject({ ok: true, time: '14:15' });
    expect(check('Friday', '9am')).toMatchObject({ ok: true, time: '09:00' });
    expect(check('Friday', '4:59pm')).toMatchObject({ ok: true, time: '16:59' });
  });

  it('refuses the weekend', () => {
    const r = check('day after tomorrow', '11am');
    expect(r).toMatchObject({ ok: false, date: null, time: null, weekday: 'Saturday' });
    expect(r.speech).toContain('closed on Saturdays');
    expect(check('Sunday', '10am').ok).toBe(false);
  });

  it('says a day of this month that has just gone by has passed, rather than booking next year', () => {
    const r = check('the 10th of October', '10am');
    expect(r).toMatchObject({ ok: false, date: null, weekday: 'Saturday' });
    expect(r.speech).toContain('has already passed');
  });

  it('still takes a month that is long gone as next year', () => {
    expect(check('the 5th of January', '10am')).toMatchObject({ ok: true, date: '2027-01-05' });
  });

  it('puts "next week" a week after the coming weekday', () => {
    expect(check('Friday', '11am')).toMatchObject({ date: '2026-10-16' });
    expect(check('next Friday', '11am')).toMatchObject({ date: '2026-10-16' });
    expect(check('Friday next week', '11am')).toMatchObject({ date: '2026-10-23' });
    expect(check('next week Friday', '11am')).toMatchObject({ date: '2026-10-23' });
  });

  it("says the centre's own line for a closed day when it has one", () => {
    const offer =
      'Weekend viewings need to be confirmed by the TBRE team. Shall I transfer you to Liezl?';
    const hours = officeHoursFrom({ tz: 'Asia/Dubai', days: '1,2,3,4,5', closed: offer });
    const r = checkOfficeHours('Saturday', '10am', hours, NOW);
    expect(r).toMatchObject({ ok: false, weekday: 'Saturday', speech: offer });
    // A past day is still a past day, whatever the closed-day line says.
    expect(checkOfficeHours('the 10th of October', '10am', hours, NOW).speech).toContain(
      'has already passed',
    );
  });

  it('reads a zero-padded 24-hour time literally, but a bare "2" as the afternoon', () => {
    expect(check('tomorrow', '02:00')).toMatchObject({ ok: false, time: null });
    expect(check('tomorrow', '02:00').speech).toContain('2 AM is outside office hours');
    expect(check('tomorrow', '2:00')).toMatchObject({ ok: true, time: '14:00' });
    expect(check('tomorrow', '14:00')).toMatchObject({ ok: true, time: '14:00' });
  });

  it('understands times written as words', () => {
    expect(check('tomorrow', 'two PM')).toMatchObject({ ok: true, time: '14:00' });
    expect(check('tomorrow', 'four forty-five PM')).toMatchObject({ ok: true, time: '16:45' });
    expect(check('tomorrow', 'ten fifteen AM')).toMatchObject({ ok: true, time: '10:15' });
    expect(check('tomorrow', 'one AM')).toMatchObject({ ok: false, time: null });
    expect(check('tomorrow', 'one AM').speech).toContain('1 AM is outside office hours');
  });

  it('refuses a day beyond the booking window, after the past check and before the weekend check', () => {
    const windowed = officeHoursFrom({ tz: 'Asia/Dubai', days: '1,2,3,4,5', max_days: '30' });
    // NOW is Thursday 15 October 2026: 13 November is 29 days out, 16 November is 32.
    expect(checkOfficeHours('13 November', '10am', windowed, NOW)).toMatchObject({
      ok: true,
      date: '2026-11-13',
    });
    const far = checkOfficeHours('16 November', '10am', windowed, NOW);
    expect(far).toMatchObject({ ok: false, date: null });
    expect(far.speech).toContain('more than thirty days away');
    // A past day is still "passed", and a weekend inside the window is still "closed".
    expect(checkOfficeHours('the 10th of October', '10am', windowed, NOW).speech).toContain(
      'has already passed',
    );
    expect(checkOfficeHours('Saturday', '10am', windowed, NOW).speech).toContain('closed');
    // Without max_days, nothing changes.
    expect(check('16 November', '10am')).toMatchObject({ ok: true });
  });

  it('counts days and weeks ahead from today', () => {
    // parseDay alone: the slot's weekday is beside the point here.
    const day = (words: string) => parseDay(words, '2026-10-15', 4);
    expect(day('5 days from today')).toBe('2026-10-20');
    expect(day('in 3 days')).toBe('2026-10-18');
    expect(day('in two weeks')).toBe('2026-10-29');
    expect(day('a week from now')).toBe('2026-10-22');
    expect(day('next week')).toBe('2026-10-22');
    expect(day('a couple of days')).toBe('2026-10-17');
    expect(day('friday next week')).toBe('2026-10-23');
  });

  it('counts "after 5 days" as five days, never as the 5th of the month', () => {
    const day = (words: string) => parseDay(words, '2026-10-15', 4);
    expect(day('after 5 days')).toBe('2026-10-20');
    expect(day('after 10 days')).toBe('2026-10-25');
    expect(day('after fifteen days')).toBe('2026-10-30');
    expect(day('10 days later')).toBe('2026-10-25');
    expect(day('after a week')).toBe('2026-10-22');
    expect(day('after two weeks')).toBe('2026-10-29');
    expect(check('after 5 days', '10am')).toMatchObject({
      ok: true,
      date: '2026-10-20',
      weekday: 'Tuesday',
      readback: 'Tuesday the twentieth of October at ten AM',
    });
    // A bare "5" is still a day of the month.
    expect(day('the 5th')).toBe('2026-11-05');
  });

  it('reads a day of the month written as an ordinal word', () => {
    const day = (words: string) => parseDay(words, '2026-10-15', 4);
    expect(day('the twenty-sixth of october')).toBe('2026-10-26');
    expect(day('the twenty sixth of october')).toBe('2026-10-26');
    expect(day('the first of november')).toBe('2026-11-01');
    expect(day('the thirtieth of october')).toBe('2026-10-30');
    expect(check('the twenty-sixth of October', 'three PM')).toMatchObject({
      date: '2026-10-26',
      time: '15:00',
    });
  });

  it('hands the agent the spoken read-back for an accepted slot', () => {
    expect(check('tomorrow', '4:45pm').readback).toBe(
      'Friday the sixteenth of October at four forty-five PM',
    );
    expect(check('the 22nd of October', '10am').readback).toBe(
      'Thursday the twenty-second of October at ten AM',
    );
    expect(check('Monday', '1:05pm').readback).toBe(
      'Monday the nineteenth of October at one oh five PM',
    );
    expect(check('Saturday', '10am').readback).toBeNull();
  });

  it('hands the save step a token for an accepted slot, and only then', () => {
    const r = checkOfficeHours('tomorrow', '4pm', TBRE, NOW, 'secret-for-tests');
    expect(r.token).toHaveLength(24);
    expect(slotTokenValid(r.token, '2026-10-16', '16:00', 'secret-for-tests')).toBe(true);
    expect(slotTokenValid(r.token, '2026-10-16', '16:30', 'secret-for-tests')).toBe(false);
    expect(slotTokenValid(r.token, '2026-10-16', '16:00', 'another-secret')).toBe(false);
    expect(slotTokenValid(undefined, '2026-10-16', '16:00', 'secret-for-tests')).toBe(false);
    expect(checkOfficeHours('Saturday', '10am', TBRE, NOW, 'secret-for-tests').token).toBeNull();
    // Without a secret there is no token, and the rest of the answer is unchanged.
    expect(check('tomorrow', '4pm').token).toBeNull();
  });

  it('refuses times outside the hours', () => {
    expect(check('Friday', '8pm')).toMatchObject({ ok: false, time: null });
    expect(check('Friday', '8am').ok).toBe(false);
    expect(check('Friday', '5pm').ok).toBe(false);
  });

  it('refuses the Monday lunch hour only on Monday', () => {
    const r = check('Monday', '12:30pm');
    expect(r).toMatchObject({ ok: false, date: null, weekday: 'Monday' });
    expect(r.speech).toContain('12 PM to 1 PM is not available');
    expect(check('Monday', '1pm').ok).toBe(true);
    expect(check('Tuesday', '12:30pm').ok).toBe(true);
  });

  it('refuses a time already gone today', () => {
    expect(check('today', '10am').ok).toBe(false);
    expect(check('today', '4pm').ok).toBe(true);
  });

  it('understands the phrase in either field', () => {
    expect(check('tomorrow at 3pm')).toMatchObject({ ok: true, date: '2026-10-16', time: '15:00' });
    expect(check('', 'next Tuesday 10:30')).toMatchObject({
      ok: true,
      date: '2026-10-20',
      time: '10:30',
    });
  });

  it('understands dates', () => {
    expect(check('2026-10-21', '11am')).toMatchObject({ ok: true, date: '2026-10-21' });
    expect(check('21st October', '11am')).toMatchObject({ ok: true, date: '2026-10-21' });
    expect(check('the 21st', '11am')).toMatchObject({ ok: true, date: '2026-10-21' });
  });

  it('asks for what is missing', () => {
    expect(check('Friday')).toMatchObject({ ok: false, date: null, time: null, weekday: 'Friday' });
    expect(check('', '3pm')).toMatchObject({ ok: false, date: null, time: null });
    expect(check('', '').ok).toBe(false);
  });

  it('allows the same time twice: nothing is stored', () => {
    expect(check('Friday', '3pm').ok).toBe(true);
    expect(check('Friday', '3pm').ok).toBe(true);
  });
});

describe('officeHoursNow', () => {
  it('says the moment in words, and the same facts for a pre-call fetch', () => {
    const r = officeHoursNow('Asia/Dubai', NOW);
    expect(r).toMatchObject({ ok: true, date: '2026-10-15', weekday: 'Thursday', time: '14:30' });
    expect(r.speech).toBe(
      'Right now it is two thirty PM on Thursday the fifteenth of October twenty twenty-six, Dubai time.',
    );
    expect(r.initial_context).toEqual({
      today_date: '2026-10-15',
      today_weekday: 'Thursday',
      today_spoken: 'Thursday the fifteenth of October',
      time_now: '14:30',
      time_now_spoken: 'two thirty PM',
      now_sentence: r.speech,
    });
  });

  it('follows the zone', () => {
    // 10:30Z is 06:30 in New York and 19:30 in Tokyo.
    expect(officeHoursNow('America/New_York', NOW)).toMatchObject({ time: '06:30' });
    expect(officeHoursNow('Asia/Tokyo', NOW).speech).toContain('seven thirty PM');
  });
});

describe('parseTime', () => {
  it('reads the usual spoken forms', () => {
    expect(parseTime('3pm')?.time).toBe('15:00');
    expect(parseTime('3 p.m.')?.time).toBe('15:00');
    expect(parseTime('noon')?.time).toBe('12:00');
    expect(parseTime('15:30')?.time).toBe('15:30');
    expect(parseTime('at 3')?.time).toBe('15:00');
    expect(parseTime('at 10')?.time).toBe('10:00');
    expect(parseTime('12am')?.time).toBe('00:00');
    expect(parseTime('the 21st')).toBeNull();
  });
});
