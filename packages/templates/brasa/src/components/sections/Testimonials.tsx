'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source carries exactly one named guest quote (see defaults.ts) — kept
 * as one, rather than padded out to match a sibling template's three.
 */
export default function Testimonials() {
  const { TESTIMONIALS } = useContent();

  return (
    <section id="testimonials" className="bg-brasa-dark py-20 text-white sm:py-28">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.28em] text-brasa-marigold uppercase">
            {TESTIMONIALS.eyebrow}
          </p>
          <h2 className="font-brasa-display mt-4 text-4xl sm:text-5xl">{TESTIMONIALS.title}</h2>
        </Reveal>

        <div className="mt-12 flex flex-col items-center gap-8">
          {TESTIMONIALS.items.map((t) => (
            <Reveal key={t.author} className="flex flex-col items-center gap-4">
              <span
                aria-hidden="true"
                className="font-brasa-display text-6xl leading-none text-brasa-marigold"
              >
                &ldquo;
              </span>
              <blockquote className="max-w-2xl text-xl leading-relaxed">{t.quote}</blockquote>
              <figcaption className="text-sm text-white/70">
                <span className="font-semibold text-brasa-marigold">{t.author}</span>
                {t.role ? <span> — {t.role}</span> : null}
              </figcaption>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
