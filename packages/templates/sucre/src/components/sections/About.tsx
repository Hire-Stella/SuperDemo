'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's own "About us" band: a stacked two-photo collage beside one
 * heading, one paragraph and a text link — kept as two images rather than
 * one full-bleed shot, since the source's own layout overlaps a smaller
 * detail photo in front of the larger one.
 */
export default function About() {
  const { ABOUT } = useContent();

  return (
    <section id="about" className="bg-sucre-bg py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
        <Reveal className="relative">
          <div className="sucre-card relative aspect-[4/5] overflow-hidden">
            <Image
              src={ABOUT.image}
              alt="A whole cake resting on a marble counter"
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
          {ABOUT.detailImage ? (
            <div className="sucre-card absolute -bottom-6 -right-6 hidden aspect-square w-2/5 overflow-hidden border-4 border-sucre-bg shadow-lg sm:block">
              <Image
                src={ABOUT.detailImage}
                alt="A close-up detail of a decorated dessert"
                fill
                sizes="20vw"
                className="object-cover"
              />
            </div>
          ) : null}
        </Reveal>

        <Reveal delay={100}>
          <p className="text-xs font-semibold tracking-[0.28em] text-sucre-rose uppercase">
            {ABOUT.eyebrow}
          </p>
          <h2 className="font-sucre-display mt-4 text-3xl text-sucre-ink sm:text-4xl">
            {ABOUT.heading}
          </h2>
          <div className="mt-5 flex flex-col gap-4">
            {ABOUT.paragraphs.map((p, i) => (
              <p key={i} className="max-w-md text-base leading-relaxed text-sucre-muted">
                {p}
              </p>
            ))}
          </div>

          {ABOUT.cta ? (
            <Link
              href={ABOUT.cta.href}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sucre-pink underline decoration-sucre-pink-soft decoration-2 underline-offset-4"
            >
              {ABOUT.cta.label}
            </Link>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
