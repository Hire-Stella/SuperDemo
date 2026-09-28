'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's own "Your partner for life's journey" band: one heading, one
 * paragraph and one photograph — its own three-phrase process list beside
 * this text is ported separately as `Steps.tsx` (see defaults.ts's `STEPS`
 * note for why).
 */
export default function About() {
  const { ABOUT } = useContent();

  return (
    <section id="about" className="bg-insunet-bg py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
        <Reveal className="insunet-card relative aspect-[4/5] overflow-hidden bg-insunet-surface">
          <Image
            src={ABOUT.image}
            alt="A family gathered around a laptop at home"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </Reveal>

        <Reveal delay={100}>
          <p className="text-xs font-semibold tracking-[0.24em] text-insunet-teal uppercase">
            {ABOUT.eyebrow}
          </p>
          <h2 className="font-insunet-display mt-4 text-3xl text-insunet-ink sm:text-4xl">
            {ABOUT.heading}
          </h2>
          <div className="mt-5 flex flex-col gap-4">
            {ABOUT.paragraphs.map((p, i) => (
              <p key={i} className="max-w-md text-base leading-relaxed text-insunet-muted">
                {p}
              </p>
            ))}
          </div>

          {ABOUT.cta ? (
            <Link
              href={ABOUT.cta.href}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-insunet-primary underline decoration-insunet-primary/40 decoration-2 underline-offset-4"
            >
              {ABOUT.cta.label}
            </Link>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
