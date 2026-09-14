"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BOOKING_URL, FINAL_CTA } from "../../defaults";
import BlurWordsReveal from "../../components/BlurWordsReveal";
import { useContent } from "../../context";

export default function FinalCta() {
  const { BOOKING_URL, FINAL_CTA } = useContent();
  return (
    <motion.section
      data-framer-name="CTA"
      id="footer"
      className="bg-ink py-24 text-cream"
      initial={{ opacity: 0.5, scale: 0.7 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-display text-4xl font-semibold sm:text-5xl">
          <BlurWordsReveal text={FINAL_CTA.title} />
        </h2>
        <p className="mt-6 text-base leading-relaxed text-cream/70">
          {FINAL_CTA.subhead}
        </p>
        <Link
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-accent px-8 py-3.5 text-sm font-medium text-white transition-transform hover:scale-105"
        >
          {FINAL_CTA.cta}
        </Link>
      </div>
    </motion.section>
  );
}
