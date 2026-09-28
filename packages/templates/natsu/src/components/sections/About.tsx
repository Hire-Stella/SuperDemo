'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

export default function About() {
  const { ABOUT } = useContent();

  return (
    <section id="about" className="bg-natsu-surface py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-2">
        <Reveal className="natsu-soft relative aspect-[4/5] overflow-hidden">
          <Image
            src={ABOUT.image}
            alt="Natsu"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </Reveal>

        <Reveal delay={100}>
          <p className="text-xs font-semibold tracking-[0.28em] text-natsu-caramel uppercase">
            {ABOUT.eyebrow}
          </p>
          <h2 className="font-natsu-display mt-4 text-4xl text-natsu-ink sm:text-5xl">
            {ABOUT.heading}
          </h2>
          <div className="mt-6 flex flex-col gap-4">
            {ABOUT.paragraphs.map((p, i) => (
              <p key={i} className="text-base leading-relaxed text-natsu-muted">
                {p}
              </p>
            ))}
          </div>

          {ABOUT.cta ? (
            <Link
              href={ABOUT.cta.href}
              className="natsu-pill mt-8 inline-flex items-center justify-center border border-natsu-ink/25 px-7 py-3.5 text-xs font-semibold tracking-[0.1em] text-natsu-ink uppercase transition-colors hover:border-natsu-ink"
            >
              {ABOUT.cta.label}
            </Link>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
