'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source home page's actual hero: a headline and subhead beside a
 * cut-out photograph (a transparent PNG, not a full-bleed background image —
 * confirmed against the source's own asset, which has no backdrop baked
 * in), one real pill button. Kept here as a colour-panel-behind-a-cutout
 * treatment — two soft brand-tinted shapes behind the photo rather than a
 * photo filling the whole section — deliberately not kiln's or sucre's
 * full-bleed scrim-and-photo hero. The small floating quote card is this
 * port's own stand-in for the source's own rotating testimonial widget
 * beside its hero (three quotes cross-fading in the source's client-only
 * runtime, with no fixed "current" quote in its static HTML) — hand-matched
 * here as one static card rather than porting motion that has no fixed
 * frame to copy.
 */
export default function Hero() {
  const { HERO, TESTIMONIALS } = useContent();
  const quote = TESTIMONIALS.items[0];

  return (
    <section id="top" className="relative overflow-hidden bg-insunet-surface">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 sm:py-24 lg:grid-cols-2">
        <Reveal>
          {HERO.eyebrow ? (
            <p className="text-xs font-semibold tracking-[0.24em] text-insunet-teal uppercase">
              {HERO.eyebrow}
            </p>
          ) : null}
          <h1 className="font-insunet-display max-w-xl text-4xl leading-[1.08] text-insunet-ink sm:text-5xl lg:text-6xl">
            {HERO.titleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          {HERO.subhead ? (
            <p className="mt-6 max-w-md text-base leading-relaxed text-insunet-muted sm:text-lg">
              {HERO.subhead}
            </p>
          ) : null}

          {HERO.primaryCta || HERO.secondaryCta ? (
            <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              {HERO.primaryCta ? (
                <Link
                  href={HERO.primaryCta.href}
                  className="insunet-pill inline-flex items-center justify-center bg-insunet-accent px-7 py-3.5 text-sm font-semibold text-insunet-accent-ink transition-colors hover:bg-insunet-accent/85"
                >
                  {HERO.primaryCta.label}
                </Link>
              ) : null}
              {HERO.secondaryCta ? (
                <Link
                  href={HERO.secondaryCta.href}
                  className="insunet-pill inline-flex items-center justify-center border border-insunet-ink/20 px-7 py-3.5 text-sm font-semibold text-insunet-ink transition-colors hover:border-insunet-ink/50"
                >
                  {HERO.secondaryCta.label}
                </Link>
              ) : null}
            </div>
          ) : null}
        </Reveal>

        <Reveal delay={120} className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div
            aria-hidden="true"
            className="absolute -inset-6 -z-10 rounded-[3rem] bg-insunet-accent/20"
          />
          <div
            aria-hidden="true"
            className="absolute -inset-2 -z-10 translate-x-6 translate-y-6 rounded-[3rem] bg-insunet-primary/10"
          />
          {HERO.image ? (
            <div className="relative aspect-[4/5] w-full">
              <Image
                src={HERO.image}
                alt="A parent and child looking at a tablet together, covered by an Insunet policy"
                fill
                sizes="(min-width: 1024px) 45vw, 90vw"
                priority
                className="object-contain object-bottom"
              />
            </div>
          ) : null}

          {quote ? (
            <div className="insunet-card absolute -bottom-6 left-1/2 w-[85%] -translate-x-1/2 border border-insunet-border/60 bg-white p-4 shadow-lg sm:left-4 sm:w-64 sm:translate-x-0">
              <p className="text-xs leading-relaxed text-insunet-muted">&ldquo;{quote.quote}&rdquo;</p>
              <p className="mt-2 text-xs font-semibold text-insunet-ink">
                {quote.author} <span className="font-normal text-insunet-muted">· {quote.role}</span>
              </p>
            </div>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
