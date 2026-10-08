'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * A plain grid of photos directly on the dark page, each keeping this
 * template's own diagonal "tag" frame — unlike Services' paper-card
 * treatment, nothing here is mounted on a light card, so the alley-at-night
 * and counter-interior shots read as photos on a wall, not menu tickets.
 */
export default function Gallery() {
  const { GALLERY } = useContent();

  return (
    <section id="gallery" className="bg-yokai-ink py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-lg text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-yokai-nori uppercase">
            {GALLERY.eyebrow}
          </p>
          <h2 className="font-yokai-display mt-4 text-4xl text-yokai-paper sm:text-5xl">
            {GALLERY.title}
          </h2>
          <p className="mt-4 text-base text-yokai-muted">{GALLERY.subhead}</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {GALLERY.images.map((image, i) => (
            <Reveal
              key={image.src}
              delay={(i % 4) * 80}
              className="yokai-frame relative aspect-square overflow-hidden border border-yokai-border"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(min-width: 640px) 25vw, 50vw"
                className="object-cover"
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
