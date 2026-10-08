'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * A text-forward, categorised menu — each category gets its own coloured
 * pill tab (alternating taro and berry) rather than kiln's unbroken
 * monochrome divider rule, so the three categories read apart at a glance
 * even without a single photo in the list.
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
    <section id="menu" className="bg-pearl-surface py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal className="text-center">
          <p className="text-xs font-bold tracking-[0.28em] text-pearl-berry uppercase">
            {SERVICES.eyebrow}
          </p>
          <h2 className="font-pearl-display mt-4 text-4xl text-pearl-ink sm:text-5xl">
            {SERVICES.title}
          </h2>
          <p className="mt-4 text-base text-pearl-muted">{SERVICES.subhead}</p>
        </Reveal>

        <div className="mt-14 flex flex-col gap-12">
          {categories.map((category, ci) => (
            <Reveal key={category.name} delay={ci * 80}>
              <span
                className={`pearl-pill inline-block px-4 py-1.5 text-xs font-bold tracking-[0.1em] text-white uppercase ${
                  ci % 2 === 0 ? 'bg-pearl-taro' : 'bg-pearl-berry'
                }`}
              >
                {category.name}
              </span>
              <ul className="mt-5 flex flex-col divide-y divide-pearl-border">
                {category.items.map((item) => (
                  <li key={item.number} className="flex items-start justify-between gap-4 py-4">
                    <div>
                      <p className="font-pearl-display text-lg text-pearl-ink">{item.name}</p>
                      <p className="mt-1 text-sm leading-relaxed text-pearl-muted">{item.body}</p>
                    </div>
                    <span className="shrink-0 text-base font-bold text-pearl-sugar">
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
