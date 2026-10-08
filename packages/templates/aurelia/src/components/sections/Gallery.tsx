'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The "Flavor Gallery" — a jewel-box collage rather than tavola's evenly
 * cropped grid or a single hero-plus-strip: two photos run tall across two
 * rows on a four-column desktop grid, the rest sit square, so the band
 * reads as an uneven wall of framed photos rather than a uniform tile set.
 */
export default function Gallery() {
  const { GALLERY } = useContent();
  const tall = new Set([0, 5]);

  return (
    <section id="gallery" className="bg-aurelia-bg py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-lg text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-aurelia-accent uppercase">
            {GALLERY.eyebrow}
          </p>
          <h2 className="font-aurelia-display mt-4 text-4xl text-aurelia-ink sm:text-5xl">
            {GALLERY.title}
          </h2>
          <p className="mt-4 text-base text-aurelia-muted">{GALLERY.subhead}</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:auto-rows-[9rem] sm:gap-4">
          {GALLERY.images.map((image, i) => (
            <Reveal
              key={image.src}
              delay={(i % 4) * 80}
              className={`aurelia-card relative overflow-hidden ${
                tall.has(i) ? 'aspect-square sm:row-span-2 sm:aspect-auto' : 'aspect-square'
              }`}
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
