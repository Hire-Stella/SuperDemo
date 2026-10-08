'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's own "Menu" band: three categories (Coffee, Brew Lab, Ice
 * Tea), each a plain list of name / calorie count / bare price digit — no
 * photos, no cards. A text-forward list rather than aurelia's photo-card
 * grid or forno's numbered rows, the source's own real layout for a menu
 * this size. Prices and calorie counts are set in the source's own literal
 * tabular-numeral mono face so every digit column lines up.
 */
export default function Services() {
  const { SERVICES } = useContent();

  const categories: { name: string; items: typeof SERVICES.items }[] = [];
  for (const item of SERVICES.items) {
    const last = categories[categories.length - 1];
    if (last && last.name === item.category) {
      last.items.push(item);
    } else {
      categories.push({ name: item.category, items: [item] });
    }
  }

  return (
    <section id="menu" className="bg-kiln-bg py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal className="text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-kiln-faint uppercase">
            {SERVICES.eyebrow}
          </p>
          <h2 className="font-kiln-display mt-4 text-4xl text-kiln-ink uppercase sm:text-5xl">
            {SERVICES.title}
          </h2>
        </Reveal>

        <div className="mt-14 flex flex-col gap-12">
          {categories.map((category, ci) => (
            <Reveal key={category.name} delay={ci * 80}>
              <h3 className="font-kiln-display text-lg text-kiln-ink uppercase">{category.name}</h3>
              <ul className="mt-4 flex flex-col divide-y divide-kiln-border/30">
                {category.items.map((item) => (
                  <li key={item.number} className="flex items-baseline justify-between gap-4 py-3">
                    <span className="text-base text-kiln-ink">{item.name}</span>
                    <span className="h-px flex-1 border-b border-dotted border-kiln-border/60" />
                    <span className="font-kiln-mono shrink-0 text-xs text-kiln-faint">
                      {item.body}
                    </span>
                    <span className="font-kiln-mono shrink-0 text-base text-kiln-ink">
                      {item.price}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
