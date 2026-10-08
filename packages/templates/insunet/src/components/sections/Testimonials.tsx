'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's own testimonial band, re-attributed to individual
 * policyholders rather than the source's own real, trademarked corporate
 * names (see defaults.ts's `TESTIMONIALS` note on why). No star ratings:
 * the source shows none anywhere in this band's markup.
 */
export default function Testimonials() {
  const { TESTIMONIALS } = useContent();

  return (
    <section className="bg-insunet-surface py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold tracking-[0.24em] text-insunet-teal uppercase">
            {TESTIMONIALS.eyebrow}
          </p>
          <h2 className="font-insunet-display mt-4 text-3xl text-insunet-ink sm:text-4xl">
            {TESTIMONIALS.title}
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.items.map((item, i) => (
            <Reveal
              key={item.author}
              delay={(i % 3) * 90}
              className="insunet-card flex flex-col gap-4 bg-white p-7"
            >
              <p className="text-sm leading-relaxed text-insunet-muted">&ldquo;{item.quote}&rdquo;</p>
              <div className="mt-auto flex items-center gap-3 pt-2">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-insunet-surface">
                  <Image
                    src={item.image}
                    alt={item.author}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-insunet-display text-sm text-insunet-ink">{item.author}</p>
                  <p className="text-xs text-insunet-muted">{item.role}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
