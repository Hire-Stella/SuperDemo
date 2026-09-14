"use client";

import { useState } from "react";
import CtaArrowBadge from "../components/CtaArrowBadge";

/** Mini-newsletter block in the footer -- cosmetic placeholder, no backend. */
export default function SubscribeChannel() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setEmail("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input
        type="email"
        required
        placeholder="Mail Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
      />
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1c1305] transition-transform hover:scale-105"
      >
        Send Now
        <CtaArrowBadge />
      </button>
      {submitted && <p className="text-xs text-white/60">Thanks for subscribing!</p>}
    </form>
  );
}
