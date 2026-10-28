import { describe, expect, it, vi } from 'vitest';
import { formFields, guardSlot, submitGoogleForm } from './google-form';
import { officeHoursFrom, slotToken } from './office-hours';

const FORM = '1FAIpQLSc0fBbhTiFW-RfaYkBUews8XiNsTIfeJgxMzWnfrK4rlZwePw';
const page = (status: number) => new Response('<!DOCTYPE html>' + 'x'.repeat(75_000), { status });

describe('formFields', () => {
  it('keeps only entry.<number> fields with plain values', () => {
    const f = formFields({
      'entry.950186145': 'Sachin',
      'entry.1378196029': '2026-10-22',
      'entry.3864614': 15,
      fvv: '1',
      'entry.x': 'no',
      'entry.1': { nested: true },
      'entry.2': null,
    });
    expect(f.toString()).toBe(
      'entry.950186145=Sachin&entry.1378196029=2026-10-22&entry.3864614=15',
    );
  });

  it('strips the quotation marks a model wraps around every value', () => {
    expect(
      formFields({
        'entry.1': '"Sachin"',
        'entry.2': "'2026-10-26'",
        'entry.3': ' "09:00" ',
      }).toString(),
    ).toBe('entry.1=Sachin&entry.2=2026-10-26&entry.3=09%3A00');
  });

  it('ignores a body that is not an object', () => {
    expect(formFields('entry.1=a').toString()).toBe('');
    expect(formFields(undefined).toString()).toBe('');
  });
});

describe('guardSlot', () => {
  const hours = officeHoursFrom({
    tz: 'Asia/Dubai',
    days: '1,2,3,4,5',
    open: '09:00',
    close: '17:00',
    breaks: '1@12:00-13:00',
  });
  const guard = { dateField: 'entry.1378196029', timeField: 'entry.3864614', hours };
  const slot = (date: string, time: string) => ({
    'entry.1378196029': date,
    'entry.3864614': time,
  });
  const future = new Date(Date.now() + 14 * 864e5);
  // The next Tuesday at least two weeks out: a weekday, well in the future.
  while (future.getUTCDay() !== 2) future.setUTCDate(future.getUTCDate() + 1);
  const tuesday = future.toISOString().slice(0, 10);

  it('lets a valid future weekday slot through', () => {
    expect(guardSlot(slot(tuesday, '14:00'), guard)).toBeNull();
    // …also when the model has quoted the values.
    expect(guardSlot(slot(`"${tuesday}"`, '"14:00"'), guard)).toBeNull();
  });

  it('refuses a slot in the past, with the sentence the agent should say', () => {
    const r = guardSlot(slot('2020-01-06', '10:00'), guard);
    expect(r).toMatchObject({ ok: false, detail: 'slot not available' });
    expect(r!.speech).toContain('has already passed');
  });

  it('refuses the Monday break and the weekend', () => {
    const monday = new Date(future);
    monday.setUTCDate(monday.getUTCDate() + 6);
    const saturday = new Date(future);
    saturday.setUTCDate(saturday.getUTCDate() + 4);
    expect(guardSlot(slot(monday.toISOString().slice(0, 10), '12:30'), guard)!.speech).toContain(
      'not available',
    );
    expect(guardSlot(slot(saturday.toISOString().slice(0, 10), '10:00'), guard)!.speech).toContain(
      'closed',
    );
  });

  it('with a secret, insists on the token the check handed out for that very slot', () => {
    const withToken = { ...guard, tokenSecret: 'secret-for-tests' };
    const token = slotToken(tuesday, '14:00', 'secret-for-tests');
    expect(guardSlot({ ...slot(tuesday, '14:00'), check_token: token }, withToken)).toBeNull();
    // No token: the slot was never checked, so it is not saved.
    expect(guardSlot(slot(tuesday, '14:00'), withToken)).toMatchObject({
      ok: false,
      detail: 'slot not checked',
    });
    // A token for another time, or a made-up one, is no better.
    expect(guardSlot({ ...slot(tuesday, '15:00'), check_token: token }, withToken)).toMatchObject({
      detail: 'slot not checked',
    });
    expect(
      guardSlot({ ...slot(tuesday, '14:00'), check_token: 'x'.repeat(24) }, withToken),
    ).toMatchObject({ detail: 'slot not checked' });
    // The token itself never reaches the form.
    expect(formFields({ ...slot(tuesday, '14:00'), check_token: token }).has('check_token')).toBe(
      false,
    );
  });

  it('refuses anything that is not YYYY-MM-DD and HH:MM', () => {
    expect(guardSlot(slot('tomorrow', '3 PM'), guard)).toMatchObject({
      ok: false,
      detail: 'slot not understood',
    });
    expect(guardSlot({}, guard)).toMatchObject({ ok: false });
  });
});

describe('submitGoogleForm', () => {
  it('does not post a refused slot', async () => {
    const fetchImpl = vi.fn();
    const hours = officeHoursFrom({ tz: 'Asia/Dubai', days: '1,2,3,4,5' });
    const r = await submitGoogleForm(
      FORM,
      { 'entry.1': '2020-01-06', 'entry.2': '10:00' },
      fetchImpl,
      {
        dateField: 'entry.1',
        timeField: 'entry.2',
        hours,
      },
    );
    expect(r.ok).toBe(false);
    expect(r.speech).toContain('has already passed');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('posts the fields to the form and answers in one line, not the page', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(page(200));
    const r = await submitGoogleForm(FORM, { 'entry.950186145': 'Sachin' }, fetchImpl);
    expect(r).toEqual({ ok: true });
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe(`https://docs.google.com/forms/d/e/${FORM}/formResponse`);
    expect(init.method).toBe('POST');
    expect(init.body).toBe('entry.950186145=Sachin');
  });

  it('says so when Google refuses', async () => {
    const r = await submitGoogleForm(
      FORM,
      { 'entry.1': 'a' },
      vi.fn().mockResolvedValue(page(400)),
    );
    expect(r).toEqual({ ok: false, detail: 'form answered 400' });
  });

  it('says so when Google cannot be reached', async () => {
    const r = await submitGoogleForm(
      FORM,
      { 'entry.1': 'a' },
      vi.fn().mockRejectedValue(new TypeError('fetch failed')),
    );
    expect(r).toEqual({ ok: false, detail: 'form unreachable' });
  });

  it('never calls out for a bad form id or no fields', async () => {
    const fetchImpl = vi.fn();
    expect(await submitGoogleForm('../../evil', { 'entry.1': 'a' }, fetchImpl)).toMatchObject({
      ok: false,
    });
    expect(await submitGoogleForm(FORM, { name: 'a' }, fetchImpl)).toMatchObject({ ok: false });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
