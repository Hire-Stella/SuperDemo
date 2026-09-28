'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's own quote band is a JS slideshow (`framer-slideshow-component`
 * in its compiled bundle) with no per-quote photo in the static markup —
 * hand-matched here as a stacked, alternating-alignment list with a large
 * decorative quotation mark, rather than porting a bespoke carousel or
 * reusing forno's horizontal scroll-snap row.
 */
export default function Testimonials() {
  const { TESTIMONIALS } = useContent();

  return (
    <section id="testimonials" className="bg-aurelia-bg py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-6">
        <Reveal className="mx-auto max-w-lg text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-aurelia-accent uppercase">
            {TESTIMONIALS.eyebrow}
          </p>
          <h2 className="font-aurelia-display mt-4 text-4xl text-aurelia-ink sm:text-5xl">
            {TESTIMONIALS.title}
          </h2>
        </Reveal>

        <div className="mt-14 flex flex-col gap-10">
          {TESTIMONIALS.items.map((t, i) => (
            <Reveal
              key={t.author}
              delay={i * 100}
              className={`flex flex-col gap-3 ${i % 2 === 1 ? 'sm:items-end sm:text-right' : 'sm:items-start sm:text-left'}`}
            >
              <span
                aria-hidden="true"
                className="font-aurelia-display text-6xl leading-none text-aurelia-gold/50"
              >
                &ldquo;
              </span>
              <blockquote className="max-w-2xl text-xl leading-relaxed text-aurelia-ink">
                {t.quote}
              </blockquote>
              <figcaption className="text-sm text-aurelia-muted">
                <span className="font-semibold text-aurelia-plum">{t.author}</span>
                {t.role ? <span> — {t.role}</span> : null}
              </figcaption>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
