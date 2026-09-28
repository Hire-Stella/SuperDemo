'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's own "Performance You Can Measure" band: three literal
 * metrics, set in the mono face reserved for numerals across this template
 * (see theme.css).
 */
export default function Stats() {
  const { STATS } = useContent();

  return (
    <section className="border-y border-white/10 bg-white/[0.03] py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-6">
        {STATS.title ? (
          <Reveal className="text-center">
            <h2 className="font-summit-display text-2xl text-summit-ink sm:text-3xl">
              {STATS.title}
            </h2>
          </Reveal>
        ) : null}

        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {STATS.items.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 90} className="text-center">
              <p className="font-summit-mono text-4xl text-summit-gold sm:text-5xl">{stat.value}</p>
              <p className="mt-2 text-sm text-summit-muted">{stat.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
