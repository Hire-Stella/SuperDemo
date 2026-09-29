'use client';

import { useState, type FormEvent } from 'react';
import { useContent } from '../context';

/**
 * The source's real enquiry form lives on its separate `/contact` route, out
 * of scope for this port (see defaults.ts's `CONTACT` note — only the home
 * page was fetched). A plain Name/Email/Phone/Message form in the source's
 * own field-label convention, the same shape forno's and tavola's own
 * `ContactForm` give their sources' equivalent forms.
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

    const subject = encodeURIComponent(`Order enquiry from ${name || 'the Sucre site'}`);
    const bodyLines = [`Name: ${name}`, `Email: ${email}`, `Phone: ${phone}`, '', message];
    const body = encodeURIComponent(bodyLines.join('\n'));

    window.location.href = `mailto:${CONTACT.email}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  const fieldClass =
    'sucre-card w-full border border-sucre-border/60 bg-sucre-bg px-4 py-3 text-sm text-sucre-ink placeholder:text-sucre-muted/60 outline-none focus:border-sucre-pink';
  const labelClass =
    'mb-1.5 block text-xs font-semibold tracking-[0.08em] text-sucre-rose uppercase';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="sucre-name" className={labelClass}>
          {CONTACT.fields.name}
        </label>
        <input
          id="sucre-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={CONTACT.fields.namePlaceholder}
          className={fieldClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="sucre-email" className={labelClass}>
            {CONTACT.fields.email}
          </label>
          <input
            id="sucre-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={CONTACT.fields.emailPlaceholder}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="sucre-phone" className={labelClass}>
            {CONTACT.fields.phone}
          </label>
          <input
            id="sucre-phone"
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
        <label htmlFor="sucre-message" className={labelClass}>
          {CONTACT.fields.message}
        </label>
        <textarea
          id="sucre-message"
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
        className="sucre-pill mt-2 inline-flex items-center justify-center bg-sucre-pink px-7 py-3.5 text-xs font-bold tracking-[0.08em] text-sucre-bg uppercase transition-colors hover:bg-sucre-pink-soft"
      >
        {CONTACT.fields.submit}
      </button>

      {sent && (
        <p className="text-sm text-sucre-muted">
          Thanks — check your email client to send your message.
        </p>
      )}
    </form>
  );
}
