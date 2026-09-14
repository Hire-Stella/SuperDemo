"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  if (subscribed) {
    return (
      <p className="mt-6 text-sm font-semibold text-brand-periwinkle">Thanks for subscribing!</p>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setSubscribed(true);
      }}
      className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Enter your email address"
        className="w-full rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none"
      />
      <button
        type="submit"
        className="shrink-0 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black"
      >
        Join us today
      </button>
    </form>
  );
}
