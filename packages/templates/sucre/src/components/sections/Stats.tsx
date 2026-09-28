'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's own four-metric band, hand-matched rather than literally
 * ported: the source renders it through a JS-only Framer code component
 * (`data-code-component-plugin-id`), an animated number counter with no
 * static end value in the page's SSR HTML (see defaults.ts's `STATS` note
 * for the literal zeros it server-renders instead). This keeps the band's
 * real layout — a row of numerals in the source's own serif display face,
 * each label beneath in its own rose label colour, separated by thin
 * vertical dividers — with representative figures standing in for the
 * counter's real, unrenderable end state.
 */
export default function Stats() {
  const { STATS } = useContent();

  return (
    <section className="bg-sucre-surface py-14 sm:py-16">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal className="grid grid-cols-2 gap-y-8 sm:grid-cols-4 sm:gap-y-0">
          {STATS.items.map((stat, i) => (
            <div
              key={stat.label}
              className={`flex flex-col items-center gap-2 px-4 text-center ${
                i > 0 ? 'sm:border-l sm:border-sucre-border/60' : ''
              }`}
            >
              <p className="font-sucre-display text-3xl text-sucre-ink sm:text-4xl">{stat.value}</p>
              <p className="text-xs font-semibold tracking-[0.1em] text-sucre-rose uppercase">
                {stat.label}
              </p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
