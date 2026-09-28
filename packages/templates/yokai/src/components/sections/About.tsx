'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

export default function About() {
  const { ABOUT } = useContent();

  return (
    <section id="about" className="bg-yokai-surface py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-2">
        <Reveal className="yokai-frame relative aspect-[4/5] overflow-hidden border-4 border-yokai-border">
          <Image
            src={ABOUT.image}
            alt="Inside the Yokai kitchen"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </Reveal>

        <Reveal delay={100}>
          <p className="text-xs font-semibold tracking-[0.28em] text-yokai-nori uppercase">
            {ABOUT.eyebrow}
          </p>
          <h2 className="font-yokai-display mt-4 text-4xl text-yokai-paper sm:text-5xl">
            {ABOUT.heading}
          </h2>
          <div className="mt-6 flex flex-col gap-4">
            {ABOUT.paragraphs.map((p, i) => (
              <p key={i} className="text-base leading-relaxed text-yokai-muted">
                {p}
              </p>
            ))}
          </div>

          {ABOUT.cta ? (
            <Link
              href={ABOUT.cta.href}
              className="yokai-btn mt-8 inline-flex items-center justify-center border border-yokai-border px-7 py-3.5 text-xs font-semibold tracking-[0.1em] text-yokai-text uppercase transition-colors hover:border-yokai-paper"
            >
              {ABOUT.cta.label}
            </Link>
          ) : null}

          {ABOUT.quote ? (
            <blockquote className="yokai-frame mt-10 flex items-start gap-4 border-l-4 border-yokai-lantern bg-yokai-paper py-5 pr-4 pl-5">
              {ABOUT.quote.image ? (
                <div className="yokai-seal relative h-12 w-12 shrink-0 overflow-hidden border-2 border-yokai-ink">
                  <Image
                    src={ABOUT.quote.image}
                    alt={ABOUT.quote.author}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
              ) : null}
              <div>
                <p className="text-sm leading-relaxed text-yokai-ink italic">
                  &ldquo;{ABOUT.quote.text}&rdquo;
                </p>
                <p className="mt-2 text-xs font-semibold tracking-[0.06em] text-yokai-lantern uppercase">
                  {ABOUT.quote.author}
                  {ABOUT.quote.role ? (
                    <span className="text-yokai-muted-paper"> — {ABOUT.quote.role}</span>
                  ) : null}
                </p>
              </div>
            </blockquote>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
