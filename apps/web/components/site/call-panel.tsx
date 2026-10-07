'use client';

import { useState } from 'react';
import { ArrowLeft, Check, Info, Loader2, Mic, PhoneCall, PhoneIncoming, X } from 'lucide-react';
import {
  DEFAULT_DIALLING_COUNTRY,
  DIALLING_COUNTRIES,
  composeE164,
  countryByCode,
  countryForE164,
  type DograhWidgetDto,
} from '@superdemo/contracts';
import { cn } from '@/lib/utils';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3101';

type CallType = DograhWidgetDto['callTypes'][number];

const OPTIONS: Record<CallType, { label: string; note: string; icon: typeof Mic }> = {
  inbound: {
    label: 'Talk now',
    note: 'Speak to our AI assistant in your browser',
    icon: Mic,
  },
  outbound: {
    label: 'Call me back',
    note: 'Our assistant rings you in a few seconds',
    icon: PhoneIncoming,
  },
  info: {
    label: 'Get an info call',
    note: 'A short call with the key information',
    icon: Info,
  },
};

/**
 * The centre's three demo calls, offered to a visitor.
 *
 * Mounted by the page rather than by a template, because only the in-house
 * templates carry a working callback form — the ported designs' forms are
 * presentational — and this has to reach every design. Bottom-left so it never
 * sits on Dograh's own pill or the chat bubble, which both live bottom-right.
 *
 * `inbound` presses Dograh's own call button rather than mounting a second
 * widget: the bundle allows one floating instance per page (see DograhWidget).
 * The other two post to the public leads endpoint with a `callType`, so a
 * visitor who asks for a call is also captured as a lead, exactly as the
 * callback form does.
 */
export function CallPanel({
  slug,
  callTypes,
  centreNumber,
}: {
  slug: string;
  callTypes: CallType[];
  centreNumber?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<'outbound' | 'info' | null>(null);
  const [hint, setHint] = useState('');

  if (callTypes.length === 0) return null;

  const talkNow = () => {
    const cta = document.getElementById('dograh-widget-cta');
    if (cta) {
      cta.click();
      setOpen(false);
    } else {
      // The widget script loads lazily; on a very fast click it is not there yet.
      setHint('The call button is still loading — try again in a moment.');
    }
  };

  return (
    <div className="fixed bottom-5 left-5 z-[2147483000] flex flex-col items-start gap-2">
      {open && (
        <div
          role="dialog"
          aria-label="Try our AI assistant"
          className="w-[min(20rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-border bg-background text-foreground shadow-2xl"
        >
          <div className="flex items-center justify-between gap-2 bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              {picked && (
                <button
                  type="button"
                  aria-label="Back"
                  onClick={() => setPicked(null)}
                  className="rounded p-0.5 hover:bg-white/15"
                >
                  <ArrowLeft className="size-4" aria-hidden />
                </button>
              )}
              <p className="text-sm font-semibold">
                {picked ? OPTIONS[picked].label : 'Try our AI assistant'}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="rounded p-0.5 hover:bg-white/15"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>

          <div className="p-3">
            {picked ? (
              <RingForm
                slug={slug}
                callType={picked}
                centreNumber={centreNumber}
                key={picked}
              />
            ) : (
              <div className="grid gap-2">
                {callTypes.map((t) => {
                  const o = OPTIONS[t];
                  const Icon = o.icon;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => (t === 'inbound' ? talkNow() : setPicked(t))}
                      className="flex items-center gap-3 rounded-xl border border-border p-3 text-left transition hover:border-primary/50 hover:bg-primary/5"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">{o.label}</span>
                        <span className="block text-xs text-muted-foreground">{o.note}</span>
                      </span>
                    </button>
                  );
                })}
                {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setHint('');
        }}
        aria-expanded={open}
        className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90"
      >
        {open ? <X className="size-4" aria-hidden /> : <PhoneCall className="size-4" aria-hidden />}
        {open ? 'Close' : 'Try our AI assistant'}
      </button>
    </div>
  );
}

/** Name and number, then Dograh rings them with the chosen agent. */
function RingForm({
  slug,
  callType,
  centreNumber,
}: {
  slug: string;
  callType: 'outbound' | 'info';
  centreNumber?: string | null;
}) {
  const [country, setCountry] = useState(
    () => countryForE164(centreNumber)?.code ?? DEFAULT_DIALLING_COUNTRY,
  );
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [reply, setReply] = useState('');

  const chosen = countryByCode(country);
  const composed = phone.trim() ? composeE164(chosen, phone) : '';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    try {
      const res = await fetch(`${API}/api/public/sites/${encodeURIComponent(slug)}/leads`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, phone, country, source: 'call-panel', callType }),
      });
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setState('error');
        setReply(body.message ?? 'We could not place that call just now.');
        return;
      }
      setState('done');
      setReply(body.message ?? 'Thank you — we are calling you now.');
    } catch {
      setState('error');
      setReply('We could not reach the server. Please try again.');
    }
  }

  if (state === 'done') {
    return (
      <div className="flex items-start gap-2.5 rounded-xl bg-primary/5 p-3">
        <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3.5" aria-hidden />
        </span>
        <p className="text-sm">{reply}</p>
      </div>
    );
  }

  const field =
    'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40';

  return (
    <form onSubmit={submit} className="grid gap-2">
      <input
        required
        minLength={2}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        autoComplete="name"
        className={field}
      />
      <div className="flex gap-2">
        <select
          aria-label="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className={cn(field, 'w-24 shrink-0 px-2')}
        >
          {DIALLING_COUNTRIES.map((c) => (
            <option key={`${c.code}-${c.dial}`} value={c.code}>
              {c.flag} +{c.dial}
            </option>
          ))}
        </select>
        <input
          required
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={chosen.example}
          aria-label="Phone number"
          className={field}
        />
      </div>
      {composed && <p className="text-xs text-muted-foreground">We will call {composed}</p>}
      <button
        type="submit"
        disabled={state === 'sending'}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-70"
      >
        {state === 'sending' ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <PhoneCall className="size-4" aria-hidden />
        )}
        {state === 'sending' ? 'Placing the call…' : 'Call me now'}
      </button>
      {state === 'error' && <p className="text-xs text-destructive">{reply}</p>}
    </form>
  );
}
