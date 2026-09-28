'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The about page's own "Numbers Behind The Cup" counter band. The source
 * animates each number up from 0 with a JS code component and never puts
 * the target value in static HTML — see defaults.ts for how these four
 * values were hand-matched instead of scraped. Rendered on the source's
 * own ink-brown, the one dark band this port adds for rhythm (see
 * theme.css for why it reuses that colour rather than an unmeasured one).
 */
export default function Stats() {
  const { STATS } = useContent();

  return (
    <section className="bg-natsu-ink py-16 text-natsu-bg sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-natsu-gold uppercase">
            {STATS.eyebrow}
          </p>
          <h2 className="font-natsu-display mt-4 text-3xl sm:text-4xl">{STATS.title}</h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {STATS.items.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 90} className="text-center">
              <p className="font-natsu-display text-4xl sm:text-5xl">{stat.value}</p>
              <p className="mt-2 text-xs leading-relaxed text-natsu-bg/70">{stat.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
