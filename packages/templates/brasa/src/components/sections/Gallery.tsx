'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * A plain, sharp-cornered grid — unlike Hero's and Services' tilted photo
 * frames, the source's own gallery page lays its photos flat and even, so
 * this band does not borrow the tilt motif from elsewhere on the page.
 */
export default function Gallery() {
  const { GALLERY } = useContent();

  return (
    <section id="gallery" className="bg-brasa-bg py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-lg text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-brasa-chili uppercase">
            {GALLERY.eyebrow}
          </p>
          <h2 className="font-brasa-display mt-4 text-4xl text-brasa-ink sm:text-5xl">
            {GALLERY.title}
          </h2>
          <p className="mt-4 text-base text-brasa-muted">{GALLERY.subhead}</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {GALLERY.images.map((image, i) => (
            <Reveal
              key={image.src}
              delay={(i % 4) * 80}
              className="brasa-frame relative aspect-square overflow-hidden border-2 border-brasa-ink/10"
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
