"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useSanvera } from "../context";

export default function JourneyCTA() {
  const { JOURNEY_CTA } = useSanvera();
  return (
    <section className="relative flex h-[520px] items-center justify-center overflow-hidden text-center sm:h-[620px]">
      <Image
        src={JOURNEY_CTA.image}
        alt={JOURNEY_CTA.heading}
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[var(--maroon-deepest)]/55" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto max-w-2xl px-6"
      >
        <h2 className="font-display text-3xl font-bold uppercase leading-[1.05] text-[var(--cream)] sm:text-5xl">
          {JOURNEY_CTA.heading}
        </h2>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-[var(--cream)]/85">
          {JOURNEY_CTA.subhead}
        </p>
        <a href="#faq" className="btn-orange mx-auto mt-7 w-fit">
          {JOURNEY_CTA.cta}
          <span className="icon-badge">↗</span>
        </a>
      </motion.div>
    </section>
  );
}
