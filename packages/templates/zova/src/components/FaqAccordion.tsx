"use client";

import { useState } from "react";

import { faqs } from "../defaults";
import { IconPlus } from "./icons";
import { useContent } from "../context";

export function FaqAccordion() {
  const { faqs } = useContent();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-zv-line border-y border-zv-line">
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
              <span className="text-base font-medium text-zv-ink">{faq.question}</span>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zv-line text-zv-ink transition-transform duration-300 ${
                  isOpen ? "rotate-45" : ""
                }`}
              >
                <IconPlus className="h-4 w-4" />
              </span>
            </button>
            {isOpen && (
              <p className="zv-fade-up pb-6 text-sm leading-relaxed text-zv-muted">{faq.answer}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
