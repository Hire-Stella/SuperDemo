"use client";

import Link from "next/link";
import { BOOKING_URL, PRICING } from "../../defaults";
import Reveal, { RevealGroup, RevealItem } from "../../components/Reveal";
import { useContent } from "../../context";

export default function Pricing() {
  const { BOOKING_URL, PRICING } = useContent();
  return (
    <section id="pricing" className="bg-cream py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-accent">
            {PRICING.eyebrow}
          </p>
          <h2 className="font-display mt-4 text-4xl font-semibold sm:text-5xl">
            {PRICING.title}
          </h2>
          <p className="mt-4 text-base text-muted">{PRICING.subhead}</p>
        </Reveal>

        <RevealGroup className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PRICING.tiers.map((tier) => (
            <RevealItem
              key={tier.name}
              className={`relative flex flex-col rounded-3xl border p-8 ${
                tier.featured
                  ? "border-accent bg-ink text-cream shadow-xl"
                  : "border-ink/10 bg-white text-ink"
              }`}
            >
              {tier.badge && (
                <span className="absolute -top-3 left-8 rounded-full bg-accent px-4 py-1 text-xs font-medium text-white">
                  {tier.badge}
                </span>
              )}

              <h3 className="font-display text-2xl font-semibold">{tier.name}</h3>
              <p
                className={`mt-2 text-sm ${
                  tier.featured ? "text-cream/70" : "text-muted"
                }`}
              >
                {tier.description}
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-4xl font-semibold">
                  {tier.price}
                </span>
                <span
                  className={`text-sm ${
                    tier.featured ? "text-cream/60" : "text-muted"
                  }`}
                >
                  {tier.period}
                </span>
              </div>

              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className={`flex items-start gap-3 text-sm ${
                      tier.featured ? "text-cream/80" : "text-muted"
                    }`}
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime text-xs text-ink">
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-8 inline-flex items-center justify-center rounded-full px-8 py-3.5 text-sm font-medium transition-transform hover:scale-105 ${
                  tier.featured ? "bg-accent text-white" : "bg-ink text-white"
                }`}
              >
                {PRICING.cta}
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
