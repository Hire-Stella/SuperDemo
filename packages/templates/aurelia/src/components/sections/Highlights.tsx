'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/** Lucide-style line icons, inlined — matching the schema's own `icon` field, which names a lucide icon. */
const ICONS: Record<string, string> = {
  'chef-hat': 'M6 13a5 5 0 0 1 1-9.9A5 5 0 0 1 12 2a5 5 0 0 1 5 1.1A5 5 0 0 1 18 13v6H6zM6 19h12',
  'cup-soda':
    'M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8ZM7 8 9 2h6l2 6M9 12l1 5M15 12l-1 5',
  'cake-slice': 'M2 21h20M4 21V13a8 8 0 0 1 16 0v8M12 5V3M9 5c0-1 1-2 1-3M15 5c0-1-1-2-1-3M4 13h16',
};

/**
 * The about-us page's own "What We Offer You!" triad — three short feature
 * cards, each an icon and a one-sentence body, no photos in the source.
 * Rendered on a dark band for rhythm against the light About/Services bands
 * either side of it.
 */
export default function Highlights() {
  const { HIGHLIGHTS } = useContent();

  return (
    <section className="bg-aurelia-ink py-16 text-white sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-lg text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-aurelia-gold uppercase">
            {HIGHLIGHTS.eyebrow}
          </p>
          <h2 className="font-aurelia-display mt-4 text-3xl sm:text-4xl">{HIGHLIGHTS.title}</h2>
          {HIGHLIGHTS.subhead ? (
            <p className="mt-3 text-base text-white/70">{HIGHLIGHTS.subhead}</p>
          ) : null}
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {HIGHLIGHTS.items.map((item, i) => (
            <Reveal
              key={item.title}
              delay={i * 100}
              className="aurelia-card flex flex-col items-center gap-3 border border-white/10 bg-white/5 px-6 py-8 text-center"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-aurelia-gold/15 text-aurelia-gold">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
                  <path
                    d={ICONS[item.icon] ?? ICONS['chef-hat']}
                    stroke="currentColor"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <p className="font-aurelia-display text-xl">{item.title}</p>
              <p className="text-sm leading-relaxed text-white/70">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
