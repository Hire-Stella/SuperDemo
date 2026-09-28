'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source hero: one full-bleed photo (an espresso and croissant on a
 * sunlit cobalt table — the page's one real photographic asset) with a
 * centred two-line headline set directly over it in white, no button of
 * any kind. A flat, uniform dark scrim runs the full photo rather than a
 * gradient strongest behind the headline only, so the white type reads
 * clearly over both the darker product shot on the left and the brighter
 * plain-blue negative space on the right.
 */
export default function Hero() {
  const { HERO } = useContent();

  return (
    <section id="top" className="relative flex min-h-[78vh] items-center overflow-hidden pt-16">
      {HERO.image ? (
        <Image
          src={HERO.image}
          alt="Espresso and a croissant on a sunlit blue café table"
          fill
          sizes="100vw"
          priority
          className="object-cover object-left"
        />
      ) : null}
      <div className="absolute inset-0 bg-folio-ink/45" />

      <div className="relative mx-auto w-full max-w-4xl px-6 py-20 text-center">
        <Reveal>
          {HERO.eyebrow ? (
            <p className="font-folio-display text-xs text-white/85 uppercase">{HERO.eyebrow}</p>
          ) : null}
          <h1 className="font-folio-display text-5xl text-white uppercase sm:text-7xl lg:text-8xl">
            {HERO.titleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          {HERO.subhead ? (
            <p className="mx-auto mt-6 max-w-xl text-sm text-white/90 uppercase">{HERO.subhead}</p>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
