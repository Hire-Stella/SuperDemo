'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's own "Menu" band: two groups (Coffee, Pastries), each a
 * plain ruled list of name and bare dollar price — no photos, no
 * per-item description anywhere in the source's markup. The source's own
 * "Groups" wrapper stacks the two lists in a single column (not a
 * side-by-side grid), centred, which this keeps rather than inventing a
 * grid the source never drew.
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
    <section id="menu" className="bg-folio-cream py-20 sm:py-28">
      <div className="mx-auto max-w-xl px-6 text-center">
        <Reveal className="flex flex-col items-center">
          <p className="font-folio-display text-[10px] text-folio-accent uppercase">
            {SERVICES.eyebrow}
          </p>
          <h2
            className="font-folio-display mt-3 text-folio-accent uppercase"
            style={{ fontSize: 'clamp(2.5rem, 9vw, 5rem)' }}
          >
            {SERVICES.title}
          </h2>
        </Reveal>

        <div className="mt-14 flex flex-col gap-12 text-left">
          {categories.map((category, ci) => (
            <Reveal key={category.name} delay={ci * 90}>
              <h3 className="font-folio-display text-sm text-folio-accent uppercase">
                {category.name}
              </h3>
              <ul className="mt-3 flex flex-col">
                {category.items.map((item) => (
                  <li
                    key={item.number}
                    className="folio-rule flex items-baseline justify-between gap-4 py-3 text-folio-accent uppercase"
                  >
                    <span className="font-folio-display text-base">{item.name}</span>
                    <span className="font-folio-display text-base">{item.price}</span>
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
