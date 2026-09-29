'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

export default function Testimonials() {
  const { TESTIMONIALS } = useContent();

  return (
    <section id="testimonials" className="bg-yokai-ink py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.28em] text-yokai-nori uppercase">
            {TESTIMONIALS.eyebrow}
          </p>
          <h2 className="font-yokai-display mt-4 text-4xl text-yokai-paper sm:text-5xl">
            {TESTIMONIALS.title}
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
          {TESTIMONIALS.items.map((t, i) => (
            <Reveal
              key={t.author}
              delay={i * 100}
              className="yokai-frame flex flex-col items-center gap-4 border border-yokai-border bg-yokai-surface px-6 py-8 text-center"
            >
              {t.image ? (
                <div className="yokai-seal relative h-14 w-14 overflow-hidden border-2 border-yokai-lantern">
                  <Image src={t.image} alt={t.author} fill sizes="56px" className="object-cover" />
                </div>
              ) : null}
              <blockquote className="text-base leading-relaxed text-yokai-text">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="text-sm text-yokai-muted">
                <span className="font-semibold text-yokai-lantern">{t.author}</span>
                {t.role ? <span> — {t.role}</span> : null}
              </figcaption>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
