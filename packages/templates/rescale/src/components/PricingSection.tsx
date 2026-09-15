"use client";

import Link from "next/link";
import { useState } from "react";

import { annualDiscount, pricingTiers } from "../defaults";
import { Reveal } from "./Reveal";
import { useContent } from "../context";

export function PricingSection() {
  const { annualDiscount, pricingTiers } = useContent();
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="bg-rs-bg py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="rs-eyebrow">Pricing</span>
          <h2 className="rs-heading mt-3 text-4xl text-rs-ink sm:text-5xl">
            <span className="rs-gradient-text">Explore</span> Our Plans
          </h2>
          <p className="mt-4 text-base text-rs-muted">
            Super flexible monthly plans and cost-effective annual subscriptions.
          </p>
        </Reveal>

        <div className="mt-10 flex items-center justify-center gap-4">
          <span className={`text-sm font-semibold ${!annual ? "text-rs-ink" : "text-rs-muted"}`}>
            Monthly
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={annual}
            onClick={() => setAnnual((v) => !v)}
            className={`relative h-7 w-14 rounded-full transition-colors ${
              annual ? "bg-rs-brand-dark" : "bg-black/20"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                annual ? "translate-x-8" : "translate-x-1"
              }`}
            />
          </button>
          <span className={`text-sm font-semibold ${annual ? "text-rs-ink" : "text-rs-muted"}`}>
            Annual
          </span>
          <span className="rounded-full bg-rs-brand-light/30 px-3 py-1 text-xs font-semibold text-rs-brand-dark">
            Save {Math.round(annualDiscount * 100)}%
          </span>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {pricingTiers.map((tier) => {
            const price = annual
              ? Math.round(tier.monthlyPrice * (1 - annualDiscount))
              : tier.monthlyPrice;
            return (
              <div
                key={tier.name}
                className={`flex flex-col rounded-3xl border p-8 ${
                  tier.featured
                    ? "rs-gradient-diagonal border-transparent text-white shadow-xl"
                    : "border-black/5 bg-white"
                }`}
              >
                <h3 className={`rs-heading text-xl ${tier.featured ? "text-white" : "text-rs-ink"}`}>
                  {tier.name}
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className={`rs-heading text-4xl ${tier.featured ? "text-white" : "text-rs-ink"}`}>
                    ${price}
                  </span>
                  <span className={`text-sm ${tier.featured ? "text-white/80" : "text-rs-muted"}`}>
                    /month
                  </span>
                </div>

                <ul className="mt-6 flex flex-1 flex-col gap-3">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className={`flex items-start gap-2 text-sm ${
                        tier.featured ? "text-white/90" : "text-rs-muted"
                      }`}
                    >
                      <span aria-hidden="true" className={tier.featured ? "text-white" : "text-rs-brand-dark"}>
                        ✓
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.ctaHref}
                  className={`mt-8 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:scale-[1.02] ${
                    tier.featured
                      ? "bg-white text-rs-brand-dark"
                      : "rs-gradient-brand text-white"
                  }`}
                >
                  {tier.ctaLabel}
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 rounded-3xl border border-black/5 bg-white px-8 py-6 sm:flex-row">
          <p className="text-sm text-rs-muted">Unsure which plan to pick?</p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold text-rs-ink transition-colors hover:border-rs-brand-dark"
          >
            Ask our Expert
          </Link>
        </div>
      </div>
    </section>
  );
}
