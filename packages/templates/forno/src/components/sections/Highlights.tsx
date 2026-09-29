'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/** A plain pin glyph — the source's own location markers are icon-only, no third-party set needed. */
function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path
        d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.4" stroke="currentColor" strokeWidth={1.8} />
    </svg>
  );
}

/**
 * The source's "Find Your Nearest Pizza Spot" location finder — five
 * storefronts, each a plain "View map" link. Rendered on the shared
 * `highlights` slot: tavola's source used that slot for review badges,
 * this one for locations, which is exactly the point of a slot rather
 * than a fixed section.
 */
export default function Highlights() {
  const { LOCATIONS } = useContent();

  return (
    <section id="locations" className="bg-forno-bg py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-lg text-center">
          <p className="text-xs font-bold tracking-[0.22em] text-forno-red uppercase">
            {LOCATIONS.eyebrow}
          </p>
          <h2 className="font-forno-display mt-4 text-3xl text-forno-ink sm:text-4xl">
            {LOCATIONS.title}
          </h2>
          <p className="mt-3 text-base text-forno-muted">{LOCATIONS.subhead}</p>
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {LOCATIONS.items.map((item, i) => (
            <Reveal
              key={item.title}
              delay={(i % 5) * 80}
              className="forno-card flex flex-col items-center gap-2 border border-forno-border bg-forno-surface px-4 py-7 text-center"
            >
              <span className="text-forno-red">
                <PinIcon />
              </span>
              <p className="font-forno-display text-lg text-forno-ink">{item.title}</p>
              <p className="text-xs font-semibold tracking-[0.06em] text-forno-muted uppercase">
                {item.body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
