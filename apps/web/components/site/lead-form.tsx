'use client';

import { useState } from 'react';
import { Check, Loader2, PhoneCall } from 'lucide-react';
import {
  DEFAULT_DIALLING_COUNTRY,
  DIALLING_COUNTRIES,
  composeE164,
  countryByCode,
  countryForE164,
} from '@superdemo/contracts';
import { cn } from '@/lib/utils';

/**
 * The callback form.
 *
 * This is the only interactive thing on a landing page, and the only reason the
 * page is worth serving from a contact-centre platform at all: the number typed
 * here becomes a contact in that centre, and — if they nominated a running
 * campaign — a target the dialler rings. Everything else on the page exists to
 * get someone to fill it in.
 *
 * It posts directly to the public API rather than through `lib/api`, which
 * carries an access token and a refresh-on-401 dance that a stranger's browser
 * has no business performing.
 */

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3101';

export function LeadForm({
  slug,
  source,
  note,
  /** The centre's own number, used only to guess a sensible default country. */
  centreNumber,
  className,
  onHero = false,
  darkSurface = false,
}: {
  slug: string;
  source: 'hero' | 'contact';
  note?: string;
  centreNumber?: string | null;
  className?: string;
  /** True when the form is rendered inside the hero band. */
  onHero?: boolean;
  /**
   * Whether that band is a dark surface.
   *
   * Passed as a boolean rather than read from a token because of one thing a CSS
   * variable cannot reach: a native `<select>`'s popup is drawn by the OS, and
   * `color-scheme` is the only way to stop it being white-on-white. Every other
   * colour below comes from `--site-hero-*`.
   */
  darkSurface?: boolean;
}) {
  // A UAE clinic's visitors are overwhelmingly in the UAE, so the centre's own
  // dial code is a better default than a global one.
  const [country, setCountry] = useState(
    () => countryForE164(centreNumber)?.code ?? DEFAULT_DIALLING_COUNTRY,
  );
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
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
        body: JSON.stringify({ name, phone, country, email, message, source, company: honeypot }),
      });
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setState('error');
        setReply(body.message ?? 'We could not take that just now. Please try calling us.');
        return;
      }
      setState('done');
      setReply(body.message ?? 'Thank you — we will call you back.');
    } catch {
      setState('error');
      setReply('We could not reach the server. Please try calling us instead.');
    }
  }

  if (state === 'done') {
    return (
      <div
        className={cn(
          'flex items-start gap-3 rounded-2xl border p-6',
          onHero
            ? 'border-(--site-hero-line) bg-(--site-hero-card) text-(--site-hero-fg)'
            : 'border-live/30 bg-live-soft',
          className,
        )}
      >
        <span
          className={cn(
            'mt-0.5 grid size-8 shrink-0 place-items-center rounded-full',
            onHero ? 'bg-(--site-hero-btn-bg) text-(--site-hero-btn-fg)' : 'bg-live text-white',
          )}
        >
          <Check className="size-4" aria-hidden />
        </span>
        <div>
          <p className={cn('text-sm font-semibold', onHero ? 'text-(--site-hero-fg)' : 'text-live')}>
            Request received
          </p>
          <p className={cn('mt-1 text-sm', onHero ? 'text-(--site-hero-dim)' : 'text-foreground/80')}>
            {reply}
          </p>
        </div>
      </div>
    );
  }

  const field = cn(
    'h-11 w-full rounded-xl border px-3.5 text-[15px] outline-none transition',
    'focus-visible:ring-[3px]',
    onHero
      ? 'border-(--site-hero-line) bg-(--site-hero-card) text-(--site-hero-fg) placeholder:text-(--site-hero-dim) focus-visible:border-(--site-hero-fg)/50 focus-visible:ring-(--site-hero-fg)/20'
      : 'border-input bg-background focus-visible:border-ring focus-visible:ring-ring/40',
  );

  return (
    <form onSubmit={submit} className={cn('space-y-3', className)} noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="sr-only">Your name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            className={field}
          />
        </label>
        <label className="block">
          <span className="sr-only">Email (optional)</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (optional)"
            autoComplete="email"
            className={field}
          />
        </label>
      </div>

      {/* Country and number as one control, because they are one number. */}
      <div
        className={cn(
          'flex items-stretch gap-2 rounded-xl border pr-2 focus-within:ring-[3px]',
          onHero
            ? 'border-(--site-hero-line) bg-(--site-hero-card) focus-within:border-(--site-hero-fg)/50 focus-within:ring-(--site-hero-fg)/20'
            : 'border-input bg-background focus-within:border-ring focus-within:ring-ring/40',
        )}
      >
        <label className="relative">
          <span className="sr-only">Country</span>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={cn(
              'h-11 appearance-none rounded-l-xl border-0 bg-transparent pl-3.5 pr-2 text-[15px] outline-none',
              onHero ? 'text-(--site-hero-fg)' : 'text-foreground',
            )}
            // The popup is drawn by the OS and ignores our tokens, so this is the
            // one place the surface's lightness has to be stated outright.
            style={darkSurface ? { colorScheme: 'dark' } : undefined}
          >
            {DIALLING_COUNTRIES.map((c) => (
              <option key={`${c.code}-${c.dial}`} value={c.code}>
                {c.flag} +{c.dial}
              </option>
            ))}
          </select>
        </label>
        <span
          className={cn('my-2 w-px', onHero ? 'bg-(--site-hero-line)' : 'bg-border')}
          aria-hidden
        />
        <label className="min-w-0 flex-1">
          <span className="sr-only">Phone number</span>
          <input
            required
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={chosen.example}
            className={cn(
              'tnum h-11 w-full border-0 bg-transparent text-[15px] outline-none',
              onHero
                ? 'text-(--site-hero-fg) placeholder:text-(--site-hero-dim)'
                : 'placeholder:text-muted-foreground',
            )}
          />
        </label>
      </div>

      {/* What we will actually dial. Shown because a trunk zero silently
          disappearing is alarming if you do not know that is correct. */}
      {composed && (
        <p className={cn('tnum text-xs', onHero ? 'text-(--site-hero-dim)' : 'text-muted-foreground')}>
          We will call {composed}
        </p>
      )}

      <label className="block">
        <span className="sr-only">What can we help with?</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="What can we help with? (optional)"
          className={cn(field, 'h-auto resize-y py-2.5')}
        />
      </label>

      {/*
        Honeypot. Off-screen rather than display:none — some bots skip hidden
        fields but fill anything focusable. A screen reader is told to ignore it,
        and tabIndex -1 keeps it out of keyboard order.
      */}
      <div className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden>
        <label>
          Company
          <input
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={state === 'sending'}
        className={cn(
          'inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold transition',
          'disabled:opacity-70',
          onHero
            ? 'bg-(--site-hero-btn-bg) text-(--site-hero-btn-fg) hover:opacity-90'
            : 'bg-primary text-primary-foreground hover:opacity-90',
        )}
      >
        {state === 'sending' ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <PhoneCall className="size-4" aria-hidden />
        )}
        {state === 'sending' ? 'Sending…' : 'Request a callback'}
      </button>

      {state === 'error' && (
        <p className={cn('text-xs', onHero ? 'text-(--site-hero-fg)' : 'text-destructive')}>{reply}</p>
      )}

      {note && (
        <p
          className={cn(
            'text-xs leading-relaxed',
            onHero ? 'text-(--site-hero-dim)' : 'text-muted-foreground',
          )}
        >
          {note}
        </p>
      )}
    </form>
  );
}
