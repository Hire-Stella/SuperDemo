'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The home page's own six-photo collage next to its "About" teaser — real
 * photos, recovered from the source's own `data-framer-name="Image 01"`
 * through `"Image 06"` layers.
 */
export default function Gallery() {
  const { GALLERY } = useContent();

  return (
    <section id="gallery" className="bg-natsu-surface py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-lg text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-natsu-caramel uppercase">
            {GALLERY.eyebrow}
          </p>
          <h2 className="font-natsu-display mt-4 text-4xl text-natsu-ink sm:text-5xl">
            {GALLERY.title}
          </h2>
          <p className="mt-4 text-base text-natsu-muted">{GALLERY.subhead}</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {GALLERY.images.map((image, i) => (
            <Reveal
              key={image.src}
              delay={(i % 3) * 90}
              className="natsu-soft relative aspect-square overflow-hidden"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(min-width: 640px) 33vw, 50vw"
                className="object-cover"
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
