'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

export default function Gallery() {
  const { GALLERY } = useContent();

  return (
    <section id="gallery" className="bg-tavola-ink py-20 text-tavola-cream sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-lg text-center">
          <p className="text-xs font-semibold tracking-[0.3em] text-tavola-gold uppercase">
            {GALLERY.eyebrow}
          </p>
          <h2 className="font-display mt-4 text-4xl sm:text-5xl">{GALLERY.title}</h2>
          <p className="mt-4 text-base text-tavola-cream/70">{GALLERY.subhead}</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {GALLERY.images.map((image, i) => (
            <Reveal
              key={image.src}
              delay={(i % 3) * 100}
              className={`relative overflow-hidden rounded-xl ${i === 0 ? 'col-span-2 aspect-[16/9] sm:col-span-1 sm:aspect-square' : 'aspect-square'}`}
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
