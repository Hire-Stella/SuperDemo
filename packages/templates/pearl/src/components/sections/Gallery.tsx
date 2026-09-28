'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * An editorial "featured + grid" layout — one large photo up top, the rest
 * in an even row below — rather than natsu's, kiln's or yokai's own equal-
 * tile grid. Genuinely different from every sibling's own gallery band,
 * and a layout that still reads well with as few as three real photos.
 */
export default function Gallery() {
  const { GALLERY } = useContent();
  const [first, ...rest] = GALLERY.images;

  return (
    <section id="gallery" className="bg-pearl-bg py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-lg text-center">
          <p className="text-xs font-bold tracking-[0.28em] text-pearl-berry uppercase">
            {GALLERY.eyebrow}
          </p>
          <h2 className="font-pearl-display mt-4 text-4xl text-pearl-ink sm:text-5xl">
            {GALLERY.title}
          </h2>
          {GALLERY.subhead ? (
            <p className="mt-4 text-base text-pearl-muted">{GALLERY.subhead}</p>
          ) : null}
        </Reveal>

        {first ? (
          <Reveal className="pearl-cup relative mt-14 aspect-[16/9] w-full overflow-hidden">
            <Image
              src={first.src}
              alt={first.alt}
              fill
              sizes="(min-width: 768px) 80vw, 100vw"
              className="object-cover"
            />
          </Reveal>
        ) : null}

        {rest.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {rest.map((image, i) => (
              <Reveal
                key={image.src}
                delay={(i % 3) * 80}
                className="pearl-cup relative aspect-square overflow-hidden"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 640px) 30vw, 50vw"
                  className="object-cover"
                />
              </Reveal>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
