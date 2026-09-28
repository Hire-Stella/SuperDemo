'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

export default function About() {
  const { ABOUT } = useContent();

  return (
    <section id="about" className="bg-pearl-surface py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-2">
        <Reveal className="pearl-cup relative aspect-[4/5] overflow-hidden">
          <Image
            src={ABOUT.image}
            alt="Two bottles of milk tea with tapioca pearls"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </Reveal>

        <Reveal delay={100}>
          <p className="text-xs font-bold tracking-[0.28em] text-pearl-berry uppercase">
            {ABOUT.eyebrow}
          </p>
          <h2 className="font-pearl-display mt-4 text-4xl text-pearl-ink sm:text-5xl">
            {ABOUT.heading}
          </h2>
          <div className="mt-6 flex flex-col gap-4">
            {ABOUT.paragraphs.map((p, i) => (
              <p key={i} className="text-base leading-relaxed text-pearl-muted">
                {p}
              </p>
            ))}
          </div>

          {ABOUT.cta ? (
            <Link
              href={ABOUT.cta.href}
              className="pearl-pill mt-8 inline-flex items-center justify-center border border-pearl-taro px-7 py-3.5 text-xs font-bold tracking-[0.08em] text-pearl-taro uppercase transition-colors hover:bg-pearl-taro hover:text-white"
            >
              {ABOUT.cta.label}
            </Link>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
