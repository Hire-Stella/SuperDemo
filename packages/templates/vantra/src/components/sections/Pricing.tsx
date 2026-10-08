'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's own two published tiers, each in a shared rounded panel, the
 * "Popular" tier rendered dark, plus its "talk to sales" enterprise banner.
 * The source also draws a Monthly/Yearly billing toggle; not reproduced —
 * there is no second, discounted price in this contract's `PricingTier` to
 * switch to, so a toggle here would animate between two copies of the same
 * number rather than the source's real Monthly/Yearly swap.
 */
export default function Pricing() {
  const { PRICING } = useContent();
  if (PRICING.tiers.length === 0) return null;

  return (
    <section id="pricing" className="py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-6">
        <Reveal className="text-center">
          {PRICING.eyebrow ? (
            <span className="vantra-pill inline-block bg-vantra-surface px-4 py-1.5 text-xs font-semibold text-vantra-ink">
              {PRICING.eyebrow}
            </span>
          ) : null}
          <h2 className="font-vantra-display mx-auto mt-4 max-w-md text-4xl text-vantra-ink">
            {PRICING.title}
          </h2>
        </Reveal>

        <Reveal
          delay={60}
          className="vantra-card mt-12 grid gap-2 border border-vantra-border bg-vantra-surface p-2 sm:grid-cols-2"
        >
          {PRICING.tiers.map((tier) => (
            <div
              key={tier.name}
              className={`vantra-card flex flex-col p-8 ${
                tier.featured ? 'bg-vantra-dark text-white' : 'bg-vantra-bg text-vantra-ink'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-vantra-display text-xl">{tier.name}</h3>
                {tier.badge ? (
                  <span className="vantra-pill bg-vantra-accent px-3 py-1 text-xs font-semibold text-white">
                    {tier.badge}
                  </span>
                ) : null}
              </div>
              {tier.note ? (
                <p className={`mt-1 text-sm ${tier.featured ? 'text-white/60' : 'text-vantra-muted'}`}>
                  {tier.note}
                </p>
              ) : null}

              <p className="font-vantra-display mt-6 flex items-baseline gap-1 text-4xl">
                {tier.price}
                {tier.priceSuffix ? (
                  <span
                    className={`text-base font-medium ${tier.featured ? 'text-white/60' : 'text-vantra-muted'}`}
                  >
                    {tier.priceSuffix}
                  </span>
                ) : null}
              </p>

              {tier.cta ? (
                <Link
                  href={tier.cta.href}
                  className={`vantra-pill mt-6 inline-flex items-center justify-center py-3 text-sm font-semibold transition-opacity hover:opacity-90 ${
                    tier.featured ? 'bg-white text-vantra-ink' : 'bg-vantra-dark text-white'
                  }`}
                >
                  {tier.cta.label}
                </Link>
              ) : null}

              {tier.features.length > 0 ? (
                <ul className="mt-7 flex flex-col gap-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm">
                      <Image
                        src="/t/vantra/icons/pricing-check.svg"
                        alt=""
                        width={7}
                        height={10}
                        className="h-2.5 w-2 shrink-0"
                      />
                      <span className={tier.featured ? 'text-white/80' : 'text-vantra-muted'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </Reveal>

        {PRICING.billingNote ? (
          <p className="mt-6 text-center text-xs text-vantra-muted">{PRICING.billingNote}</p>
        ) : null}

        {PRICING.enterprise ? (
          <Reveal
            delay={120}
            className="vantra-card relative mt-10 flex flex-col items-start gap-4 overflow-hidden border border-vantra-border bg-gradient-to-br from-sky-50 to-white p-8 sm:flex-row sm:items-center sm:justify-between"
          >
            {PRICING.enterprise.image ? (
              <Image
                src={PRICING.enterprise.image}
                alt=""
                aria-hidden
                fill
                sizes="100vw"
                className="absolute inset-0 -z-10 object-cover object-right opacity-70"
              />
            ) : null}
            <div>
              <h3 className="font-vantra-display text-xl text-vantra-ink">
                {PRICING.enterprise.title}
              </h3>
              <p className="mt-1 max-w-sm text-sm text-vantra-muted">{PRICING.enterprise.body}</p>
            </div>
            {PRICING.enterprise.cta ? (
              <Link
                href={PRICING.enterprise.cta.href}
                className="vantra-pill inline-flex shrink-0 items-center bg-vantra-dark px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {PRICING.enterprise.cta.label}
              </Link>
            ) : null}
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
