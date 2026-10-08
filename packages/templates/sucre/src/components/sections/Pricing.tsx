'use client';

import { Check } from 'lucide-react';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's own "Sweet memberships" band: three tiers, the middle one in
 * its own gold-bordered "Desktop Gold" card variant — kept here as the one
 * `featured` card, lifted slightly and outlined in the source's own literal
 * gold token rather than the shared blush border every other card uses.
 */
export default function Pricing() {
  const { PRICING } = useContent();

  return (
    <section className="bg-sucre-bg py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-sucre-rose uppercase">
            {PRICING.eyebrow}
          </p>
          <h2 className="font-sucre-display mt-4 text-3xl text-sucre-ink sm:text-4xl">
            {PRICING.title} {PRICING.titleLine2}
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {PRICING.tiers.map((tier, i) => (
            <Reveal
              key={tier.name}
              delay={i * 90}
              className={`sucre-card flex flex-col gap-6 p-8 ${
                tier.featured
                  ? 'border-2 border-sucre-gold bg-sucre-bg shadow-[0_20px_45px_-15px_rgba(182,124,38,0.45)] sm:-translate-y-3'
                  : 'border border-sucre-border/60 bg-sucre-surface'
              }`}
            >
              <div>
                <p className="font-sucre-display text-xl text-sucre-ink">{tier.name}</p>
                <p className="mt-3 flex items-baseline gap-2">
                  <span className="font-sucre-display text-4xl text-sucre-pink">{tier.price}</span>
                  <span className="text-sm text-sucre-muted">{tier.note}</span>
                </p>
              </div>

              <ul className="flex flex-col gap-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-sucre-muted">
                    <Check
                      size={16}
                      className="mt-0.5 shrink-0 text-sucre-pink"
                      aria-hidden="true"
                    />
                    {f}
                  </li>
                ))}
              </ul>

              {tier.cta ? (
                <Link
                  href={tier.cta.href}
                  className={`sucre-pill mt-auto inline-flex items-center justify-center px-6 py-3 text-sm font-semibold transition-colors ${
                    tier.featured
                      ? 'bg-sucre-pink text-sucre-bg hover:bg-sucre-pink-soft'
                      : 'border border-sucre-pink text-sucre-pink hover:bg-sucre-pink hover:text-sucre-bg'
                  }`}
                >
                  {tier.cta.label}
                </Link>
              ) : null}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
