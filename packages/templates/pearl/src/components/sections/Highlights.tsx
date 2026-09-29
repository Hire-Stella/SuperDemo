'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/** Lucide-style line icons, inlined — matching the schema's own `icon` field, which names a lucide icon. */
const ICONS: Record<string, string> = {
  circle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  leaf: 'M11 20A7 7 0 0 1 4 13c0-4 3-9 10-11 1 5 4 6 4 11a7 7 0 0 1-7 7ZM4.5 14.5c3 1 6 3 7.5 6.5',
  sliders: 'M4 6h10M18 6h2M4 12h2M10 12h10M4 18h10M18 18h2M8 4v4M14 10v4M8 16v4',
  droplet: 'M12 3s6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 6-11 6-11Z',
};

/** A four-item feature band, each card its own coloured "pearl" tag. */
export default function Highlights() {
  const { HIGHLIGHTS } = useContent();

  return (
    <section className="bg-pearl-bg py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-bold tracking-[0.28em] text-pearl-berry uppercase">
            {HIGHLIGHTS.eyebrow}
          </p>
          <h2 className="font-pearl-display mt-4 text-3xl text-pearl-ink sm:text-4xl">
            {HIGHLIGHTS.title}
          </h2>
          {HIGHLIGHTS.subhead ? (
            <p className="mt-3 text-base text-pearl-muted">{HIGHLIGHTS.subhead}</p>
          ) : null}
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.items.map((item, i) => (
            <Reveal
              key={item.title}
              delay={i * 90}
              className="pearl-cup flex flex-col items-center gap-3 border border-pearl-border bg-pearl-surface px-5 py-8 text-center"
            >
              <span className="pearl-pill flex h-12 w-12 items-center justify-center bg-pearl-taro-soft text-white">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
                  <path
                    d={ICONS[item.icon] ?? ICONS.circle}
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <p className="font-pearl-display text-lg text-pearl-ink">{item.title}</p>
              <p className="text-sm leading-relaxed text-pearl-muted">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
