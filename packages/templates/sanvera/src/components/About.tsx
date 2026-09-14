"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Reveal } from "./Reveal";
import { CountUp } from "./CountUp";
import { useSanvera } from "../context";

export default function About() {
  const { ABOUT, BRAND_NAME } = useSanvera();
  return (
    <section id="about" className="bg-pattern relative bg-[var(--cream)] px-6 pt-28 pb-24 md:px-10">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <span className="eyebrow-pill">{ABOUT.eyebrow}</span>
        </Reveal>

        <div className="relative mt-6 max-w-5xl">
          <Reveal delay={0.1}>
            <h2 className="font-display max-w-4xl text-3xl font-bold uppercase leading-[1.05] text-[var(--maroon)] sm:text-5xl">
              {ABOUT.heading}
            </h2>
          </Reveal>

          <motion.div
            initial={{ opacity: 0, y: 30, rotate: -6 }}
            whileInView={{ opacity: 1, y: 0, rotate: -4 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 -mt-16 ml-2 h-20 w-16 overflow-hidden rounded-xl shadow-lg sm:-mt-20 sm:h-28 sm:w-24"
          >
            <Image src={ABOUT.thumb} alt={`About ${BRAND_NAME}`} fill sizes="120px" className="object-cover" />
          </motion.div>

          <Reveal delay={0.2} className="mt-8">
            <a href="#faq" className="btn-orange">
              {ABOUT.cta}
              <span className="icon-badge">↗</span>
            </a>
          </Reveal>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 ml-auto max-w-lg rounded-3xl bg-[var(--maroon-card)] p-8 text-[var(--cream)] sm:p-10"
        >
          <p className="text-sm leading-relaxed text-[var(--cream)]/90">{ABOUT.paragraph}</p>
          <div className="mt-8 grid grid-cols-3 divide-x divide-[var(--cream)]/15">
            {ABOUT.stats.map((s) => (
              <div key={s.label} className="px-2 first:pl-0">
                <div className="font-display text-3xl font-bold sm:text-4xl">
                  <CountUp value={s.value} suffix={s.suffix} />
                </div>
                <div className="mt-1 text-xs text-[var(--cream)]/75">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
