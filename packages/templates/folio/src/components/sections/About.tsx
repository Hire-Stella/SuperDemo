'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's "Hours Preview White" panel — in the live site a narrow
 * white column running beside the hero photo rather than a band of its
 * own. Ported here as a full-width section (this contract stacks bands
 * rather than splitting the hero two-up): a blue "Visit Us" eyebrow, the
 * giant auto-fit "Opening Times" headline (rendered at a literal 212px in
 * the source's own SSR HTML — approximated here with a `clamp()` so it
 * keeps scaling the way the source's own auto-fit text box did), the full
 * seven-day hours table with its own literal row rule, and the source's
 * two-line caption row underneath it.
 */
export default function About() {
  const { ABOUT } = useContent();

  return (
    <section id="hours" className="bg-folio-white py-20 sm:py-28">
      <div className="mx-auto flex max-w-xl flex-col items-center px-6 text-center">
        <Reveal className="flex flex-col items-center">
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="folio-pulse h-1.5 w-1.5 rounded-full bg-folio-accent"
            />
            <p className="font-folio-display text-[10px] text-folio-accent uppercase">
              {ABOUT.eyebrow}
            </p>
          </span>
          <h2
            className="font-folio-display mt-3 text-folio-accent uppercase"
            style={{ fontSize: 'clamp(2.75rem, 11vw, 6.5rem)' }}
          >
            {ABOUT.heading}
          </h2>
        </Reveal>

        {ABOUT.paragraphs.length > 0 ? (
          <Reveal className="mt-6 max-w-md">
            {ABOUT.paragraphs.map((p) => (
              <p key={p} className="text-sm text-folio-ink/80">
                {p}
              </p>
            ))}
          </Reveal>
        ) : null}

        <Reveal className="mt-10 w-full" delay={80}>
          <ul className="flex w-full flex-col">
            {ABOUT.hours.map((row) => (
              <li
                key={row.label}
                className="folio-rule flex items-baseline justify-between gap-4 py-2.5 text-xs text-folio-accent uppercase"
              >
                <span>{row.label}</span>
                <span>{row.value}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        {ABOUT.captions.length > 0 ? (
          <Reveal className="mt-6 flex w-full items-baseline justify-between gap-4" delay={140}>
            {ABOUT.captions.map((c) => (
              <span key={c} className="text-[10px] text-folio-accent uppercase">
                {c}
              </span>
            ))}
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
