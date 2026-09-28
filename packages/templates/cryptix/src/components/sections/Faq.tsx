'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's "COMMON QUESTIONS" accordion — its answer text was collapsed
 * at crawl time (see defaults.ts's `FAQ` note on the original answer copy
 * written for this port). Wired here as a real single-open accordion.
 */
export default function Faq() {
  const { FAQ } = useContent();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-cryptix-surface/40 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal className="text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-cryptix-link uppercase">{FAQ.eyebrow}</p>
          <h2 className="font-cryptix-display mt-4 text-3xl text-cryptix-ink sm:text-4xl">{FAQ.title}</h2>
          {FAQ.subhead ? <p className="mt-4 text-base text-cryptix-muted">{FAQ.subhead}</p> : null}
        </Reveal>

        <div className="mt-12 flex flex-col gap-3">
          {FAQ.items.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <Reveal
                key={item.q}
                delay={i * 60}
                className="cryptix-card overflow-hidden border border-cryptix-border bg-cryptix-bg"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="text-sm font-semibold text-cryptix-ink sm:text-base">{item.q}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-cryptix-faint transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen ? (
                  <p className="px-6 pb-5 text-sm leading-relaxed text-cryptix-muted">{item.a}</p>
                ) : null}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
