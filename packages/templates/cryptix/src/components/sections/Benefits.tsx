'use client';

import { ShieldCheck, Zap, Percent, Sparkles, type LucideIcon } from 'lucide-react';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/** Matches the schema's own `icon` field, which names a lucide icon. */
const ICONS: Record<string, LucideIcon> = {
  'shield-check': ShieldCheck,
  zap: Zap,
  percent: Percent,
  sparkles: Sparkles,
};

/**
 * The source's "BENEFITS / Why Choose Cryptix?" band: four small icon
 * pillars — the schema's own `highlights` array feeds this one (see
 * content.ts's `adapt()`), since its heading is the source's own real
 * business-name mention.
 */
export default function Benefits() {
  const { BENEFITS } = useContent();

  return (
    <section className="bg-cryptix-bg py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-cryptix-link uppercase">
            {BENEFITS.eyebrow}
          </p>
          <h2 className="font-cryptix-display mt-4 text-3xl text-cryptix-ink sm:text-4xl">{BENEFITS.title}</h2>
          {BENEFITS.subhead ? (
            <p className="mt-4 text-base text-cryptix-muted">{BENEFITS.subhead}</p>
          ) : null}
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.items.map((item, i) => {
            const Icon = ICONS[item.icon] ?? Sparkles;
            return (
              <Reveal
                key={item.title}
                delay={i * 90}
                className="cryptix-card flex flex-col gap-3 border border-cryptix-border bg-cryptix-surface p-6"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cryptix-accent/10 text-cryptix-accent">
                  <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <h3 className="font-cryptix-display text-base text-cryptix-ink">{item.title}</h3>
                <p className="text-sm leading-relaxed text-cryptix-muted">{item.body}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
