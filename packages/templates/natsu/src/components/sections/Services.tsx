'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The menu page's own full drink & pastry list — fourteen priced cards,
 * each a real name and photo from the source (see defaults.ts for the
 * one item whose own name the source itself left blank).
 */
export default function Services() {
  const { SERVICES } = useContent();

  return (
    <section id="menu" className="bg-natsu-surface py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-natsu-caramel uppercase">
            {SERVICES.eyebrow}
          </p>
          <h2 className="font-natsu-display mt-4 text-4xl text-natsu-ink sm:text-5xl">
            {SERVICES.title}
          </h2>
          <p className="mt-4 text-base text-natsu-muted">{SERVICES.subhead}</p>
        </Reveal>

        <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {SERVICES.items.map((item, i) => (
            <Reveal
              key={item.number}
              delay={(i % 4) * 80}
              className="natsu-soft flex flex-col overflow-hidden border border-natsu-ink/10 bg-natsu-bg"
            >
              <div className="relative aspect-square w-full overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(min-width: 1024px) 22vw, 45vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1 px-5 py-5">
                <h3 className="font-natsu-display text-lg text-natsu-ink">{item.name}</h3>
                <p className="flex-1 text-xs leading-relaxed text-natsu-muted">{item.body}</p>
                {item.price ? (
                  <span className="mt-2 text-sm font-semibold text-natsu-caramel">
                    {item.price}
                  </span>
                ) : null}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
