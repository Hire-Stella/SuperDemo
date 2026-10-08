'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The schema has no dedicated "social feed" section, so the source's own
 * "From our kitchen to your feed" Instagram strip — one cupcake photo, one
 * macaron photo and three portrait Instagram Stories frames — is ported
 * here as this contract's gallery (see defaults.ts's `GALLERY` note). The
 * three taller Stories frames get a taller tile than the two square photos,
 * matching the source's own mixed aspect ratios rather than forcing every
 * tile into one square grid.
 */
export default function Gallery() {
  const { GALLERY } = useContent();

  return (
    <section className="bg-sucre-bg py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-sucre-rose uppercase">
            {GALLERY.eyebrow}
          </p>
          <h2 className="font-sucre-display mt-4 text-3xl text-sucre-ink sm:text-4xl">
            {GALLERY.title}
          </h2>
          {GALLERY.subhead ? (
            <p className="mt-3 text-sm text-sucre-muted">{GALLERY.subhead}</p>
          ) : null}
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {GALLERY.images.map((image, i) => (
            <Reveal
              key={image.src}
              delay={(i % 5) * 60}
              className={`sucre-card relative overflow-hidden ${
                i < 2 ? 'aspect-square' : 'aspect-[9/16]'
              } ${i === 0 ? 'col-span-2 sm:col-span-1' : ''}`}
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
