'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The menu — six dish cards on `paper`-coloured tags, floating on the dark
 * `surface` band rather than sitting in a plain light section the way
 * every sibling template's own menu grid does. The photo keeps this
 * template's diagonal "tag" frame; the card around it does too, at a
 * slightly larger radius, so a whole card reads as one paper ticket rather
 * than a frame pinned to a plain rectangle.
 */
export default function Services() {
  const { SERVICES } = useContent();

  return (
    <section id="menu" className="bg-yokai-surface py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-yokai-nori uppercase">
            {SERVICES.eyebrow}
          </p>
          <h2 className="font-yokai-display mt-4 text-4xl text-yokai-paper sm:text-5xl">
            {SERVICES.title}
          </h2>
          <p className="mt-4 text-base text-yokai-muted">{SERVICES.subhead}</p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.items.map((item, i) => (
            <Reveal
              key={item.number}
              delay={(i % 3) * 100}
              className="yokai-frame overflow-hidden border border-yokai-border bg-yokai-paper"
            >
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col gap-1 p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-yokai-display text-xl text-yokai-ink">{item.name}</h3>
                  {item.price ? (
                    <span className="text-sm font-semibold text-yokai-lantern">{item.price}</span>
                  ) : null}
                </div>
                <span className="text-xs font-semibold tracking-[0.16em] text-yokai-muted-paper">
                  {item.number}
                </span>
                <p className="mt-2 text-sm leading-relaxed text-yokai-muted-paper">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
