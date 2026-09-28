'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * A plain four-number band — no continuous ticker here the way aurelia's
 * stats band runs one; this template's own continuous motion already lives
 * in the hero's rising steam, and repeating it as a second marquee would
 * blur the two together rather than read as one deliberate signature.
 */
export default function Stats() {
  const { STATS } = useContent();

  return (
    <section className="bg-yokai-surface py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-lg text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-yokai-gold uppercase">
            {STATS.eyebrow}
          </p>
          <h2 className="font-yokai-display mt-4 text-3xl text-yokai-paper sm:text-4xl">
            {STATS.title}
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {STATS.items.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 100} className="text-center">
              <p className="font-yokai-display text-4xl text-yokai-lantern sm:text-5xl">
                {stat.value}
              </p>
              <p className="mt-2 text-xs font-semibold tracking-[0.1em] text-yokai-muted uppercase">
                {stat.label}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
