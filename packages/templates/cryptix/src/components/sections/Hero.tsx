'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source home page's hero: a centered headline over the ambient glow,
 * one CTA, a small "4,9 · They trust us" trust row, and the flagship
 * dashboard screenshot below — the same image the source reuses across all
 * three showcase panels further down the page (see defaults.ts's note on
 * `SHOWCASE_PANELS`).
 */
export default function Hero() {
  const { HERO } = useContent();

  return (
    <section id="top" className="relative overflow-hidden pt-20 pb-16 sm:pt-28">
      <div className="cryptix-ambient" aria-hidden />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <Reveal>
          {HERO.eyebrow ? (
            <p className="text-xs font-semibold tracking-[0.2em] text-cryptix-link uppercase">
              {HERO.eyebrow}
            </p>
          ) : null}
          <h1 className="font-cryptix-display mx-auto max-w-3xl text-4xl leading-[1.08] text-cryptix-ink sm:text-6xl">
            {HERO.titleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          {HERO.subhead ? (
            <p className="mx-auto mt-6 max-w-xl text-base text-cryptix-muted sm:text-lg">{HERO.subhead}</p>
          ) : null}

          {HERO.primaryCta || HERO.secondaryCta ? (
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {HERO.primaryCta ? (
                <Link
                  href={HERO.primaryCta.href}
                  className="cryptix-pill cryptix-glow inline-flex items-center justify-center bg-cryptix-accent px-8 py-3.5 text-sm font-semibold text-cryptix-accent-ink transition-transform hover:scale-[1.03]"
                >
                  {HERO.primaryCta.label}
                </Link>
              ) : null}
              {HERO.secondaryCta ? (
                <Link
                  href={HERO.secondaryCta.href}
                  className="cryptix-pill inline-flex items-center justify-center border border-cryptix-border px-8 py-3.5 text-sm font-semibold text-cryptix-ink transition-colors hover:border-cryptix-ink"
                >
                  {HERO.secondaryCta.label}
                </Link>
              ) : null}
            </div>
          ) : null}

          <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-cryptix-border bg-cryptix-surface/60 py-2 pr-5 pl-2">
            <span className="flex -space-x-2">
              <Image
                src="/t/cryptix/images/social-avatar.png"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 rounded-full border-2 border-cryptix-surface object-cover"
              />
              <Image
                src="/t/cryptix/images/social-logo.jpg"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 rounded-full border-2 border-cryptix-surface object-cover"
              />
            </span>
            <span className="font-cryptix-mono text-sm text-cryptix-ink">{HERO.rating}</span>
            <span className="text-sm text-cryptix-faint">{HERO.ratingLabel}</span>
          </div>
        </Reveal>

        {HERO.image ? (
          <Reveal delay={120} className="cryptix-card relative mt-14 overflow-hidden border border-cryptix-border">
            <Image
              src={HERO.image}
              alt="Cryptix portfolio dashboard"
              width={1440}
              height={885}
              priority
              className="h-auto w-full object-cover"
            />
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
