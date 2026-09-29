'use client';

import { useState, type FormEvent } from 'react';
import { useContent } from '../context';

export function ContactForm() {
  const { CONTACT } = useContent();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const subject = encodeURIComponent(`Reservation request from ${name || 'the Tavola site'}`);
    const bodyLines = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      guests ? `Guests: ${guests}` : null,
      date ? `Date: ${date}` : null,
      time ? `Time: ${time}` : null,
    ].filter(Boolean);
    const body = encodeURIComponent(bodyLines.join('\n'));

    window.location.href = `mailto:${CONTACT.email}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  const fieldClass =
    'w-full border border-tavola-muted/20 bg-transparent px-4 py-3 text-sm text-tavola-text placeholder:text-tavola-muted/50 outline-none focus:border-tavola-gold';
  const labelClass =
    'mb-1.5 block text-xs font-medium tracking-[0.08em] text-tavola-muted uppercase';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="tavola-name" className={labelClass}>
          {CONTACT.fields.name}
        </label>
        <input
          id="tavola-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
          className={fieldClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="tavola-email" className={labelClass}>
            {CONTACT.fields.email}
          </label>
          <input
            id="tavola-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="tavola-phone" className={labelClass}>
            {CONTACT.fields.phone}
          </label>
          <input
            id="tavola-phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={CONTACT.fields.phonePlaceholder}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="tavola-guests" className={labelClass}>
            {CONTACT.fields.guests}
          </label>
          <input
            id="tavola-guests"
            type="number"
            required
            min={1}
            max={10}
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            placeholder={CONTACT.fields.guestsPlaceholder}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="tavola-date" className={labelClass}>
            {CONTACT.fields.date}
          </label>
          <input
            id="tavola-date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="tavola-time" className={labelClass}>
            {CONTACT.fields.time}
          </label>
          <input
            id="tavola-time"
            type="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      <button
        type="submit"
        className="tavola-btn mt-2 inline-flex items-center justify-center bg-tavola-gold px-7 py-3.5 text-xs font-semibold tracking-[0.1em] text-tavola-ink uppercase transition-transform hover:scale-[1.02]"
      >
        {CONTACT.fields.submit}
      </button>

      {sent && (
        <p className="text-center text-sm text-tavola-muted">
          Thanks — check your email client to send your request.
        </p>
      )}
    </form>
  );
}
