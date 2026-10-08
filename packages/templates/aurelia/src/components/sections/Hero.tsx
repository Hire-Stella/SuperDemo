'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

function StarIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L1.3 7.8l6.1-.7z" />
    </svg>
  );
}

/**
 * The source home page's hero: a two-line headline, a real 5-star rating
 * badge, and one photo carrying a literal "Scan for menu" chip — recovered
 * from the source's own `data-framer-name="Scanner"` layer, which really is
 * a rendered QR-code image, not a decorative icon. No prose subhead: the
 * sentence that reads like one belongs to the About band directly below.
 *
 * The "Scan for menu" label sits on the photo, not beside it, so it gets
 * its own frosted (backdrop-blur) chip rather than a photo-wide gradient —
 * a scrim strong enough regardless of what is behind it, which is the
 * literal lesson tavola's hero shipped without checking.
 */
export default function Hero() {
  const { HERO } = useContent();

  return (
    <section id="top" className="relative overflow-hidden bg-aurelia-bg">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 pt-14 pb-16 sm:pt-20 sm:pb-24 lg:grid-cols-2">
        <Reveal>
          {HERO.eyebrow ? (
            <p className="text-xs font-semibold tracking-[0.28em] text-aurelia-accent uppercase">
              {HERO.eyebrow}
            </p>
          ) : null}
          <h1 className="font-aurelia-display mt-2 text-5xl leading-[1.08] text-aurelia-ink sm:text-6xl lg:text-7xl">
            {HERO.titleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          {HERO.subhead ? (
            <p className="mt-6 max-w-md text-base text-aurelia-muted">{HERO.subhead}</p>
          ) : null}

          <div className="mt-6 flex items-center gap-2 text-aurelia-gold">
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon key={i} />
            ))}
            <span className="ml-1 text-sm font-semibold text-aurelia-ink">{HERO.rating.value}</span>
            <span className="text-sm text-aurelia-muted">{HERO.rating.label}</span>
          </div>

          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {HERO.primaryCta ? (
              <Link
                href={HERO.primaryCta.href}
                className="aurelia-pill inline-flex items-center justify-center bg-aurelia-gold px-8 py-3.5 text-sm font-bold tracking-[0.04em] text-aurelia-ink uppercase shadow-[0_10px_24px_-10px_rgba(251,192,41,0.7)] transition-transform hover:scale-[1.03]"
              >
                {HERO.primaryCta.label}
              </Link>
            ) : null}
            {HERO.secondaryCta ? (
              <Link
                href={HERO.secondaryCta.href}
                className="aurelia-pill inline-flex items-center justify-center border border-aurelia-plum/30 px-8 py-3.5 text-sm font-bold tracking-[0.04em] text-aurelia-plum uppercase transition-colors hover:border-aurelia-plum"
              >
                {HERO.secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </Reveal>

        <Reveal delay={120} className="aurelia-card relative aspect-[4/5] overflow-hidden">
          {HERO.image ? (
            <Image
              src={HERO.image}
              alt="Aurelia dining room"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          ) : null}
          <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-[6px] border border-white/25 bg-aurelia-ink/70 px-3 py-2 backdrop-blur-md">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[4px] bg-white">
              <Image
                src={HERO.scan.image}
                alt=""
                fill
                sizes="40px"
                className="object-contain p-0.5"
              />
            </div>
            <span className="text-xs font-semibold tracking-[0.04em] text-white uppercase">
              {HERO.scan.label}
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
