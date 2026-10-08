'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's "Bean's" band: a single featured single-origin bean, one
 * tasting note, one photo — kept as one feature rather than padded to a
 * three-card grid, since the source itself never names a second bean. Set
 * on the literal off-white section alternate (`rgb(246,246,246)`) for
 * rhythm against the pure-white bands either side of it.
 */
export default function Highlights() {
  const { HIGHLIGHTS } = useContent();
  const item = HIGHLIGHTS.items[0];
  if (!item) return null;

  return (
    <section id="beans" className="bg-kiln-surface py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.28em] text-kiln-faint uppercase">
            {HIGHLIGHTS.eyebrow}
          </p>
          <h2 className="font-kiln-display mt-4 text-3xl text-kiln-ink uppercase sm:text-4xl">
            {item.title}
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-kiln-muted">{item.body}</p>
        </Reveal>

        <Reveal delay={100} className="kiln-card relative aspect-square overflow-hidden">
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </Reveal>
      </div>
    </section>
  );
}
