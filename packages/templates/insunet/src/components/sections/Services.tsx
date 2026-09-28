'use client';

import { Calculator, Car, Heart, Plane, ShieldCheck, Stethoscope, type LucideIcon } from 'lucide-react';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's own six coverage categories, copied verbatim for name and
 * number (see defaults.ts's `SERVICES` note on why each description is
 * original rather than the source's own broken, copy-pasted paragraph). A
 * plain numbered card grid — the source's own real layout for this band,
 * one icon per category standing in for the source's own per-card
 * illustration.
 */
const ICONS: LucideIcon[] = [Heart, Stethoscope, Car, Calculator, ShieldCheck, Plane];

export default function Services() {
  const { SERVICES } = useContent();

  return (
    <section id="coverage" className="bg-insunet-bg py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold tracking-[0.24em] text-insunet-teal uppercase">
            {SERVICES.eyebrow}
          </p>
          <h2 className="font-insunet-display mt-4 text-3xl text-insunet-ink sm:text-4xl">
            {SERVICES.title}
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.items.map((item, i) => {
            const Icon = ICONS[i % ICONS.length] ?? Heart;
            return (
              <Reveal
                key={item.name}
                delay={(i % 3) * 90}
                className="insunet-card flex flex-col gap-4 border border-insunet-border/60 bg-white p-7"
              >
                <div className="flex items-center justify-between">
                  <span className="insunet-pill flex h-11 w-11 items-center justify-center bg-insunet-primary/10 text-insunet-primary">
                    <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span className="font-insunet-display text-sm text-insunet-muted">
                    {item.number}
                  </span>
                </div>
                <h3 className="font-insunet-display text-lg text-insunet-ink">{item.name}</h3>
                <p className="text-sm leading-relaxed text-insunet-muted">{item.body}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
