'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/** A tiny inline glyph set — the source's own icons here are plain line marks, no third-party set needed. */
const CHIP_ICONS: Record<string, ReactNode> = {
  utensils: (
    <path
      d="M6 2v8a2 2 0 0 0 4 0V2M8 10v12M14 2v20M18 2c-2 2-2 6 0 8v12"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  leaf: (
    <path
      d="M20 3C10 3 3 10 3 20c10 0 17-7 17-17ZM3 20c4-1 8-3 11-6"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  'chef-hat': (
    <path
      d="M6 13a5 5 0 0 1 1-9.9A5 5 0 0 1 12 2a5 5 0 0 1 5 1.1A5 5 0 0 1 18 13v6H6zM6 19h12"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

export default function About() {
  const { ABOUT } = useContent();

  return (
    <section id="about" className="bg-aurelia-bg py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
        <Reveal className="aurelia-card relative aspect-[4/5] overflow-hidden">
          <Image
            src={ABOUT.image}
            alt="Aurelia"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </Reveal>

        <Reveal delay={100}>
          <p className="text-xs font-semibold tracking-[0.28em] text-aurelia-accent uppercase">
            {ABOUT.eyebrow}
          </p>
          <h2 className="font-aurelia-display mt-4 text-4xl text-aurelia-ink sm:text-5xl">
            {ABOUT.heading}
          </h2>
          <div className="mt-6 flex flex-col gap-4">
            {ABOUT.paragraphs.map((p, i) => (
              <p key={i} className="text-base leading-relaxed text-aurelia-muted">
                {p}
              </p>
            ))}
          </div>

          <ul className="mt-6 flex flex-wrap gap-5">
            {ABOUT.chips.map((chip) => (
              <li key={chip.label} className="flex items-center gap-2 text-sm text-aurelia-plum">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                  {CHIP_ICONS[chip.icon] ?? CHIP_ICONS.leaf}
                </svg>
                <span className="font-medium">{chip.label}</span>
              </li>
            ))}
          </ul>

          {ABOUT.cta ? (
            <Link
              href={ABOUT.cta.href}
              className="aurelia-pill mt-8 inline-flex items-center justify-center border border-aurelia-plum/30 px-7 py-3.5 text-xs font-semibold tracking-[0.1em] text-aurelia-plum uppercase transition-colors hover:border-aurelia-plum"
            >
              {ABOUT.cta.label}
            </Link>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
