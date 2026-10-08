'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's own "Elegant treats for everyone" band: three category
 * cards, each a full photo with its name, one-line description and CTA
 * overlaid at the bottom — the source's own real card shape, not a
 * text-only list (kiln) or a numbered row (natsu).
 */
export default function Services() {
  const { SERVICES } = useContent();

  return (
    <section id="treats" className="bg-sucre-bg py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-sucre-rose uppercase">
            {SERVICES.eyebrow}
          </p>
          <h2 className="font-sucre-display mt-4 text-3xl text-sucre-ink sm:text-4xl">
            {SERVICES.title}
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {SERVICES.items.map((item, i) => (
            <Reveal
              key={item.name}
              delay={i * 90}
              className="sucre-card group relative flex aspect-[4/5] flex-col justify-end overflow-hidden"
            >
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="(min-width: 640px) 33vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(112,71,52,0.85)] via-[rgba(112,71,52,0.25)] to-transparent" />
              <div className="relative p-6 text-white">
                <h3 className="font-sucre-display text-xl">{item.name}</h3>
                <p className="mt-2 text-sm text-white/90">{item.body}</p>
                {item.price ? <p className="mt-2 text-sm font-semibold">{item.price}</p> : null}
                <p className="mt-4 text-xs font-semibold tracking-[0.14em] text-sucre-pink-soft uppercase">
                  {item.cta}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
