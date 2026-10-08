'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/** Lucide-style line icons, inlined — matching the schema's own `icon` field, which names a lucide icon. */
const ICONS: Record<string, string> = {
  utensils: 'M6 2v8a2 2 0 0 0 4 0V2M8 10v12M14 2v20M18 2c-2 2-2 6 0 8v12',
  users:
    'M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM21 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  home: 'M3 11l9-8 9 8M5 10v10h14V10',
  'badge-check':
    'M12 2l2.4 1.4 2.7-.4 1.2 2.4 2.4 1.2-.4 2.7L22 12l-1.7 2.4.4 2.7-2.4 1.2-1.2 2.4-2.7-.4L12 22l-2.4-1.4-2.7.4-1.2-2.4-2.4-1.2.4-2.7L2 12l1.7-2.4-.4-2.7 2.4-1.2 1.2-2.4 2.7.4L12 2ZM8.5 12.5l2.5 2.5 5-5',
};

/**
 * The home page's own "Discover Bold & Truly Authentic Mexzo" feature
 * band — four short points, no photos in the source. Rendered on the
 * source's own literal dark cactus-green band (`rgb(15,28,2)`) for rhythm
 * against the light About/Services bands either side of it.
 */
export default function Highlights() {
  const { HIGHLIGHTS } = useContent();

  return (
    <section className="bg-brasa-dark py-16 text-white sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-brasa-marigold uppercase">
            {HIGHLIGHTS.eyebrow}
          </p>
          <h2 className="font-brasa-display mt-4 text-3xl sm:text-4xl">{HIGHLIGHTS.title}</h2>
          {HIGHLIGHTS.subhead ? (
            <p className="mt-3 text-base text-white/70">{HIGHLIGHTS.subhead}</p>
          ) : null}
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.items.map((item, i) => (
            <Reveal
              key={item.title}
              delay={i * 90}
              className="brasa-frame flex flex-col items-center gap-3 border-2 border-white/15 bg-white/5 px-5 py-8 text-center"
            >
              <span className="brasa-circle flex h-12 w-12 items-center justify-center bg-brasa-marigold text-brasa-ink">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
                  <path
                    d={ICONS[item.icon] ?? ICONS.utensils}
                    stroke="currentColor"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <p className="font-brasa-display text-lg">{item.title}</p>
              <p className="text-sm leading-relaxed text-white/70">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
