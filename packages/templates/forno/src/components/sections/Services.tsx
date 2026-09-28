'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's "Fan Favorites" + "Save Room for Dessert!" bands, merged
 * into this one-page contract's single `services` grid — a curated three
 * pizzas and three desserts, each with its own literal dish photo and
 * literal ingredient list.
 */
export default function Services() {
  const { SERVICES, ORDER_LABEL } = useContent();

  return (
    <section id="menu" className="bg-forno-bg py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-bold tracking-[0.22em] text-forno-red uppercase">
            {SERVICES.eyebrow}
          </p>
          <h2 className="font-forno-display mt-4 text-4xl text-forno-ink sm:text-5xl">
            {SERVICES.title}
          </h2>
          <p className="mt-4 text-base text-forno-muted">{SERVICES.subhead}</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.items.map((item, i) => (
            <Reveal
              key={item.number}
              delay={(i % 3) * 100}
              className="forno-card flex flex-col overflow-hidden border border-forno-border bg-forno-surface"
            >
              <div className="relative aspect-square w-full bg-white">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
                <span className="forno-pill absolute top-3 left-3 bg-forno-ink px-3 py-1 text-xs font-bold text-white">
                  {item.price}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-forno-display text-xl text-forno-ink">{item.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-forno-muted">{item.body}</p>
                <Link
                  href="#contact"
                  className="forno-pill mt-4 inline-flex items-center justify-center bg-forno-red px-5 py-2.5 text-xs font-bold tracking-[0.06em] text-white uppercase transition-transform hover:scale-[1.03]"
                >
                  {ORDER_LABEL}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
