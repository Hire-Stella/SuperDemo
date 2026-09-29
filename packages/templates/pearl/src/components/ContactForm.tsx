'use client';

import { useState, type FormEvent } from 'react';
import { useContent } from '../context';

/**
 * A plain, stacked-label order-ahead form — a pickup time in place of
 * yokai's date-and-time reservation pair, since a boba counter takes a
 * same-day pickup slot, not a seating reservation.
 */
export function ContactForm() {
  const { CONTACT } = useContent();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pickup, setPickup] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const subject = encodeURIComponent(`Order from ${name || 'the Pearl site'}`);
    const bodyLines = [`Name: ${name}`, `Pickup time: ${pickup}`, `Email: ${email}`, '', message];
    const body = encodeURIComponent(bodyLines.join('\n'));

    window.location.href = `mailto:${CONTACT.email}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  const field =
    'pearl-cup w-full border border-pearl-border bg-pearl-surface px-4 py-3 text-sm text-pearl-ink placeholder:text-pearl-muted/60 outline-none focus:border-pearl-taro';
  const label = 'text-xs font-bold tracking-[0.08em] text-pearl-ink uppercase';

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
        <span className={label}>Pickup Time</span>
        <input
          type="text"
          required
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
          placeholder={CONTACT.fields.pickupPlaceholder}
          className={field}
        />
      </label>

      <label className="flex flex-col gap-2 sm:col-span-2">
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

      <label className="flex flex-col gap-2 sm:col-span-2">
        <span className={label}>Order</span>
        <textarea
          required
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={CONTACT.fields.messagePlaceholder}
          className={field}
        />
      </label>

      <button
        type="submit"
        className="pearl-pill mt-1 inline-flex items-center justify-center self-start bg-pearl-taro px-8 py-3.5 text-xs font-bold tracking-[0.08em] text-white uppercase transition-transform hover:scale-[1.03] sm:col-span-2"
      >
        {CONTACT.fields.submit}
      </button>

      {sent && (
        <p className="text-sm text-pearl-muted sm:col-span-2">
          Thanks — check your email client to send your order.
        </p>
      )}
    </form>
  );
}
