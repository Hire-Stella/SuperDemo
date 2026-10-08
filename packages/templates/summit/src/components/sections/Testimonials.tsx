'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's own two-row looping testimonial marquee (see defaults.ts):
 * eight reviews split into two rows of four, each row scrolling in the
 * opposite direction, with the item list doubled so the loop has no visible
 * seam. `aria-hidden` on the duplicated half keeps the marquee from being
 * read twice by assistive tech; the full list is announced separately.
 */
export default function Testimonials() {
  const { TESTIMONIALS } = useContent();
  const half = Math.ceil(TESTIMONIALS.items.length / 2);
  const rowA = TESTIMONIALS.items.slice(0, half);
  const rowB = TESTIMONIALS.items.slice(half);

  const Card = ({ item }: { item: (typeof TESTIMONIALS.items)[number] }) => (
    <div className="summit-card flex w-80 shrink-0 flex-col gap-4 p-6">
      <p className="text-sm leading-relaxed text-summit-muted">&ldquo;{item.quote}&rdquo;</p>
      <div className="mt-auto flex items-center gap-3 pt-2">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
          <Image src={item.image} alt={item.author} fill sizes="40px" className="object-cover" />
        </div>
        <div>
          <p className="text-sm font-semibold text-summit-ink">{item.author}</p>
          <p className="text-xs text-summit-faint">{item.role}</p>
        </div>
      </div>
    </div>
  );

  return (
    <section id="testimonials" className="overflow-hidden py-16 sm:py-24">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <Reveal>
          <h2 className="font-summit-display text-3xl text-summit-ink sm:text-4xl">
            {TESTIMONIALS.title}
          </h2>
          {TESTIMONIALS.subhead ? (
            <p className="mt-4 text-base text-summit-muted">{TESTIMONIALS.subhead}</p>
          ) : null}
        </Reveal>
      </div>

      <div className="sr-only">
        {TESTIMONIALS.items.map((item) => (
          <p key={item.author}>
            {item.quote} — {item.author}, {item.role}
          </p>
        ))}
      </div>

      <div aria-hidden="true" className="mt-12 flex flex-col gap-5">
        <div className="flex w-max gap-5 summit-marquee-track">
          {[...rowA, ...rowA].map((item, i) => (
            <Card key={`${item.author}-${i}`} item={item} />
          ))}
        </div>
        <div className="flex w-max gap-5 summit-marquee-track-reverse">
          {[...rowB, ...rowB].map((item, i) => (
            <Card key={`${item.author}-${i}`} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
