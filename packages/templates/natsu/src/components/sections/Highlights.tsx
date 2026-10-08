'use client';

import { Coffee, Heart, Sparkles, type LucideIcon } from 'lucide-react';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/** Matches the schema's own `icon` field, which names a lucide icon. */
const ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  coffee: Coffee,
  heart: Heart,
};

/**
 * The home + about pages' own "More Than Coffee Is A Daily Ritual" feature
 * band — three short cards, no photos in the source.
 */
export default function Highlights() {
  const { HIGHLIGHTS } = useContent();

  return (
    <section className="bg-natsu-bg py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-natsu-caramel uppercase">
            {HIGHLIGHTS.eyebrow}
          </p>
          <h2 className="font-natsu-display mt-4 text-3xl text-natsu-ink sm:text-4xl">
            {HIGHLIGHTS.title}
          </h2>
          {HIGHLIGHTS.subhead ? (
            <p className="mt-3 text-base text-natsu-muted">{HIGHLIGHTS.subhead}</p>
          ) : null}
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {HIGHLIGHTS.items.map((item, i) => {
            const Icon = ICONS[item.icon] ?? Sparkles;
            return (
              <Reveal
                key={item.title}
                delay={i * 90}
                className="natsu-pill flex flex-col items-center gap-3 border border-natsu-ink/10 bg-natsu-surface px-6 py-9 text-center"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-natsu-caramel/10 text-natsu-caramel">
                  <Icon size={22} strokeWidth={1.6} aria-hidden="true" />
                </span>
                <p className="font-natsu-display text-lg text-natsu-ink">{item.title}</p>
                <p className="text-sm leading-relaxed text-natsu-muted">{item.body}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
