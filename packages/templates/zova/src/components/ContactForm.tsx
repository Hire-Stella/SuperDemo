"use client";

import { useState, type FormEvent } from "react";

// The live site's contact form has no real backend behind it. This clone
// does client-side validation (via the native `required`/`type="email"`
// constraints) and shows a "Message sent" confirmation state on submit —
// no email is actually sent anywhere.
export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  if (sent) {
    return (
      <div className="zv-fade rounded-2xl border border-zv-line bg-zv-card px-6 py-10 text-center">
        <p className="zv-heading text-xl text-zv-ink">Message sent</p>
        <p className="mt-2 text-sm text-zv-muted">
          Thanks, {name || "there"} — we&rsquo;ll get back to you within 2 business days.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setName("");
            setEmail("");
            setTopic("");
            setMessage("");
          }}
          className="zv-btn-outline mt-6 inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-zv-ink">
          Name
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-xl border border-zv-line bg-white px-4 py-3 text-sm outline-none focus:border-zv-ink"
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zv-ink">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="w-full rounded-xl border border-zv-line bg-white px-4 py-3 text-sm outline-none focus:border-zv-ink"
        />
      </div>

      <div>
        <label htmlFor="topic" className="mb-1.5 block text-sm font-medium text-zv-ink">
          Topic
        </label>
        <select
          id="topic"
          required
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full rounded-xl border border-zv-line bg-white px-4 py-3 text-sm outline-none focus:border-zv-ink"
        >
          <option value="" disabled>
            Select a topic
          </option>
          <option value="Product">Product</option>
          <option value="Support">Support</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-zv-ink">
          Message
        </label>
        <textarea
          id="message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help?"
          className="w-full resize-none rounded-xl border border-zv-line bg-white px-4 py-3 text-sm outline-none focus:border-zv-ink"
        />
      </div>

      <button
        type="submit"
        className="zv-btn-primary mt-2 inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold transition-transform hover:scale-[1.02]"
      >
        Submit
      </button>
    </form>
  );
}
