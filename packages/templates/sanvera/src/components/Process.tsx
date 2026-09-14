"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Reveal } from "./Reveal";
import { useSanvera } from "../context";

const PER_PAGE = 3;

const SLIDE: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 60 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: -dir * 60 }),
};

export default function Process() {
  const { PROCESS } = useSanvera();
  const pages = Math.ceil(PROCESS.steps.length / PER_PAGE);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(1);

  const go = (dir: 1 | -1) => {
    setDirection(dir);
    setPage((p) => (p + dir + pages) % pages);
  };

  const visible = PROCESS.steps.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  return (
    <section id="process" className="bg-pattern bg-[var(--cream)] px-6 py-24 md:px-10">
      <div className="mx-auto max-w-7xl text-center">
        <Reveal>
          <span className="eyebrow-pill">{PROCESS.eyebrow}</span>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mx-auto mt-6 max-w-2xl font-display text-3xl font-bold uppercase leading-[1.05] text-[var(--maroon)] sm:text-5xl">
            {PROCESS.heading}
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-[var(--maroon)]/75">
            {PROCESS.subhead}
          </p>
        </Reveal>

        <div className="relative mt-14 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={page}
              custom={direction}
              /*
               * `variants` + `custom`, not inline functions on initial/exit.
               *
               * The clone wrote `initial={(dir) => …}`, which framer-motion
               * runs but does not type — its signature takes a target object
               * there, and the function form is only accepted inside variants.
               * The original repo never caught it because `next dev` does not
               * typecheck. Same three states, same distances, same easing.
               */
              variants={SLIDE}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 gap-6 sm:grid-cols-3"
            >
              {visible.map((step) => (
                <div
                  key={step.number}
                  className="rounded-3xl bg-[var(--maroon-card)] p-8 text-left text-[var(--cream)]"
                >
                  <Image
                    src={step.icon}
                    alt=""
                    width={56}
                    height={56}
                    className="h-12 w-12 opacity-90"
                  />
                  <h3 className="mt-5 font-display text-xl font-bold uppercase">
                    {step.number}. {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--cream)]/80">
                    {step.description}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {step.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-3 text-sm text-[var(--cream)]/90">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--cream)]/40 text-xs">
                          +
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--maroon)]/30 text-[var(--maroon)] transition-colors hover:bg-[var(--maroon)] hover:text-[var(--cream)]"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--orange)] text-[var(--cream)] transition-transform hover:scale-105"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
