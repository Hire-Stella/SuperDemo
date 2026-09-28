'use client';

import { Star } from 'lucide-react';
import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's own "Loved by every sweet tooth" band: three reviews, each
 * with its own real star count (5, 4, 5 — not a flat five across the
 * board), a reviewer photo, and the specific treat each reviewer names.
 */
export default function Testimonials() {
  const { TESTIMONIALS } = useContent();

  return (
    <section className="bg-sucre-surface py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-sucre-rose uppercase">
            {TESTIMONIALS.eyebrow}
          </p>
          <h2 className="font-sucre-display mt-4 text-3xl text-sucre-ink sm:text-4xl">
            {TESTIMONIALS.title} {TESTIMONIALS.titleLine2}
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {TESTIMONIALS.items.map((item, i) => (
            <Reveal
              key={item.author}
              delay={i * 90}
              className="sucre-card flex flex-col gap-4 bg-sucre-bg p-7"
            >
              <div className="flex gap-0.5 text-sucre-gold">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star
                    key={s}
                    size={15}
                    fill={s < item.stars ? 'currentColor' : 'none'}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-sucre-muted">&ldquo;{item.quote}&rdquo;</p>
              <div className="mt-auto flex items-center gap-3 pt-2">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
                  <Image
                    src={item.image}
                    alt={item.author}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-sucre-display text-sm text-sucre-ink">{item.author}</p>
                  <p className="text-xs text-sucre-rose">{item.role}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
