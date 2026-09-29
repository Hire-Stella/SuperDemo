'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The about page's own "The Crew Behind The Coffee" — the source names
 * exactly one person on the whole site (see defaults.ts), kept as one
 * rather than padded out to match a sibling template's larger roster.
 */
export default function Team() {
  const { TEAM } = useContent();

  return (
    <section id="team" className="bg-natsu-bg py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal className="mx-auto max-w-lg text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-natsu-caramel uppercase">
            {TEAM.eyebrow}
          </p>
          <h2 className="font-natsu-display mt-4 text-4xl text-natsu-ink sm:text-5xl">
            {TEAM.title}
          </h2>
        </Reveal>

        <div className="mt-14 flex justify-center">
          {TEAM.items.map((person) => (
            <Reveal key={person.name} className="text-center">
              <div className="natsu-soft relative mx-auto aspect-square w-48 overflow-hidden">
                <Image
                  src={person.image}
                  alt={person.name}
                  fill
                  sizes="192px"
                  className="object-cover"
                />
              </div>
              <p className="font-natsu-display mt-5 text-xl text-natsu-ink">{person.name}</p>
              <p className="mt-1 text-xs font-semibold tracking-[0.1em] text-natsu-caramel uppercase">
                {person.role}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
