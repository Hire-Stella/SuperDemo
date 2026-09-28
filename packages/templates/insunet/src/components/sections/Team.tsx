'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's separate `/about` route, "Meet out team" band: three real
 * roles and photographs, each given its own distinct name here rather than
 * the source's own duplicated placeholder (see defaults.ts's `TEAM` note).
 */
export default function Team() {
  const { TEAM } = useContent();

  return (
    <section id="team" className="bg-insunet-bg py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold tracking-[0.24em] text-insunet-teal uppercase">
            {TEAM.eyebrow}
          </p>
          <h2 className="font-insunet-display mt-4 text-3xl text-insunet-ink sm:text-4xl">
            {TEAM.title}
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {TEAM.items.map((person, i) => (
            <Reveal key={person.name} delay={i * 100} className="text-center">
              <div className="insunet-card relative mx-auto aspect-square w-40 overflow-hidden">
                <Image
                  src={person.image}
                  alt={person.name}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </div>
              <p className="font-insunet-display mt-5 text-lg text-insunet-ink">{person.name}</p>
              <p className="text-sm font-semibold text-insunet-primary">{person.role}</p>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-insunet-muted">
                {person.bio}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
