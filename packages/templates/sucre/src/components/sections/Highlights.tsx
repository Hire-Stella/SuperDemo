'use client';

import { Flame, Heart, Smile, Wheat, type LucideIcon } from 'lucide-react';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/** Matches the schema's own `icon` field, which names a lucide icon. */
const ICONS: Record<string, LucideIcon> = {
  heart: Heart,
  wheat: Wheat,
  flame: Flame,
  smile: Smile,
};

/**
 * The source's own "Why us" band: four benefit pillars, each with a small
 * custom illustration in the source — stood in here with the closest lucide
 * glyphs rather than porting four one-off decorative graphics for a single
 * small icon each (see defaults.ts's `HIGHLIGHTS` note).
 */
export default function Highlights() {
  const { HIGHLIGHTS } = useContent();

  return (
    <section className="bg-sucre-surface py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-sucre-rose uppercase">
            {HIGHLIGHTS.eyebrow}
          </p>
          <h2 className="font-sucre-display mt-4 text-3xl text-sucre-ink sm:text-4xl">
            {HIGHLIGHTS.title} {HIGHLIGHTS.titleLine2}
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.items.map((item, i) => {
            const Icon = ICONS[item.icon] ?? Heart;
            return (
              <Reveal
                key={item.title}
                delay={i * 90}
                className="sucre-card flex flex-col items-center gap-3 bg-sucre-bg px-6 py-9 text-center"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sucre-pink/10 text-sucre-pink">
                  <Icon size={22} strokeWidth={1.6} aria-hidden="true" />
                </span>
                <p className="font-sucre-display text-lg text-sucre-ink">{item.title}</p>
                <p className="text-sm leading-relaxed text-sucre-muted">{item.body}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
