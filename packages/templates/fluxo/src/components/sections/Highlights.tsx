'use client';

import { CreditCard, Mail, Sparkles, TrendingUp, type LucideIcon } from 'lucide-react';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/** Matches the schema's own `icon` field, which names a lucide icon. */
const ICONS: Record<string, LucideIcon> = {
  'credit-card': CreditCard,
  'trending-up': TrendingUp,
  mail: Mail,
};

/**
 * The source's own three-card feature intro: "Accept payments", "Track
 * finances", "Email marketing" — a plain icon-and-copy grid, no photos in
 * the source at this size (the source's own equivalent photos are the
 * bigger mockups ported in `Services.tsx` below).
 */
export default function Highlights() {
  const { HIGHLIGHTS } = useContent();

  return (
    <section id="highlights" className="bg-fluxo-bg py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold tracking-[0.16em] text-fluxo-accent uppercase">
            {HIGHLIGHTS.eyebrow}
          </p>
          <h2 className="font-fluxo-display mt-4 text-3xl text-fluxo-ink sm:text-4xl">
            {HIGHLIGHTS.title}
          </h2>
          {HIGHLIGHTS.subhead ? (
            <p className="mt-3 text-base text-fluxo-muted">{HIGHLIGHTS.subhead}</p>
          ) : null}
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {HIGHLIGHTS.items.map((item, i) => {
            const Icon = ICONS[item.icon] ?? Sparkles;
            return (
              <Reveal
                key={item.title}
                delay={i * 90}
                className="fluxo-card flex flex-col gap-4 border border-fluxo-border bg-fluxo-surface p-7"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-fluxo-primary text-white">
                  <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <p className="font-fluxo-display text-lg text-fluxo-ink">{item.title}</p>
                <p className="text-sm leading-relaxed text-fluxo-muted">{item.body}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
