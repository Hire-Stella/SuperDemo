'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The about-us page's "Our Chefs" roster — three named people (a chef, the
 * CEO, and a pantry chef), each with a real portrait photo. No bios beyond
 * a role appear in the source, so none are invented here.
 */
export default function Team() {
  const { TEAM } = useContent();

  return (
    <section id="team" className="bg-aurelia-surface py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-lg text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-aurelia-accent uppercase">
            {TEAM.eyebrow}
          </p>
          <h2 className="font-aurelia-display mt-4 text-4xl text-aurelia-ink sm:text-5xl">
            {TEAM.title}
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {TEAM.items.map((person, i) => (
            <Reveal key={person.name} delay={i * 100} className="text-center">
              <div className="aurelia-card relative mx-auto aspect-square w-40 overflow-hidden sm:w-48">
                <Image
                  src={person.image}
                  alt={person.name}
                  fill
                  sizes="192px"
                  className="object-cover"
                />
              </div>
              <p className="font-aurelia-display mt-5 text-xl text-aurelia-ink">{person.name}</p>
              <p className="mt-1 text-xs font-semibold tracking-[0.1em] text-aurelia-plum uppercase">
                {person.role}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
