"use client";

import { useState, type FormEvent } from "react";

import { contactEmail, officeLocations } from "../defaults";
import { useContent } from "../context";

export function ContactForm() {
  const { contactEmail, officeLocations } = useContent();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [office, setOffice] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const subject = encodeURIComponent(`New enquiry from ${name || "the Vectora site"}`);
    const bodyLines = [
      `Name: ${name}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : null,
      office ? `Preferred office: ${office}` : null,
      "",
      message,
    ].filter(Boolean);
    const body = encodeURIComponent(bodyLines.join("\n"));

    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-rs-ink">
          Your name
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-xl border border-black/10 bg-rs-bg px-4 py-3 text-sm outline-none focus:border-rs-brand-dark"
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-rs-ink">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="w-full rounded-xl border border-black/10 bg-rs-bg px-4 py-3 text-sm outline-none focus:border-rs-brand-dark"
        />
      </div>

      <div>
        <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-rs-ink">
          Phone (optional) – we call you back
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone (optional) - we call you back"
          className="w-full rounded-xl border border-black/10 bg-rs-bg px-4 py-3 text-sm outline-none focus:border-rs-brand-dark"
        />
      </div>

      <div>
        <label htmlFor="office" className="mb-1.5 block text-sm font-medium text-rs-ink">
          Preferred office location
        </label>
        <select
          id="office"
          value={office}
          onChange={(e) => setOffice(e.target.value)}
          className="w-full rounded-xl border border-black/10 bg-rs-bg px-4 py-3 text-sm outline-none focus:border-rs-brand-dark"
        >
          <option value="">Preferred office location</option>
          {officeLocations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-rs-ink">
          How can we help?
        </label>
        <textarea
          id="message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help?"
          className="w-full resize-none rounded-xl border border-black/10 bg-rs-bg px-4 py-3 text-sm outline-none focus:border-rs-brand-dark"
        />
      </div>

      <button
        type="submit"
        className="rs-gradient-brand mt-2 inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
      >
        Submit
      </button>

      {sent && (
        <p className="rs-fade text-center text-sm text-rs-muted">
          Thanks! Your email client should have opened with your message ready to send.
        </p>
      )}
    </form>
  );
}
