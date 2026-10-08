'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Info,
  Loader2,
  Mic,
  PhoneCall,
  PhoneIncoming,
  X,
} from 'lucide-react';
import {
  DEFAULT_DIALLING_COUNTRY,
  DIALLING_COUNTRIES,
  composeE164,
  countryByCode,
  countryForE164,
  type AvailabilityOutput,
  type DograhWidgetDto,
} from '@superdemo/contracts';
import { cn } from '@/lib/utils';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3101';

type CallType = DograhWidgetDto['callTypes'][number];
type Option = CallType | 'book';

const OPTIONS: Record<Option, { label: string; note: string; icon: typeof Mic }> = {
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
  book: {
    label: 'Book an appointment',
    note: 'Pick a free time that suits you',
    icon: CalendarDays,
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
  booking,
  centreNumber,
}: {
  slug: string;
  callTypes: CallType[];
  /** Whether to offer booking into the centre's calendar. */
  booking: boolean;
  centreNumber?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<'outbound' | 'info' | 'book' | null>(null);
  const [hint, setHint] = useState('');

  const options: Option[] = [...callTypes, ...(booking ? (['book'] as const) : [])];
  if (options.length === 0) return null;
  // A page offering only booking should not promise an AI conversation.
  const launcher = options.length === 1 && booking ? 'Book an appointment' : 'Try our AI assistant';

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
                {picked ? OPTIONS[picked].label : launcher}
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
            {picked === 'book' ? (
              <BookForm slug={slug} centreNumber={centreNumber} />
            ) : picked ? (
              <RingForm
                slug={slug}
                callType={picked}
                centreNumber={centreNumber}
                key={picked}
              />
            ) : (
              <div className="grid gap-2">
                {options.map((t) => {
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
        {open ? (
          <X className="size-4" aria-hidden />
        ) : launcher === 'Book an appointment' ? (
          <CalendarDays className="size-4" aria-hidden />
        ) : (
          <PhoneCall className="size-4" aria-hidden />
        )}
        {open ? 'Close' : launcher}
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

/** The next seven days as YYYY-MM-DD, in the visitor's own calendar. */
function nextDays(n = 7): { iso: string; day: string; date: string }[] {
  const out = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
    const iso = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
    out.push({
      iso,
      day: i === 0 ? 'Today' : x.toLocaleDateString(undefined, { weekday: 'short' }),
      date: x.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
    });
  }
  return out;
}

/**
 * Day, then time, then who — and the slot list comes from the centre's own
 * calendar, so a visitor can only pick something genuinely free. A slot taken
 * between loading and booking comes back as the server's own sentence.
 */
function BookForm({ slug, centreNumber }: { slug: string; centreNumber?: string | null }) {
  const days = nextDays();
  const [date, setDate] = useState(days[0]!.iso);
  const [slots, setSlots] = useState<AvailabilityOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const [country, setCountry] = useState(
    () => countryForE164(centreNumber)?.code ?? DEFAULT_DIALLING_COUNTRY,
  );
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [reply, setReply] = useState('');

  useEffect(() => {
    let live = true;
    setLoading(true);
    setStartsAt(null);
    fetch(`${API}/api/public/sites/${encodeURIComponent(slug)}/availability?date=${date}`)
      .then((r) => (r.ok ? (r.json() as Promise<AvailabilityOutput>) : null))
      .then((r) => live && setSlots(r))
      .catch(() => live && setSlots(null))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [slug, date]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!startsAt) return;
    setState('sending');
    try {
      const res = await fetch(`${API}/api/public/sites/${encodeURIComponent(slug)}/bookings`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, phone, country, startsAt }),
      });
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setState('error');
        setReply(body.message ?? 'We could not book that time. Please pick another.');
        return;
      }
      setState('done');
      setReply(body.message ?? 'You are booked — see you then.');
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
    <form onSubmit={submit} className="grid gap-2.5">
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {days.map((d) => (
          <button
            key={d.iso}
            type="button"
            onClick={() => setDate(d.iso)}
            aria-pressed={date === d.iso}
            className={cn(
              'flex shrink-0 flex-col items-center rounded-lg border px-2.5 py-1.5 text-xs transition',
              date === d.iso
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:border-primary/50',
            )}
          >
            <span className="font-semibold">{d.day}</span>
            <span className={date === d.iso ? 'opacity-90' : 'text-muted-foreground'}>{d.date}</span>
          </button>
        ))}
      </div>

      <div className="min-h-16">
        {loading ? (
          <p className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden /> Finding free times…
          </p>
        ) : !slots || slots.slots.length === 0 ? (
          <p className="py-3 text-xs text-muted-foreground">Nothing free that day — try another.</p>
        ) : (
          <>
            <div className="grid max-h-36 grid-cols-4 gap-1.5 overflow-y-auto">
              {slots.slots.map((s) => (
                <button
                  key={s.startsAt}
                  type="button"
                  onClick={() => setStartsAt(s.startsAt)}
                  aria-pressed={startsAt === s.startsAt}
                  className={cn(
                    'tnum rounded-md border py-1.5 text-xs transition',
                    startsAt === s.startsAt
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/50',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Times in {slots.timezone}</p>
          </>
        )}
      </div>

      {startsAt && (
        <>
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
              placeholder={countryByCode(country).example}
              aria-label="Phone number"
              className={field}
            />
          </div>
          <button
            type="submit"
            disabled={state === 'sending'}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-70"
          >
            {state === 'sending' ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <CalendarDays className="size-4" aria-hidden />
            )}
            {state === 'sending' ? 'Booking…' : 'Book this time'}
          </button>
        </>
      )}
      {state === 'error' && <p className="text-xs text-destructive">{reply}</p>}
    </form>
  );
}
