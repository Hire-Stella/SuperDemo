'use client';

import { useState, type FormEvent } from 'react';
import { useContent } from '../context';

/**
 * The source's own "Write Us a Message" form: Name, Email, Phone, Message —
 * a plain enquiry form, not tavola's reservation form with a guest count
 * and a time slot. Literal field labels and placeholders.
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

    const subject = encodeURIComponent(`Message from ${name || 'the Forno site'}`);
    const bodyLines = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      '',
      message,
    ];
    const body = encodeURIComponent(bodyLines.join('\n'));

    window.location.href = `mailto:${CONTACT.email}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  const fieldClass =
    'forno-card w-full border border-forno-border bg-forno-bg px-4 py-3 text-sm text-forno-ink placeholder:text-forno-muted/70 outline-none focus:border-forno-red';
  const labelClass = 'mb-1.5 block text-xs font-semibold tracking-[0.06em] text-forno-muted uppercase';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="forno-name" className={labelClass}>
          {CONTACT.fields.name}
        </label>
        <input
          id="forno-name"
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
          <label htmlFor="forno-email" className={labelClass}>
            {CONTACT.fields.email}
          </label>
          <input
            id="forno-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={CONTACT.fields.emailPlaceholder}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="forno-phone" className={labelClass}>
            {CONTACT.fields.phone}
          </label>
          <input
            id="forno-phone"
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
        <label htmlFor="forno-message" className={labelClass}>
          {CONTACT.fields.message}
        </label>
        <textarea
          id="forno-message"
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
        className="forno-pill mt-2 inline-flex items-center justify-center bg-forno-red px-7 py-3.5 text-xs font-bold tracking-[0.08em] text-white uppercase transition-transform hover:scale-[1.03]"
      >
        {CONTACT.fields.submit}
      </button>

      {sent && (
        <p className="text-center text-sm text-forno-muted">
          Thanks — check your email client to send your message.
        </p>
      )}
    </form>
  );
}
