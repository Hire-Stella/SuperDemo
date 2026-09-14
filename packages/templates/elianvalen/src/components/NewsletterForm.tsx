"use client";

import { useState } from "react";

import { newsletter } from "../defaults";
import { SquiggleArrow } from "./icons";
import { useContent } from "../context";

/** Client-side only — validates and acknowledges, no backend. */
export function NewsletterForm() {
  const { newsletter } = useContent();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "error" | "done">("idle");

  return (
    <form
      className="w-full max-w-md"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
          setState("error");
          return;
        }
        setState("done");
        setEmail("");
      }}
    >
      <div className="flex items-center gap-2 border border-line-dark px-3">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          placeholder={newsletter.placeholder}
          onChange={(e) => {
            setEmail(e.target.value);
            setState("idle");
          }}
          className="h-10 flex-1 bg-transparent text-[13px] text-white placeholder:text-white/40 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Subscribe"
          className="flex h-10 w-8 items-center justify-center text-white/50 transition-colors hover:text-white"
        >
          <SquiggleArrow size={14} />
        </button>
      </div>
      <p
        aria-live="polite"
        className="mt-2 min-h-[16px] text-[11px] text-white/50"
      >
        {state === "error" && "Please enter a valid email address."}
        {state === "done" && newsletter.success}
      </p>
    </form>
  );
}
