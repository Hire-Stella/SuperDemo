"use client";

import { useState } from "react";
import Image from "next/image";
import Reveal from "../components/Reveal";
import WordsReveal from "../components/WordsReveal";
import CtaArrowBadge from "../components/CtaArrowBadge";

/**
 * "Let's Keep the Journey Going" newsletter block, appears on every page.
 * Cosmetic-only placeholder submit -- no backend wired up (see NOTES.md).
 */
export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setEmail("");
  }

  return (
    <section className="relative overflow-hidden bg-[var(--fg)] px-5 py-20 text-white md:px-10">
      {/* decorative-shape-2.png: a thin-line sailboat illustration -- used
          here as a faint nautical/travel-themed background flourish. */}
      <Image
        src="/t/tripvanta/images/decorative-shape-2.png"
        alt=""
        width={220}
        height={220}
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 -left-10 hidden opacity-10 md:block"
      />
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-display text-3xl leading-tight md:text-5xl">
          <WordsReveal text="Let's Keep the Journey Going" />
        </h2>
        <Reveal y={20} scale={1} delay={0.1}>
          <p className="mx-auto mt-5 max-w-xl text-white/70">
            Join thousands of explorers who receive handpicked travel inspiration, exclusive
            destination tips, and smart planning tools straight to their inbox.
          </p>
        </Reveal>
        <Reveal y={20} scale={1} delay={0.2}>
          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              placeholder="Mail Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--fg)] transition-transform hover:scale-105"
            >
              Send Now
              <CtaArrowBadge />
            </button>
          </form>
          {submitted && (
            <p className="mt-3 text-sm text-white/80" role="status">
              Thanks! You&apos;re on the list.
            </p>
          )}
        </Reveal>
      </div>
    </section>
  );
}
