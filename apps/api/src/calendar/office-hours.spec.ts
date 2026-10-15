import { describe, expect, it } from 'vitest';
import { checkOfficeHours, officeHoursFrom, parseTime } from './office-hours';

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
    expect(r).toMatchObject({ ok: false, date: '2026-10-17', weekday: 'Saturday' });
    expect(r.speech).toContain('closed on Saturdays');
    expect(check('Sunday', '10am').ok).toBe(false);
  });

  it('refuses times outside the hours', () => {
    expect(check('Friday', '8pm')).toMatchObject({ ok: false, time: '20:00' });
    expect(check('Friday', '8am').ok).toBe(false);
    expect(check('Friday', '5pm').ok).toBe(false);
  });

  it('refuses the Monday lunch hour only on Monday', () => {
    const r = check('Monday', '12:30pm');
    expect(r).toMatchObject({ ok: false, date: '2026-10-19' });
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
    expect(check('Friday')).toMatchObject({ ok: false, date: '2026-10-16', time: null });
    expect(check('', '3pm')).toMatchObject({ ok: false, date: null, time: '15:00' });
    expect(check('', '').ok).toBe(false);
  });

  it('allows the same time twice: nothing is stored', () => {
    expect(check('Friday', '3pm').ok).toBe(true);
    expect(check('Friday', '3pm').ok).toBe(true);
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
