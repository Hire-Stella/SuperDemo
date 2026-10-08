'use client';

import { useState, type FormEvent } from 'react';
import { useContent } from '../context';

/**
 * The source's home-page reservation band is not a plain labelled form — it
 * is one flowing sentence with inline blanks: "Hello Restaura, my name is
 * ___. I would like to reserve a table for ___ on ___ & ___. Here's my
 * brief: ___. Please confirm my reservation at ___ or at ___." — recovered
 * verbatim from the page's own text nodes. Kept as odd and specific as the
 * source made it, rather than flattened into tavola's or forno's plain
 * stacked-label form.
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

    const subject = encodeURIComponent(`Reservation request from ${name || 'the Aurelia site'}`);
    const bodyLines = [
      `Name: ${name}`,
      `Guests: ${guests}`,
      `Date: ${date}`,
      `Time: ${time}`,
      message ? `Brief: ${message}` : null,
      `Email: ${email}`,
      `Phone: ${phone}`,
    ].filter(Boolean);
    const body = encodeURIComponent(bodyLines.join('\n'));

    window.location.href = `mailto:${CONTACT.email}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  const blank =
    'inline-block border-0 border-b-2 border-aurelia-plum/30 bg-transparent px-1 text-aurelia-ink placeholder:text-aurelia-muted/50 outline-none focus:border-aurelia-gold';
  const s = CONTACT.sentence;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <p className="font-aurelia-display flex flex-wrap items-baseline gap-x-2 gap-y-3 text-2xl leading-relaxed text-aurelia-ink sm:text-3xl">
        <span>{s.hello}</span>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={CONTACT.fields.namePlaceholder}
          className={`${blank} w-48`}
          aria-label={s.hello}
        />
        <span>.</span>
      </p>

      <p className="font-aurelia-display flex flex-wrap items-baseline gap-x-2 gap-y-3 text-2xl leading-relaxed text-aurelia-ink sm:text-3xl">
        <span>{s.reserve}</span>
        <input
          type="number"
          min={1}
          max={20}
          required
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          placeholder={CONTACT.fields.guestsPlaceholder}
          className={`${blank} w-14 text-center`}
          aria-label="Number of guests"
        />
        <span>{s.guestsUnit}</span>
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={`${blank} w-40`}
          aria-label="Date"
        />
        <span>{s.and}</span>
        <input
          type="time"
          required
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className={`${blank} w-32`}
          aria-label="Time"
        />
        <span>.</span>
      </p>

      <p className="font-aurelia-display flex flex-wrap items-baseline gap-x-2 gap-y-3 text-2xl leading-relaxed text-aurelia-ink sm:text-3xl">
        <span>{s.brief}</span>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={CONTACT.fields.messagePlaceholder}
          className={`${blank} min-w-0 flex-1`}
          aria-label={s.brief}
        />
      </p>

      <p className="font-aurelia-display flex flex-wrap items-baseline gap-x-2 gap-y-3 text-2xl leading-relaxed text-aurelia-ink sm:text-3xl">
        <span>{s.confirm}</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={CONTACT.fields.emailPlaceholder}
          className={`${blank} w-56`}
          aria-label="Email address"
        />
        <span>{s.or}</span>
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={CONTACT.fields.phonePlaceholder}
          className={`${blank} w-44`}
          aria-label="Phone number"
        />
        <span>.</span>
      </p>

      <button
        type="submit"
        className="aurelia-pill mt-2 inline-flex items-center justify-center self-start bg-aurelia-gold px-7 py-3.5 text-xs font-bold tracking-[0.08em] text-aurelia-ink uppercase transition-transform hover:scale-[1.03]"
      >
        {CONTACT.fields.submit}
      </button>

      {sent && (
        <p className="text-sm text-aurelia-muted">
          Thanks — check your email client to send your reservation request.
        </p>
      )}
    </form>
  );
}
