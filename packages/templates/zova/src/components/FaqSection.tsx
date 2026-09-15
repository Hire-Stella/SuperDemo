"use client";

import Link from "next/link";

import { ctaHref, faqHeading, faqSubhead, faqVideo, faqVideoPoster } from "../defaults";
import { FaqAccordion } from "./FaqAccordion";
import { useContent } from "../context";

export function FaqSection() {
  const { ctaHref, faqHeading, faqSubhead, faqVideo, faqVideoPoster } = useContent();
  return (
    <section id="faq" className="py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <h2 className="zv-heading text-3xl text-zv-ink sm:text-4xl">{faqHeading}</h2>
            <p className="mt-4 max-w-sm text-base text-zv-muted">{faqSubhead}</p>
            <video
              src={faqVideo}
              poster={faqVideoPoster}
              autoPlay
              loop
              muted
              playsInline
              className="mt-8 h-40 w-40"
            />
          </div>

          <div>
            <FaqAccordion />
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-6 rounded-3xl bg-zv-card px-8 py-8 sm:flex-row">
          <p className="max-w-sm text-sm text-zv-muted">Still got questions?</p>
          <Link
            href={ctaHref}
            className="zv-btn-primary inline-flex shrink-0 items-center justify-center px-6 py-3 text-sm font-semibold"
          >
            Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}
