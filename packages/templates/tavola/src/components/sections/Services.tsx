'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

export default function Services() {
  const { SERVICES } = useContent();

  return (
    <section id="menu" className="relative overflow-hidden bg-tavola-bg py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-[0.08]">
        <Image src={SERVICES.headerImage} alt="" fill className="object-cover" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold tracking-[0.3em] text-tavola-gold uppercase">
            {SERVICES.eyebrow}
          </p>
          <h2 className="font-display mt-4 text-4xl text-tavola-text sm:text-5xl">
            {SERVICES.title}
          </h2>
          <p className="mt-4 text-base text-tavola-muted">{SERVICES.subhead}</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2">
          {SERVICES.items.map((item, i) => (
            <Reveal key={item.number} delay={(i % 2) * 100} className="flex gap-5">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-28">
                <Image src={item.image} alt={item.name} fill className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display truncate text-xl text-tavola-text">{item.name}</h3>
                  <span className="shrink-0 text-lg font-semibold text-tavola-gold">
                    {item.price}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-tavola-muted">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
