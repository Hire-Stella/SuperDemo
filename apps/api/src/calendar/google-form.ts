/**
 * Submit a Google Form on a voice agent's behalf, and answer in one line.
 *
 * A Dograh HTTP tool that posts straight to `formResponse` hands the model
 * Google's whole thank-you page — 75 KB of HTML. That is ~20k tokens the
 * model must read before it can speak, which on a small model means seconds
 * of silence, a fallback to a slower model, and the page riding along in the
 * context for the rest of the call. Relayed through here, the model reads
 * `{ ok: true }` instead.
 *
 * Only `entry.<number>` fields go through, and only to docs.google.com, so
 * this is no more of an open relay than the public form itself.
 */

import { checkOfficeHours, slotTokenValid, type OfficeHours } from './office-hours';

export interface GoogleFormResult {
  ok: boolean;
  /** Why it failed, in a few words, when it did. */
  detail?: string;
  /** What the agent says when the slot was refused, verbatim. */
  speech?: string;
}

/**
 * The booking's slot, re-checked on the way in.
 *
 * The agent is told to save only a slot the office-hours check accepted, but
 * a model can read a refused slot back and save it anyway; this is where
 * that stops. The same rules the check used are applied to the `date` and
 * `time` fields of the form, and a past, closed or out-of-hours slot is
 * answered with a sentence instead of being written to the sheet.
 */
export interface SlotGuard {
  dateField: string;
  timeField: string;
  hours: OfficeHours;
  /**
   * When set, the body must also carry `check_token`: the token the
   * office-hours check returned for this very date and time. A model that
   * skipped the check and read a slot back from memory has no token to give,
   * and that is the one mistake re-checking the hours cannot catch.
   */
  tokenSecret?: string;
}

/**
 * A field value as the caller meant it. Some models wrap every tool argument
 * in its own quotation marks ("\"Sachin\""), which would otherwise end up in
 * the sheet, and fail the date and time formats below.
 */
function plain(value: unknown): string {
  const s = String(value ?? '').trim();
  const m = /^"(.*)"$/s.exec(s) ?? /^'(.*)'$/s.exec(s);
  return (m ? m[1]! : s).trim();
}

export function guardSlot(body: unknown, guard: SlotGuard): GoogleFormResult | null {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const date = plain(b[guard.dateField]);
  const time = plain(b[guard.timeField]);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return {
      ok: false,
      detail: 'slot not understood',
      speech: 'Sorry, which day and time would you like?',
    };
  }
  if (guard.tokenSecret && !slotTokenValid(plain(b.check_token), date, time, guard.tokenSecret)) {
    return {
      ok: false,
      detail: 'slot not checked',
      speech: 'Sorry, I need to check that day and time first. Which day and time would you like?',
    };
  }
  const r = checkOfficeHours(date, time, guard.hours);
  return r.ok ? null : { ok: false, detail: 'slot not available', speech: r.speech };
}

/** The `e/…` id from a form's share link, e.g. 1FAIpQLSc0fBbhTiFW… */
const FORM_ID = /^[A-Za-z0-9_-]{20,120}$/;
const ENTRY = /^entry\.\d+$/;
const MAX_FIELDS = 50;
const MAX_VALUE = 2000;

export function formFields(body: unknown): URLSearchParams {
  const out = new URLSearchParams();
  if (!body || typeof body !== 'object') return out;
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (!ENTRY.test(key) || value == null || typeof value === 'object') continue;
    out.append(key, plain(value).slice(0, MAX_VALUE));
    if ([...out.keys()].length >= MAX_FIELDS) break;
  }
  return out;
}

export async function submitGoogleForm(
  formId: string,
  body: unknown,
  fetchImpl: typeof fetch = fetch,
  guard: SlotGuard | null = null,
): Promise<GoogleFormResult> {
  if (!FORM_ID.test(formId)) return { ok: false, detail: 'unknown form' };
  if (guard) {
    const refused = guardSlot(body, guard);
    if (refused) return refused;
  }
  const fields = formFields(body);
  if (![...fields.keys()].length) return { ok: false, detail: 'no form fields' };

  try {
    const res = await fetchImpl(`https://docs.google.com/forms/d/e/${formId}/formResponse`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: fields.toString(),
      signal: AbortSignal.timeout(8_000),
    });
    // Drain the page so the socket is released; nobody needs to read it.
    await res.arrayBuffer().catch(() => undefined);
    return res.ok ? { ok: true } : { ok: false, detail: `form answered ${res.status}` };
  } catch (e) {
    return {
      ok: false,
      detail:
        e instanceof Error && e.name === 'TimeoutError' ? 'form timed out' : 'form unreachable',
    };
  }
}
