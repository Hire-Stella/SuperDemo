'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The home page's own three attributed guest quotes — "Hear From Coffee
 * Lovers" — each with a real name and location, recovered verbatim.
 */
export default function Testimonials() {
  const { TESTIMONIALS } = useContent();

  return (
    <section id="testimonials" className="bg-natsu-surface py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-natsu-caramel uppercase">
            {TESTIMONIALS.eyebrow}
          </p>
          <h2 className="font-natsu-display mt-4 text-4xl text-natsu-ink sm:text-5xl">
            {TESTIMONIALS.title}
          </h2>
          {TESTIMONIALS.subhead ? (
            <p className="mt-4 text-base text-natsu-muted">{TESTIMONIALS.subhead}</p>
          ) : null}
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {TESTIMONIALS.items.map((t, i) => (
            <Reveal
              key={t.author}
              delay={i * 100}
              className="natsu-soft flex flex-col gap-4 border border-natsu-ink/10 bg-natsu-bg p-7"
            >
              <span aria-hidden="true" className="font-natsu-display text-4xl text-natsu-gold">
                &ldquo;
              </span>
              <blockquote className="flex-1 text-sm leading-relaxed text-natsu-ink">
                {t.quote}
              </blockquote>
              <figcaption className="text-xs text-natsu-muted">
                <span className="font-semibold text-natsu-caramel">{t.author}</span>
                {t.role ? <span> — {t.role}</span> : null}
              </figcaption>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
