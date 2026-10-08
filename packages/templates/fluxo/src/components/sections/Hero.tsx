'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source home page's hero: a two-line headline, one prose subhead, one
 * filled pill CTA, and a product screenshot — literal down to the headline's
 * own line break. `Ellipse 1`, the source's own soft background glow behind
 * the hero content, is hand-matched here as a plain CSS radial gradient
 * (the source draws it as an unlabelled decorative shape with no fixed
 * asset behind it, nothing to port as a file).
 */
export default function Hero() {
  const { HERO, SITE_NAME } = useContent();

  return (
    <section id="top" className="relative overflow-hidden bg-fluxo-bg pt-16 pb-24 sm:pt-24 sm:pb-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px]"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 0%, rgba(184,121,253,0.16) 0%, rgba(243,243,255,0.6) 45%, rgba(255,255,255,0) 80%)',
        }}
      />

      <div className="mx-auto max-w-4xl px-6 text-center">
        <Reveal>
          {HERO.eyebrow ? (
            <p className="text-xs font-semibold tracking-[0.16em] text-fluxo-accent uppercase">
              {HERO.eyebrow}
            </p>
          ) : null}
          <h1 className="font-fluxo-display text-4xl leading-[1.08] text-fluxo-ink sm:text-6xl">
            {HERO.titleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          {HERO.subhead ? (
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-fluxo-muted sm:text-lg">
              {HERO.subhead}
            </p>
          ) : null}

          {HERO.primaryCta || HERO.secondaryCta ? (
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {HERO.primaryCta ? (
                <Link
                  href={HERO.primaryCta.href}
                  className="fluxo-pill inline-flex items-center justify-center bg-fluxo-primary px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-fluxo-primary-hover"
                >
                  {HERO.primaryCta.label}
                </Link>
              ) : null}
              {HERO.secondaryCta ? (
                <Link
                  href={HERO.secondaryCta.href}
                  className="fluxo-pill inline-flex items-center justify-center border border-fluxo-border px-7 py-3.5 text-sm font-semibold text-fluxo-ink transition-colors hover:border-fluxo-primary"
                >
                  {HERO.secondaryCta.label}
                </Link>
              ) : null}
            </div>
          ) : null}
        </Reveal>
      </div>

      {HERO.image ? (
        <Reveal delay={120} className="mx-auto mt-16 max-w-5xl px-6">
          <div className="fluxo-card overflow-hidden border border-fluxo-border shadow-[0_40px_100px_-40px_rgba(17,14,52,0.35)]">
            <Image
              src={HERO.image}
              alt={`${SITE_NAME} dashboard showing balance, monthly recurring revenue and recent orders`}
              width={1600}
              height={1100}
              sizes="(min-width: 1024px) 960px, 100vw"
              className="h-auto w-full object-cover"
              priority
            />
          </div>
        </Reveal>
      ) : null}
    </section>
  );
}
