'use client';

import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's "Hot Pizza, Hotter Deals" band — five combo bundles, each a
 * flat price with a literal "Save $X" badge. That badge is a real colour
 * lift: the source's own CSS custom property for it is
 * `background-color: rgb(255, 145, 0)`, the same orange used nowhere else
 * on the page, so it reads here as `--color-forno-orange` and nothing
 * else. tavola's source had no equivalent content, so tavola never
 * supports `pricing` — this is the first template in the library that can.
 */
export default function Pricing() {
  const { PRICING, ORDER_LABEL } = useContent();

  return (
    <section id="deals" className="bg-forno-surface py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-bold tracking-[0.22em] text-forno-red uppercase">
            {PRICING.eyebrow}
          </p>
          <h2 className="font-forno-display mt-4 text-4xl text-forno-ink sm:text-5xl">
            {PRICING.title}
          </h2>
          <p className="mt-4 text-base text-forno-muted">{PRICING.subhead}</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {PRICING.items.map((tier, i) => (
            <Reveal
              key={tier.name}
              delay={(i % 5) * 80}
              className={`forno-card relative flex flex-col gap-4 border p-6 ${
                tier.featured
                  ? 'border-forno-red bg-forno-bg shadow-[0_20px_36px_-16px_rgba(255,0,60,0.35)]'
                  : 'border-forno-border bg-forno-bg'
              }`}
            >
              {tier.note ? (
                <span className="forno-pill absolute -top-3 right-5 bg-forno-orange px-3 py-1 text-xs font-bold text-forno-ink">
                  {tier.note}
                </span>
              ) : null}
              <h3 className="font-forno-display text-lg text-forno-ink">{tier.name}</h3>
              <p className="font-forno-display text-3xl text-forno-red">{tier.price}</p>
              <ul className="flex flex-1 flex-col gap-2 text-sm text-forno-muted">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span aria-hidden="true" className="text-forno-red">
                      •
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="#contact"
                className={`forno-pill mt-2 inline-flex items-center justify-center px-5 py-2.5 text-xs font-bold tracking-[0.06em] uppercase transition-transform hover:scale-[1.03] ${
                  tier.featured ? 'bg-forno-red text-white' : 'bg-forno-ink text-white'
                }`}
              >
                {ORDER_LABEL}
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
