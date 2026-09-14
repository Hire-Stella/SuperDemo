"use client";

import { useState, type FormEvent } from "react";

import { contactEmail } from "../defaults";
import { IconArrowUpRight } from "./icons";
import { useContent } from "../context";

export function NewsletterForm() {
  const { contactEmail } = useContent();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject = encodeURIComponent("Newsletter signup");
    const body = encodeURIComponent(`Please add ${email} to the Vectora newsletter list.`);
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <label htmlFor="newsletter-email" className="sr-only">
        Your email
      </label>
      <div className="flex items-center gap-2 border-b border-white/30 pb-2">
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your Email"
          className="w-full bg-transparent text-sm font-medium text-white placeholder:text-white/60 outline-none"
        />
        <button
          type="submit"
          aria-label="Sign up"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white transition-transform hover:translate-x-0.5"
        >
          <IconArrowUpRight className="h-4 w-4" />
        </button>
      </div>
      {sent && <p className="rs-fade mt-2 text-xs text-white/80">Thanks — check your email client to send it.</p>}
    </form>
  );
}
