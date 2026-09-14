"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal } from "./Reveal";
import { useSanvera } from "../context";

export default function Testimonials() {
  const { TESTIMONIALS, TESTIMONIALS_EYEBROW, TESTIMONIALS_HEADING, TESTIMONIALS_SUBHEAD } = useSanvera();
  const [index, setIndex] = useState(0);
  const current = TESTIMONIALS[index];
  const next = TESTIMONIALS[(index + 1) % TESTIMONIALS.length];
  /*
   * The adapter guarantees a non-empty list — empty content falls back to the
   * template's own — but the compiler cannot know that, and a consumer's
   * tsconfig is stricter than the one this was cloned under. Rendering nothing
   * is also the right answer if a product ever does pass none: an empty
   * carousel with two blank photo frames is worse than no band.
   *
   * Safe after the hooks above, and there are none below.
   */
  if (!current || !next) return null;

  const advance = () => setIndex((i) => (i + 1) % TESTIMONIALS.length);
  const back = () => setIndex((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);

  return (
    <section id="testimonials" className="bg-pattern bg-[var(--cream)] px-6 py-24 md:px-10">
      <div className="mx-auto max-w-7xl text-center">
        <Reveal>
          <span className="eyebrow-pill">{TESTIMONIALS_EYEBROW}</span>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mx-auto mt-6 max-w-2xl font-display text-3xl font-bold uppercase leading-[1.05] text-[var(--maroon)] sm:text-5xl">
            {TESTIMONIALS_HEADING}
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-[var(--maroon)]/75">
            {TESTIMONIALS_SUBHEAD}
          </p>
        </Reveal>

        <div className="relative mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={`photo-a-${index}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-64 overflow-hidden rounded-2xl sm:h-full"
            >
              <Image src={current.photo} alt={current.name} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={`quote-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col justify-between rounded-2xl bg-[var(--maroon-card)] p-8 text-left text-[var(--cream)]"
            >
              <p className="font-display text-lg font-bold uppercase leading-snug sm:text-xl">
                &ldquo;{current.quote}&rdquo;
              </p>
              <div className="mt-8">
                <div className="text-sm font-semibold">{current.name}</div>
                <div className="text-xs text-[var(--cream)]/70">{current.role}</div>
              </div>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={`photo-b-${index}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-64 overflow-hidden rounded-2xl sm:h-full"
            >
              <Image src={next.photo} alt={next.name} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={back}
            aria-label="Previous testimonial"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--maroon)]/30 text-[var(--maroon)] transition-colors hover:bg-[var(--maroon)] hover:text-[var(--cream)]"
          >
            ←
          </button>
          <button
            type="button"
            onClick={advance}
            aria-label="Next testimonial"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--orange)] text-[var(--cream)] transition-transform hover:scale-105"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
