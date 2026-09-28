'use client';

import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's own five-question accordion, copied verbatim. The source's
 * accordion is a JS-only Framer interaction with no static open/closed
 * markup difference in its SSR HTML — hand-matched here as a plain
 * `<details>`-free, state-driven accordion using the same chevron-rotate
 * affordance the source's own button icon implies.
 */
export default function Faq() {
  const { FAQ } = useContent();
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <section className="bg-sucre-surface py-20 sm:py-28">
      <div className="mx-auto max-w-2xl px-6">
        <Reveal className="text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-sucre-rose uppercase">
            {FAQ.eyebrow}
          </p>
          <h2 className="font-sucre-display mt-4 text-3xl text-sucre-ink sm:text-4xl">
            Frequently asked
          </h2>
        </Reveal>

        <div className="mt-10 flex flex-col gap-3">
          {FAQ.items.map((item, i) => {
            const isOpen = open === i;
            const panelId = `${baseId}-panel-${i}`;
            return (
              <Reveal key={item.q} delay={i * 60} className="sucre-card bg-sucre-bg">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span className="font-sucre-display text-base text-sucre-ink">{item.q}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-sucre-pink transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                <div
                  id={panelId}
                  className={`overflow-hidden px-6 text-sm leading-relaxed text-sucre-muted transition-all duration-300 ${
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
