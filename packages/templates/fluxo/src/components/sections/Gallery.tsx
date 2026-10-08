'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's own "Integrate with modern no-code tools" band — see
 * defaults.ts's `GALLERY` note on why its own six placeholder marketplace
 * logos ("Logoipsum", "LOGO") are redrawn here as six original abstract
 * marks instead of ported literally. Laid out as a slow, looping marquee —
 * the source's own equivalent strip is itself a horizontally scrolling
 * component, kept here as a plain CSS `translateX` loop (`.fluxo-marquee`)
 * rather than the source's JS-only Framer scroll component.
 */
export default function Gallery() {
  const { GALLERY } = useContent();
  const track = [...GALLERY.images, ...GALLERY.images];

  return (
    <section id="gallery" className="bg-fluxo-bg py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold tracking-[0.16em] text-fluxo-accent uppercase">
            {GALLERY.eyebrow}
          </p>
          <h2 className="font-fluxo-display mt-4 text-3xl text-fluxo-ink sm:text-4xl">
            {GALLERY.title}
          </h2>
          {GALLERY.subhead ? (
            <p className="mt-3 text-base text-fluxo-muted">{GALLERY.subhead}</p>
          ) : null}
        </Reveal>
      </div>

      <Reveal delay={100} className="mt-12 overflow-hidden">
        <div className="fluxo-marquee flex w-max items-center gap-4 px-6">
          {track.map((img, i) => (
            <div
              key={`${img.src}-${i}`}
              className="fluxo-card flex h-24 w-24 shrink-0 items-center justify-center border border-fluxo-border bg-fluxo-surface p-3"
              title={img.alt}
            >
              <Image src={img.src} alt={img.alt} width={40} height={40} className="h-10 w-10" />
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
