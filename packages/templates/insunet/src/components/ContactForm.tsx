'use client';

import { useState, type FormEvent } from 'react';
import { useContent } from '../context';

/**
 * A plain Name/Email/Phone/Message quote request, in the source's own
 * `/contact` route field order and `type` attributes (`text`, `email`,
 * `tel`, a `textarea`) — confirmed against that route's own SSR HTML. The
 * source's real form posts to Framer's own hosted forms backend, which this
 * static port has no equivalent for, so submission opens the visitor's
 * email client instead, the same `mailto:` stand-in every sibling
 * template's own `ContactForm` uses for its source's real, unavailable
 * backend.
 */
export function ContactForm() {
  const { CONTACT } = useContent();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const subject = encodeURIComponent(`Quote request from ${name || 'the Insunet site'}`);
    const bodyLines = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      '',
      message || '(no message)',
    ];
    const body = encodeURIComponent(bodyLines.join('\n'));

    window.location.href = `mailto:${CONTACT.email}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  const fieldClass =
    'w-full rounded-xl border border-insunet-border bg-white px-4 py-3 text-sm text-insunet-ink placeholder:text-insunet-muted/60 outline-none focus:border-insunet-primary';
  const labelClass = 'mb-1.5 block text-xs font-semibold tracking-[0.06em] text-insunet-muted';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="insunet-name" className={labelClass}>
          {CONTACT.fields.name}
        </label>
        <input
          id="insunet-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={CONTACT.fields.namePlaceholder}
          className={fieldClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="insunet-email" className={labelClass}>
            {CONTACT.fields.email}
          </label>
          <input
            id="insunet-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={CONTACT.fields.emailPlaceholder}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="insunet-phone" className={labelClass}>
            {CONTACT.fields.phone}
          </label>
          <input
            id="insunet-phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={CONTACT.fields.phonePlaceholder}
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="insunet-message" className={labelClass}>
          {CONTACT.fields.message}
        </label>
        <textarea
          id="insunet-message"
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={CONTACT.fields.messagePlaceholder}
          className={fieldClass}
        />
      </div>

      <button
        type="submit"
        className="insunet-pill mt-2 inline-flex items-center justify-center bg-insunet-accent px-7 py-3.5 text-sm font-semibold text-insunet-accent-ink transition-colors hover:bg-insunet-accent/85"
      >
        {CONTACT.fields.submit}
      </button>

      {sent && (
        <p className="text-center text-sm text-insunet-muted">
          Thanks — check your email client to send your request.
        </p>
      )}
    </form>
  );
}
