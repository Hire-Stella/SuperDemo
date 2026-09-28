'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

export default function Testimonials() {
  const { TESTIMONIALS } = useContent();

  return (
    <section id="testimonials" className="bg-pearl-bg py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <Reveal>
          <p className="text-xs font-bold tracking-[0.28em] text-pearl-berry uppercase">
            {TESTIMONIALS.eyebrow}
          </p>
          <h2 className="font-pearl-display mt-4 text-4xl text-pearl-ink sm:text-5xl">
            {TESTIMONIALS.title}
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {TESTIMONIALS.items.map((t, i) => (
            <Reveal
              key={t.author}
              delay={i * 100}
              className="pearl-cup flex flex-col items-center gap-4 border border-pearl-border bg-pearl-surface px-6 py-8 text-center"
            >
              <blockquote className="text-sm leading-relaxed text-pearl-ink">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="text-sm text-pearl-muted">
                <span className="font-bold text-pearl-taro">{t.author}</span>
                {t.role ? <span> — {t.role}</span> : null}
              </figcaption>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
