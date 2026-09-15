"use client";

import Link from "next/link";
import { useState } from "react";

import { faqs } from "../defaults";
import { Reveal } from "./Reveal";
import { useContent } from "../context";

export function FaqSection() {
  const { faqs } = useContent();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-rs-bg py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal className="text-center">
          <span className="rs-eyebrow">FAQ</span>
          <h2 className="rs-heading mt-3 text-4xl text-rs-ink sm:text-5xl">
            <span className="rs-gradient-text">Burning Questions</span> About Vectora
          </h2>
          <p className="mt-4 text-base text-rs-muted">Simple answers to make things clear.</p>
        </Reveal>

        <div className="mt-12 divide-y divide-black/10 border-y border-black/10">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={faq.question}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left"
                >
                  <span className="text-base font-medium text-rs-ink">{faq.question}</span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rs-ink text-white transition-transform ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <p className="rs-fade-up pb-6 text-sm leading-relaxed text-rs-muted">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-6 rounded-3xl bg-rs-ink px-8 py-8 text-white sm:flex-row">
          <p className="max-w-sm text-sm text-white/70">Still have questions? We&rsquo;re here to help.</p>
          <Link
            href="/contact"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-rs-ink"
          >
            Get Assistance
          </Link>
        </div>
      </div>
    </section>
  );
}
