"use client";

import Link from "next/link";

import { closingCtaHeading, closingCtaSubhead, ctaHref, ctaLabel } from "../defaults";
import { IconArrowRight } from "./icons";
import { useContent } from "../context";

export function ClosingCtaSection() {
  const { closingCtaHeading, closingCtaSubhead, ctaHref, ctaLabel } = useContent();
  return (
    <section className="pb-16 sm:pb-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="rounded-[2.5rem] bg-zv-ink px-8 py-16 text-center sm:px-16">
          <h2 className="zv-heading text-3xl text-white sm:text-4xl">{closingCtaHeading}</h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/70">{closingCtaSubhead}</p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-zv-ink transition-transform hover:scale-[1.03]"
            >
              {ctaLabel}
              <IconArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/#pricing"
              className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
            >
              See our plans
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
