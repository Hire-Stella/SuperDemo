'use client';

import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's own five-question accordion from its `/contact` route,
 * copied verbatim (see defaults.ts's `FAQ` note on the one literal answer
 * the source's SSR HTML actually renders, and the mismatch this port fixes
 * in it). The source's accordion is a JS-only Framer interaction with no
 * static open/closed markup difference beyond its first item — hand-matched
 * here as a plain state-driven accordion using the same chevron-rotate
 * affordance the source's own button icon implies.
 */
export default function Faq() {
  const { FAQ } = useContent();
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <section className="bg-insunet-surface py-20 sm:py-28">
      <div className="mx-auto max-w-2xl px-6">
        <Reveal className="text-center">
          <p className="text-xs font-semibold tracking-[0.24em] text-insunet-teal uppercase">
            {FAQ.eyebrow}
          </p>
          <h2 className="font-insunet-display mt-4 text-3xl text-insunet-ink sm:text-4xl">
            {FAQ.title}
          </h2>
        </Reveal>

        <div className="mt-10 flex flex-col gap-3">
          {FAQ.items.map((item, i) => {
            const isOpen = open === i;
            const panelId = `${baseId}-panel-${i}`;
            return (
              <Reveal
                key={item.q}
                delay={i * 60}
                className="insunet-card border border-insunet-border/60 bg-white"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span className="font-insunet-display text-base text-insunet-ink">{item.q}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-insunet-primary transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                <div
                  id={panelId}
                  className={`overflow-hidden px-6 text-sm leading-relaxed text-insunet-muted transition-all duration-300 ${
                    isOpen ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  {item.a}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
