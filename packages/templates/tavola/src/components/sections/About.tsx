'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

export default function About() {
  const { ABOUT } = useContent();

  return (
    <section id="about" className="bg-tavola-bg py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
        <Reveal className="relative aspect-[4/5] overflow-hidden rounded-2xl lg:order-2">
          <Image
            src={ABOUT.image}
            alt="Tavola"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </Reveal>

        <Reveal delay={100} className="lg:order-1">
          <p className="text-xs font-semibold tracking-[0.3em] text-tavola-gold uppercase">
            {ABOUT.eyebrow}
          </p>
          <h2 className="font-display mt-4 text-4xl text-tavola-text sm:text-5xl">
            {ABOUT.heading}
          </h2>
          <div className="mt-6 flex flex-col gap-4">
            {ABOUT.paragraphs.map((p, i) => (
              <p key={i} className="text-base leading-relaxed text-tavola-muted">
                {p}
              </p>
            ))}
          </div>
          {ABOUT.cta ? (
            <Link
              href={ABOUT.cta.href}
              className="tavola-btn mt-8 inline-flex items-center justify-center bg-tavola-ink px-7 py-3.5 text-xs font-semibold tracking-[0.1em] text-tavola-cream uppercase transition-transform hover:scale-[1.03]"
            >
              {ABOUT.cta.label}
            </Link>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
