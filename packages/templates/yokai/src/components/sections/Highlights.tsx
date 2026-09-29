'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/** Lucide-style line icons, inlined — matching the schema's own `icon` field, which names a lucide icon. */
const ICONS: Record<string, string> = {
  soup: 'M4 11h16a1 1 0 0 1 1 1 8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8 1 1 0 0 1 1-1ZM8 21h8M7 11c0-2 1-3 1-5s-1-2-1-3M12 11c0-2 1-3 1-5s-1-2-1-3M17 11c0-2 1-3 1-5s-1-2-1-3',
  flame:
    'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5Z',
  chair:
    'M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3M5 9a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2M5 9h14M6 18v3M18 18v3',
  moon: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z',
};

/**
 * A four-item feature band. Rendered back on the page's own `ink` after
 * About's `surface` tone — the same alternating-band rhythm every sibling
 * template uses, except here both tones are dark; each card is a small
 * `surface` tag floating on the `ink` page rather than a full light band.
 */
export default function Highlights() {
  const { HIGHLIGHTS } = useContent();

  return (
    <section className="bg-yokai-ink py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-yokai-gold uppercase">
            {HIGHLIGHTS.eyebrow}
          </p>
          <h2 className="font-yokai-display mt-4 text-3xl text-yokai-paper sm:text-4xl">
            {HIGHLIGHTS.title}
          </h2>
          {HIGHLIGHTS.subhead ? (
            <p className="mt-3 text-base text-yokai-muted">{HIGHLIGHTS.subhead}</p>
          ) : null}
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.items.map((item, i) => (
            <Reveal
              key={item.title}
              delay={i * 90}
              className="yokai-frame flex flex-col items-center gap-3 border border-yokai-border bg-yokai-surface px-5 py-8 text-center"
            >
              <span className="yokai-seal flex h-12 w-12 items-center justify-center bg-yokai-lantern text-yokai-ink">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
                  <path
                    d={ICONS[item.icon] ?? ICONS.soup}
                    stroke="currentColor"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <p className="font-yokai-display text-lg text-yokai-paper">{item.title}</p>
              <p className="text-sm leading-relaxed text-yokai-muted">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
