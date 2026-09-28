'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's "Story" band: one heading, one paragraph, and three bare
 * year markers ('23 / '24 / '25) rendered beside it as a small founding
 * timeline — the source repeats the same paragraph next to all three rather
 * than writing three distinct milestones, so this port keeps one paragraph
 * and three chips rather than inventing separate copy per year. The years
 * are set in the source's own literal tabular-numeral mono face, the same
 * treatment the source gives every counter on the page.
 */
export default function About() {
  const { ABOUT } = useContent();

  return (
    <section id="story" className="bg-kiln-bg py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
        <Reveal className="kiln-card relative aspect-[4/5] overflow-hidden">
          <Image
            src={ABOUT.image}
            alt="A café balcony overlooking the city"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </Reveal>

        <Reveal delay={100}>
          <p className="text-xs font-semibold tracking-[0.28em] text-kiln-faint uppercase">
            {ABOUT.eyebrow}
          </p>
          <div className="mt-6 flex flex-col gap-4">
            {ABOUT.paragraphs.map((p, i) => (
              <p key={i} className="max-w-md text-base leading-relaxed text-kiln-muted">
                {p}
              </p>
            ))}
          </div>

          {ABOUT.years.length > 0 ? (
            <ul className="mt-8 flex gap-6 border-t border-kiln-border/40 pt-6">
              {ABOUT.years.map((year) => (
                <li key={year} className="font-kiln-mono text-lg text-kiln-ink sm:text-xl">
                  {year}
                </li>
              ))}
            </ul>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
