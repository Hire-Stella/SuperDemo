'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * A straight, uniform Swiss grid — every tile the same square, tight
 * gutters, no uneven spans — this port's own stand-in for the source's
 * "Ideas" blog thumbnails and its wider editorial coffee-culture
 * photography (see defaults.ts). Deliberately not aurelia's uneven
 * jewel-box collage: a flat, gridded wall of photos matching this
 * template's own restrained corner language.
 */
export default function Gallery() {
  const { GALLERY } = useContent();

  return (
    <section className="bg-kiln-bg py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-kiln-faint uppercase">
            {GALLERY.eyebrow}
          </p>
          <h2 className="font-kiln-display mt-4 text-4xl text-kiln-ink uppercase sm:text-5xl">
            {GALLERY.title}
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {GALLERY.images.map((image, i) => (
            <Reveal
              key={image.src}
              delay={(i % 5) * 60}
              className="kiln-card relative aspect-square overflow-hidden"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(min-width: 640px) 20vw, 50vw"
                className="object-cover"
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
