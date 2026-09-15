"use client";

import Link from "next/link";

import { ctaHref, pricingHeading, pricingSubhead, pricingTiers } from "../defaults";
import { IconArrowRight } from "./icons";
import { useContent } from "../context";

export function PricingSection() {
  const { ctaHref, pricingHeading, pricingSubhead, pricingTiers } = useContent();
  return (
    <section id="pricing" className="py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <h2 className="zv-heading text-3xl text-zv-ink sm:text-4xl">{pricingHeading}</h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-zv-muted">{pricingSubhead}</p>
      </div>

      <div className="mx-auto mt-14 grid max-w-5xl gap-6 px-6 lg:grid-cols-3">
        {pricingTiers.map((tier) => (
          <div
            key={tier.name}
            className={`flex flex-col rounded-3xl border p-8 ${
              tier.featured
                ? "border-zv-blue-line bg-zv-blue-soft shadow-[0_20px_50px_rgba(37,99,235,0.1)] lg:-translate-y-3"
                : "border-zv-line bg-gradient-to-b from-zv-card to-zv-card-2"
            }`}
          >
            {tier.featured && (
              <span className="mb-4 inline-flex w-fit items-center rounded-full bg-zv-ink px-3 py-1 text-xs font-semibold text-white">
                Most popular
              </span>
            )}
            <p className="zv-heading text-xl text-zv-ink">{tier.name}</p>
            <p className="mt-2 text-sm leading-relaxed text-zv-muted">{tier.description}</p>

            <p className="zv-heading mt-6 text-4xl text-zv-ink">
              {tier.price}
              {tier.priceSuffix && <span className="text-base font-medium text-zv-muted">{tier.priceSuffix}</span>}
            </p>

            <Link
              href={ctaHref}
              className={`mt-6 inline-flex items-center justify-center gap-1.5 px-5 py-3 text-sm font-semibold transition-transform hover:scale-[1.02] ${
                tier.featured ? "zv-btn-primary" : "zv-btn-outline"
              }`}
            >
              {tier.ctaLabel}
              {tier.featured && <IconArrowRight className="h-4 w-4" />}
            </Link>

            <ul className="mt-8 flex flex-col gap-3">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-zv-ink">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="mt-0.5 h-4 w-4 shrink-0 text-zv-ink">
                    <path d="M5 12l4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
