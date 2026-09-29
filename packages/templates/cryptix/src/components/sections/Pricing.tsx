'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's own Monthly/Yearly billing toggle with a "20% OFF" badge —
 * the static crawl only ever captured the monthly figures (the yearly swap
 * happens client-side), so `priceYearly` in defaults.ts is this port's own
 * disclosed 20%-off arithmetic on the source's own monthly price, not a
 * scraped number. Wired here as real interactive state.
 */
export default function Pricing() {
  const { PRICING } = useContent();
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="bg-cryptix-bg py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-cryptix-link uppercase">
            {PRICING.eyebrow}
          </p>
          <h2 className="font-cryptix-display mt-4 text-3xl text-cryptix-ink sm:text-4xl">{PRICING.title}</h2>
          {PRICING.subhead ? (
            <p className="mt-4 text-base text-cryptix-muted">{PRICING.subhead}</p>
          ) : null}
        </Reveal>

        <Reveal delay={80} className="mt-10 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setYearly(false)}
            className={`cryptix-pill px-5 py-2 text-sm font-semibold transition-colors ${!yearly ? 'bg-cryptix-accent text-cryptix-accent-ink' : 'text-cryptix-muted'}`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setYearly(true)}
            className={`cryptix-pill flex items-center gap-2 px-5 py-2 text-sm font-semibold transition-colors ${yearly ? 'bg-cryptix-accent text-cryptix-accent-ink' : 'text-cryptix-muted'}`}
          >
            Yearly
            <span className="rounded-full bg-cryptix-gold/15 px-2 py-0.5 text-xs text-cryptix-gold">
              {PRICING.yearlyDiscountLabel}
            </span>
          </button>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PRICING.tiers.map((tier, i) => (
            <Reveal
              key={tier.name}
              delay={i * 90}
              className={`cryptix-card flex flex-col border p-8 ${
                tier.featured
                  ? 'border-cryptix-accent bg-cryptix-surface cryptix-glow'
                  : 'border-cryptix-border bg-cryptix-surface'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-cryptix-display text-lg text-cryptix-ink">{tier.name}</h3>
                {tier.badge ? (
                  <span className="cryptix-pill bg-cryptix-accent px-3 py-1 text-xs font-semibold text-cryptix-accent-ink">
                    {tier.badge}
                  </span>
                ) : null}
              </div>

              <p className="mt-6 flex items-baseline gap-1">
                <span className="font-cryptix-mono text-4xl text-cryptix-ink">
                  {yearly ? tier.priceYearly : tier.priceMonthly}
                </span>
                <span className="text-sm text-cryptix-faint">{tier.period}</span>
              </p>
              <p className="mt-2 text-sm text-cryptix-muted">{tier.note}</p>

              {tier.cta ? (
                <Link
                  href={tier.cta.href}
                  className={`cryptix-pill mt-6 inline-flex items-center justify-center px-6 py-3 text-sm font-semibold transition-transform hover:scale-[1.02] ${
                    tier.featured
                      ? 'bg-cryptix-accent text-cryptix-accent-ink'
                      : 'border border-cryptix-border text-cryptix-ink'
                  }`}
                >
                  {tier.cta.label}
                </Link>
              ) : null}

              <p className="mt-8 text-xs font-semibold tracking-[0.1em] text-cryptix-faint uppercase">
                {tier.includedLabel}
              </p>
              <ul className="mt-4 flex flex-col gap-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-cryptix-muted">
                    <Check size={16} className="mt-0.5 shrink-0 text-cryptix-accent" aria-hidden="true" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
