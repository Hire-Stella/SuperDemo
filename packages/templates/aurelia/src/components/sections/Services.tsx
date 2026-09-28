'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The home page's "Our Signature Delights" band — one dish from each of the
 * source's six meal periods (Breakfast, Beverage, Lunch, Dessert, Dinner,
 * Brunch), the literal all-day span that makes this an all-day bistro. Each
 * category tag overlaps the top-left corner of its dish photo, the source's
 * own layout; several dishes also carry the source's own literal "compare
 * at" price, shown struck through beside the real one.
 */
export default function Services() {
  const { SERVICES } = useContent();

  return (
    <section id="menu" className="bg-aurelia-bg py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-aurelia-accent uppercase">
            {SERVICES.eyebrow}
          </p>
          <h2 className="font-aurelia-display mt-4 text-4xl text-aurelia-ink sm:text-5xl">
            {SERVICES.title}
          </h2>
          <p className="mt-4 text-base text-aurelia-muted">{SERVICES.subhead}</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.items.map((item, i) => (
            <Reveal
              key={item.number}
              delay={(i % 3) * 100}
              className="aurelia-card flex flex-col overflow-hidden border border-aurelia-border/70 bg-aurelia-surface"
            >
              <div className="relative aspect-[4/3] w-full bg-white">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
                <span className="aurelia-pill absolute top-3 left-3 bg-aurelia-ink/85 px-3 py-1 text-[11px] font-bold tracking-[0.06em] text-white uppercase">
                  {item.category}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-aurelia-display truncate text-xl text-aurelia-ink">
                    {item.name}
                  </h3>
                  <span className="shrink-0 text-right">
                    <span className="text-lg font-semibold text-aurelia-plum">{item.price}</span>
                    {item.comparePrice ? (
                      <span className="ml-1.5 text-sm text-aurelia-muted/70 line-through">
                        {item.comparePrice}
                      </span>
                    ) : null}
                  </span>
                </div>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-aurelia-muted">
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
