'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's own FAQ accordion: a rotating "Plus" glyph per item (the
 * source's own literal `transform: rotate(90deg)` on the open state,
 * confirmed in its compiled CSS), one item open at a time. Only the first
 * item's answer is the source's own verbatim copy — see defaults.ts for why
 * the other four are original.
 */
export default function Faq() {
  const { FAQ } = useContent();
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="py-16 sm:py-24">
      <div className="mx-auto max-w-2xl px-6">
        <Reveal className="text-center">
          {FAQ.eyebrow ? (
            <p className="text-xs font-semibold tracking-[0.28em] text-summit-gold uppercase">
              {FAQ.eyebrow}
            </p>
          ) : null}
          <h2 className="font-summit-display mt-4 text-3xl text-summit-ink sm:text-4xl">
            {FAQ.title}
          </h2>
        </Reveal>

        <div className="mt-10 flex flex-col gap-3">
          {FAQ.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={item.q} delay={i * 60} className="summit-accordion overflow-hidden border border-summit-border bg-summit-surface">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-summit-display text-base text-summit-ink">{item.q}</span>
                  <Plus
                    size={18}
                    className={`shrink-0 text-summit-gold transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen ? (
                  <p className="px-6 pb-5 text-sm leading-relaxed text-summit-muted">{item.a}</p>
                ) : null}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
