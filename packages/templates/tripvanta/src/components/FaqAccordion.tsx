"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RevealItem } from "../components/Reveal";
import { FAQS } from "../defaults";
import { useContent } from "../context";

export default function FaqAccordion() {
  const { FAQS } = useContent();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl divide-y divide-black/10">
      {FAQS.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <RevealItem key={faq.question} y={20} scale={1} className="py-5">
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between text-left"
              aria-expanded={isOpen}
            >
              <span className="font-medium text-[var(--fg)]">{faq.question}</span>
              <span className="ml-4 text-xl text-[var(--muted)]">{isOpen ? "−" : "+"}</span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <p className="pt-3 text-sm text-[var(--muted)]">{faq.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </RevealItem>
        );
      })}
    </div>
  );
}
