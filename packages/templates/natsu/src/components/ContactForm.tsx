'use client';

import { useState, type FormEvent } from 'react';
import { useContent } from '../context';

/**
 * A plain, stacked-label enquiry form — the source's real contact page has
 * exactly three fields (Name, Email, Message) and a submit button, no
 * reservation-style date/guest slots (that treatment belongs to a
 * restaurant's own booking form, not a café's contact page).
 */
export function ContactForm() {
  const { CONTACT } = useContent();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const subject = encodeURIComponent(`Message from ${name || 'the Natsu site'}`);
    const bodyLines = [`Name: ${name}`, `Email: ${email}`, '', message];
    const body = encodeURIComponent(bodyLines.join('\n'));

    window.location.href = `mailto:${CONTACT.email}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  const field =
    'natsu-soft w-full border border-natsu-ink/15 bg-natsu-surface px-4 py-3 text-sm text-natsu-ink placeholder:text-natsu-muted/60 outline-none focus:border-natsu-caramel';
  const label = 'text-xs font-semibold tracking-[0.1em] text-natsu-ink uppercase';

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5">
      <label className="flex flex-col gap-2">
        <span className={label}>Name</span>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={CONTACT.fields.namePlaceholder}
          className={field}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className={label}>Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={CONTACT.fields.emailPlaceholder}
          className={field}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className={label}>Message</span>
        <textarea
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={CONTACT.fields.messagePlaceholder}
          className={field}
        />
      </label>

      <button
        type="submit"
        className="natsu-pill mt-1 inline-flex items-center justify-center self-start bg-natsu-caramel px-8 py-3.5 text-xs font-semibold tracking-[0.08em] text-natsu-bg uppercase transition-transform hover:scale-[1.02]"
      >
        {CONTACT.fields.submit}
      </button>

      {sent && (
        <p className="text-sm text-natsu-muted">
          Thanks — check your email client to send your message.
        </p>
      )}
    </form>
  );
}
