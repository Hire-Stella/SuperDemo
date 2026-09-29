'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/** Cycled per card so a row reads as loosely pinned photos, not one repeated stamp. */
const TILTS = ['brasa-tilt-a', 'brasa-tilt-b', 'brasa-tilt-c'];

/**
 * The home page's "Popular Dishes" cards — literally photographed on a
 * chili-red mat inside a thick, literal 6px marigold border, the whole
 * thing rotated (the source's own `transform: rotate(-10deg)`). Ported
 * here as a small set of fixed tilt angles rather than the source's single
 * repeated one, so six cards in a row do not read as identical stamps.
 */
export default function Services() {
  const { SERVICES } = useContent();

  return (
    <section id="menu" className="bg-brasa-bg py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-brasa-chili uppercase">
            {SERVICES.eyebrow}
          </p>
          <h2 className="font-brasa-display mt-4 text-4xl text-brasa-ink sm:text-5xl">
            {SERVICES.title}
          </h2>
          <p className="mt-4 text-base text-brasa-muted">{SERVICES.subhead}</p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.items.map((item, i) => (
            <Reveal key={item.number} delay={(i % 3) * 100} className="flex flex-col items-center">
              <div
                className={`${TILTS[i % TILTS.length]} brasa-frame relative aspect-square w-40 shrink-0 overflow-hidden border-[6px] border-brasa-marigold bg-brasa-chili shadow-lg sm:w-48`}
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(min-width: 1024px) 16vw, 40vw"
                  className="object-cover"
                />
              </div>
              <div className="mt-6 flex flex-col items-center text-center">
                <span className="text-xs font-semibold tracking-[0.2em] text-brasa-chili">
                  {item.number}
                </span>
                <h3 className="font-brasa-display mt-1 text-2xl text-brasa-ink">{item.name}</h3>
                {item.price ? (
                  <span className="mt-1 text-lg font-semibold text-brasa-chili">{item.price}</span>
                ) : null}
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-brasa-muted">
                  {item.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
