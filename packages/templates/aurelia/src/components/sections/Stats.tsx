'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The about-us page's animated counter band (see defaults.ts for why the
 * digits are hand-matched rather than scraped), over the source's own
 * literal jewel-toned kitchen photo.
 *
 * A uniform dark scrim across the *entire* image — not a top-to-bottom
 * gradient — is deliberate: tavola's hero shipped with a gradient that was
 * weakest exactly behind its headline, found only by looking at a real
 * screenshot. A flat `ink/80` overlay keeps every number band at the same
 * contrast regardless of what the photo behind it happens to show.
 *
 * The thin ticker beneath it is a continuous marquee — this template's own
 * third motion, independent of both the scroll reveal and forno's floating
 * bob (see theme.css's `.aurelia-marquee-track`). The track's content is
 * duplicated so the loop point is invisible.
 */
export default function Stats() {
  const { STATS } = useContent();
  const tickerText = 'Reservations open nightly — walk-ins welcome — brunch on weekends';

  return (
    <section className="relative overflow-hidden bg-aurelia-ink text-white">
      <div className="relative py-20 sm:py-28">
        <div className="absolute inset-0">
          <Image src={STATS.image} alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-aurelia-ink/80" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6">
          <Reveal className="mx-auto max-w-lg text-center">
            <p className="text-xs font-semibold tracking-[0.28em] text-aurelia-gold uppercase">
              {STATS.eyebrow}
            </p>
            <h2 className="font-aurelia-display mt-4 text-3xl sm:text-4xl">{STATS.title}</h2>
          </Reveal>

          <div className="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {STATS.items.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 100} className="text-center">
                <p className="font-aurelia-display text-4xl text-aurelia-gold sm:text-5xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-xs font-semibold tracking-[0.1em] text-white/75 uppercase">
                  {stat.label}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10 bg-aurelia-ink py-3">
        <div className="overflow-hidden whitespace-nowrap">
          <div className="aurelia-marquee-track inline-flex gap-10 text-xs font-semibold tracking-[0.14em] text-aurelia-gold/80 uppercase">
            <span className="pr-10">{tickerText}</span>
            <span className="pr-10" aria-hidden="true">
              {tickerText}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
