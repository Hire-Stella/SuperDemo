'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The about page's "Meet Our Master Chef" roster — four named people, each
 * with a real portrait photo. The source has no per-person title beyond
 * the section heading, so every chef keeps the same plain role rather than
 * four invented ones (see defaults.ts).
 */
export default function Team() {
  const { TEAM } = useContent();

  return (
    <section id="team" className="bg-brasa-surface py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-lg text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-brasa-chili uppercase">
            {TEAM.eyebrow}
          </p>
          <h2 className="font-brasa-display mt-4 text-4xl text-brasa-ink sm:text-5xl">
            {TEAM.title}
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {TEAM.items.map((person, i) => (
            <Reveal key={person.name} delay={i * 100} className="text-center">
              <div className="brasa-frame relative mx-auto aspect-square w-full max-w-40 overflow-hidden border-4 border-brasa-ink">
                <Image
                  src={person.image}
                  alt={person.name}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </div>
              <p className="font-brasa-display mt-5 text-lg text-brasa-ink">{person.name}</p>
              <p className="mt-1 text-xs font-semibold tracking-[0.1em] text-brasa-chili uppercase">
                {person.role}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
