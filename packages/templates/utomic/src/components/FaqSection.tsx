"use client";

import { useState } from "react";
import { faqs } from "../defaults";
import Image from "next/image";
import { useContent } from "../context";

export default function FaqSection() {
  const { faqs } = useContent();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-surface px-6 py-24 lg:py-28">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-plum">
            FAQ
          </span>
          <h2 className="mt-3 text-3xl font-semibold text-black sm:text-4xl">
            Frequently asked questions answered
          </h2>
        </div>

        <div className="mt-12 divide-y divide-black/10 border-y border-black/10">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={faq.question}>
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left"
                >
                  <span className="text-base font-medium text-black sm:text-lg">
                    {faq.question}
                  </span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-white transition-transform ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <p className="animate-fade-up pb-6 text-sm leading-relaxed text-black/60 sm:text-base">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-6 rounded-3xl bg-black px-8 py-8 text-white sm:flex-row">
          <div className="flex items-center gap-4">
            <Image
              src="/t/utomic/images/cta-portrait.jpg"
              alt="Get in touch"
              width={56}
              height={56}
              className="h-14 w-14 rounded-full object-cover"
            />
            <p className="max-w-sm text-sm text-white/70">
              Send us an email anytime and we&rsquo;ll respond with support or details
            </p>
          </div>
          <a
            href="mailto:contact@gmail.com"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black"
          >
            Get in touch with us
          </a>
        </div>
      </div>
    </section>
  );
}
