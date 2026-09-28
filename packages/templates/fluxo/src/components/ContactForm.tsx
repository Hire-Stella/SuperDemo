'use client';

import { useState, type FormEvent } from 'react';
import { useContent } from '../context';

/**
 * A minimal name+email capture, in the same two-field register as the
 * source's own checkout-card mockup rather than a longer invented form —
 * the source's own "Get started" CTA links to a `/contact` route this
 * scrape never rendered, so the fields themselves are this port's own
 * design (see defaults.ts's own `CONTACT` note).
 */
export function ContactForm() {
  const { CONTACT } = useContent();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const subject = encodeURIComponent(`Get started — ${name || 'new signup'}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}`);

    window.location.href = `mailto:${CONTACT.email}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  const fieldClass =
    'w-full rounded-xl border border-fluxo-border bg-white px-4 py-3 text-sm text-fluxo-ink placeholder:text-fluxo-faint outline-none focus:border-fluxo-primary';
  const labelClass = 'mb-1.5 block text-xs font-medium text-fluxo-muted';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="fluxo-name" className={labelClass}>
          {CONTACT.fields.name}
        </label>
        <input
          id="fluxo-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jordan Avery"
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="fluxo-email" className={labelClass}>
          {CONTACT.fields.email}
        </label>
        <input
          id="fluxo-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className={fieldClass}
        />
      </div>

      <button
        type="submit"
        className="fluxo-pill mt-1 inline-flex items-center justify-center bg-fluxo-primary px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-fluxo-primary-hover"
      >
        {CONTACT.fields.submit}
      </button>

      {sent && (
        <p className="text-center text-xs text-fluxo-muted">
          Thanks — check your email client to send it along.
        </p>
      )}
    </form>
  );
}
