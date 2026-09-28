'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's own "Easier & Smarter" intro band — one eyebrow, one
 * heading, one line of body copy — that sits directly above the four-card
 * highlights grid below it. Falls back to nothing but its own copy when a
 * tenant supplies no `about` content, since the schema treats a missing
 * `about` as "keep the template's own" rather than "render nothing" (see
 * content.ts).
 */
export default function About() {
  const { ABOUT } = useContent();

  return (
    <section id="features" className="pt-16 pb-4 sm:pt-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          {ABOUT.eyebrow ? (
            <p className="text-xs font-semibold tracking-[0.28em] text-summit-gold uppercase">
              {ABOUT.eyebrow}
            </p>
          ) : null}
          {ABOUT.heading ? (
            <h2 className="font-summit-display mt-4 text-3xl text-summit-ink sm:text-4xl">
              {ABOUT.heading}
            </h2>
          ) : null}
          {ABOUT.paragraphs.map((p) => (
            <p key={p} className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-summit-muted">
              {p}
            </p>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
