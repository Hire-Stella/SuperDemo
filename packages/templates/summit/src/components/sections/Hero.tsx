'use client';

import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source home page's actual hero: a centered headline and subhead over
 * the dark page background, the source's own abstract gold-to-umber gradient
 * visual glowing behind it, two real buttons (a filled white pill and a
 * translucent glass pill, both literal source styles — see theme.css), and
 * a social-proof row of five overlapping avatar photos plus eight fake
 * "trusted by" wordmarks set in a distinct display face per logo, the same
 * literal per-logo font variety the source's own compiled CSS gives each
 * one (see defaults.ts).
 */
export default function Hero() {
  const { HERO } = useContent();

  return (
    <section id="top" className="relative overflow-hidden pt-20 pb-24 sm:pt-28 sm:pb-32">
      {HERO.image ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-[720px] w-full max-w-4xl opacity-60 blur-3xl"
        >
          <Image src={HERO.image} alt="" fill sizes="900px" className="object-contain" priority />
        </div>
      ) : null}

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <Reveal>
          {HERO.eyebrow ? (
            <p className="text-xs font-semibold tracking-[0.28em] text-summit-gold uppercase">
              {HERO.eyebrow}
            </p>
          ) : null}
          <h1 className="font-summit-display text-4xl leading-[1.08] text-summit-ink sm:text-6xl lg:text-[4.5rem]">
            {HERO.titleLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          {HERO.subhead ? (
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-summit-muted sm:text-lg">
              {HERO.subhead}
            </p>
          ) : null}

          {HERO.primaryCta || HERO.secondaryCta ? (
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {HERO.primaryCta ? (
                <Link
                  href={HERO.primaryCta.href}
                  className="summit-pill inline-flex items-center gap-2 bg-white/85 px-7 py-3.5 text-sm font-semibold text-summit-bg transition-colors hover:bg-white"
                >
                  {HERO.primaryCta.label}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ) : null}
              {HERO.secondaryCta ? (
                <Link
                  href={HERO.secondaryCta.href}
                  className="summit-pill inline-flex items-center gap-2 border border-white/40 bg-white/10 px-7 py-3.5 text-sm font-semibold text-summit-ink backdrop-blur-md transition-colors hover:bg-white/20"
                >
                  {HERO.secondaryCta.label}
                </Link>
              ) : null}
            </div>
          ) : null}
        </Reveal>

        {HERO.avatars.length > 0 ? (
          <Reveal delay={120} className="mt-14 flex flex-col items-center gap-3">
            <div className="flex items-center -space-x-3">
              {HERO.avatars.map((src, i) => (
                <div
                  key={src}
                  className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-summit-bg"
                  style={{ zIndex: HERO.avatars.length - i }}
                >
                  <Image src={src} alt="" fill sizes="40px" className="object-cover" />
                </div>
              ))}
            </div>
            <p className="text-sm text-summit-muted">
              <span className="font-summit-display font-semibold text-summit-ink">
                {HERO.trustCount}
              </span>{' '}
              {HERO.trustCountLabel}
            </p>
          </Reveal>
        ) : null}

        {HERO.logos.length > 0 ? (
          <Reveal delay={180} className="mt-10">
            {HERO.trustLabel ? (
              <p className="text-xs tracking-[0.2em] text-summit-faint uppercase">
                {HERO.trustLabel}
              </p>
            ) : null}
            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
              {HERO.logos.map((logo) => (
                <li
                  key={logo}
                  className="font-summit-display text-lg tracking-tight text-summit-ink"
                >
                  {logo}
                </li>
              ))}
            </ul>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
