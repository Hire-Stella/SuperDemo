'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/** A plain four-number band — no continuous ticker here; this template's own continuous motion already lives in the hero's rising pearls. */
export default function Stats() {
  const { STATS } = useContent();

  return (
    <section className="bg-pearl-surface py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-lg text-center">
          <p className="text-xs font-bold tracking-[0.28em] text-pearl-berry uppercase">
            {STATS.eyebrow}
          </p>
          <h2 className="font-pearl-display mt-4 text-3xl text-pearl-ink sm:text-4xl">
            {STATS.title}
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {STATS.items.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 100} className="text-center">
              <p className="font-pearl-display text-4xl text-pearl-taro sm:text-5xl">
                {stat.value}
              </p>
              <p className="mt-2 text-xs font-bold tracking-[0.08em] text-pearl-muted uppercase">
                {stat.label}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
