'use client';

import { Check } from 'lucide-react';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's own plan band: two tiers, the "Vision Plan" in its own
 * gold-glow "Best value" badge variant. The source also renders a
 * Monthly/Yearly toggle, but its static markup carries only the monthly
 * figures — no distinct yearly price was ever recoverable from the crawl —
 * so the toggle itself is not ported rather than wired to a yearly number
 * this port would have to invent.
 */
export default function Pricing() {
  const { PRICING } = useContent();

  return (
    <section id="pricing" className="py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          {PRICING.eyebrow ? (
            <p className="text-xs font-semibold tracking-[0.28em] text-summit-gold uppercase">
              {PRICING.eyebrow}
            </p>
          ) : null}
          <h2 className="font-summit-display mt-4 text-3xl text-summit-ink sm:text-4xl">
            {PRICING.title}
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {PRICING.tiers.map((tier, i) => (
            <Reveal
              key={tier.name}
              delay={i * 90}
              className={`summit-card relative flex flex-col gap-6 p-8 ${
                tier.featured ? 'border-summit-gold/60 shadow-[0_0_60px_-15px_rgba(250,187,0,0.35)]' : ''
              }`}
            >
              {tier.badge ? (
                <span className="summit-glow summit-pill absolute -top-3 left-8 px-3 py-1 text-xs font-semibold text-summit-bg">
                  {tier.badge}
                </span>
              ) : null}

              <div>
                <p className="font-summit-display text-xl text-summit-ink">{tier.name}</p>
                <p className="mt-3 flex items-baseline gap-2">
                  <span className="font-summit-mono text-4xl text-summit-ink">{tier.price}</span>
                  <span className="text-sm text-summit-faint">{tier.note}</span>
                </p>
              </div>

              <ul className="flex flex-col gap-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-summit-muted">
                    <Check size={16} className="mt-0.5 shrink-0 text-summit-gold" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>

              {tier.cta ? (
                <Link
                  href={tier.cta.href}
                  className={`summit-pill mt-auto inline-flex items-center justify-center px-6 py-3 text-sm font-semibold transition-colors ${
                    tier.featured
                      ? 'bg-white/85 text-summit-bg hover:bg-white'
                      : 'border border-white/25 text-summit-ink hover:bg-white/10'
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
