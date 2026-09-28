'use client';

import { useState, type FormEvent } from 'react';
import { useContent } from '../context';

/**
 * A plain, stacked-label reservation form — Yokai holds only a handful of
 * stools by request (see defaults.ts's CONTACT copy), so this asks for a
 * party size and a time rather than pretending to manage a full seating
 * chart.
 */
export function ContactForm() {
  const { CONTACT } = useContent();
  const [name, setName] = useState('');
  const [guests, setGuests] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const subject = encodeURIComponent(`Stool request from ${name || 'the Yokai site'}`);
    const bodyLines = [
      `Name: ${name}`,
      `Guests: ${guests}`,
      `Date: ${date}`,
      `Time: ${time}`,
      message ? `Note: ${message}` : null,
      `Email: ${email}`,
      `Phone: ${phone}`,
    ].filter(Boolean);
    const body = encodeURIComponent(bodyLines.join('\n'));

    window.location.href = `mailto:${CONTACT.email}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  const field =
    'yokai-frame w-full border-2 border-yokai-border bg-yokai-ink px-4 py-3 text-sm text-yokai-text placeholder:text-yokai-muted/60 outline-none focus:border-yokai-lantern';
  const label = 'text-xs font-semibold tracking-[0.1em] text-yokai-muted uppercase';

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
        <span className={label}>Guests</span>
        <input
          type="number"
          min={1}
          max={12}
          required
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          placeholder={CONTACT.fields.guestsPlaceholder}
          className={field}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className={label}>Date</span>
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={field}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className={label}>Time</span>
        <input
          type="time"
          required
          value={time}
          onChange={(e) => setTime(e.target.value)}
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
        <span className={label}>Phone</span>
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={CONTACT.fields.phonePlaceholder}
          className={field}
        />
      </label>

      <label className="flex flex-col gap-2 sm:col-span-2">
        <span className={label}>Note</span>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={CONTACT.fields.messagePlaceholder}
          className={field}
        />
      </label>

      <button
        type="submit"
        className="yokai-btn mt-1 inline-flex items-center justify-center self-start bg-yokai-lantern px-8 py-3.5 text-xs font-bold tracking-[0.08em] text-yokai-ink uppercase transition-transform hover:scale-[1.02] sm:col-span-2"
      >
        {CONTACT.fields.submit}
      </button>

      {sent && (
        <p className="text-sm text-yokai-muted sm:col-span-2">
          Thanks — check your email client to send your stool request.
        </p>
      )}
    </form>
  );
}
