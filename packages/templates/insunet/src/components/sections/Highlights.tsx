'use client';

import { Headset, SlidersHorizontal, Zap, type LucideIcon } from 'lucide-react';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/** Matches the schema's own `icon` field, which names a lucide icon. */
const ICONS: Record<string, LucideIcon> = {
  headset: Headset,
  zap: Zap,
  'sliders-horizontal': SlidersHorizontal,
};

/**
 * The source's own "Brief explanations of each feature" band: three
 * benefit badges, each with a small custom illustration in the source —
 * stood in here with the closest lucide glyphs rather than porting three
 * one-off decorative graphics for a single small icon each.
 */
export default function Highlights() {
  const { HIGHLIGHTS } = useContent();

  return (
    <section className="bg-insunet-surface py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="text-xs font-semibold tracking-[0.24em] text-insunet-teal uppercase">
              {HIGHLIGHTS.eyebrow}
            </p>
            <h2 className="font-insunet-display mt-4 text-3xl text-insunet-ink sm:text-4xl">
              {HIGHLIGHTS.title}
            </h2>
            {HIGHLIGHTS.subhead ? (
              <p className="mt-4 max-w-md text-base leading-relaxed text-insunet-muted">
                {HIGHLIGHTS.subhead}
              </p>
            ) : null}
          </Reveal>

          <div className="flex flex-col gap-5">
            {HIGHLIGHTS.items.map((item, i) => {
              const Icon = ICONS[item.icon] ?? Headset;
              return (
                <Reveal
                  key={item.title}
                  delay={i * 90}
                  className="insunet-card flex items-start gap-4 border border-insunet-border/60 bg-white p-5"
                >
                  <span className="insunet-pill flex h-11 w-11 shrink-0 items-center justify-center bg-insunet-teal/10 text-insunet-teal">
                    <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-insunet-display text-base text-insunet-ink">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-insunet-muted">{item.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
