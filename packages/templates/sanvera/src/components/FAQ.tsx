"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal } from "./Reveal";
import { useSanvera } from "../context";

export default function FAQ() {
  const { FAQS, FAQ_CTA, FAQ_HEADING, FAQ_IMAGE, CONTACT_HREF } = useSanvera();
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="bg-pattern bg-[var(--cream)] px-6 py-24 md:px-10">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 md:grid-cols-2">
        <Reveal>
          <div className="relative h-72 overflow-hidden rounded-2xl sm:h-96">
            <Image src={FAQ_IMAGE} alt="Have questions" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          </div>
          <h2 className="mt-8 font-display text-2xl font-bold uppercase leading-[1.05] text-[var(--maroon)] sm:text-3xl">
            {FAQ_HEADING}
          </h2>
          <a href={CONTACT_HREF} className="btn-orange mt-6">
            {FAQ_CTA}
            <span className="icon-badge">↗</span>
          </a>
        </Reveal>

        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = i === open;
            return (
              <Reveal key={faq.question} delay={i * 0.05}>
                <div
                  className={`rounded-2xl border px-6 py-5 transition-colors ${
                    isOpen
                      ? "border-transparent bg-[var(--maroon-card)] text-[var(--cream)]"
                      : "border-[var(--maroon)]/20 bg-transparent text-[var(--maroon)]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="flex w-full items-center justify-between gap-4 text-left"
                  >
                    <span className="font-display text-base font-bold uppercase sm:text-lg">
                      {faq.question}
                    </span>
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${
                        isOpen ? "bg-[var(--orange)]" : "bg-[var(--orange)] text-[var(--cream)]"
                      }`}
                    >
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="mt-4 text-sm leading-relaxed text-[var(--cream)]/85">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
