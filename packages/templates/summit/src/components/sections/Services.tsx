'use client';

import { ArrowRight, LineChart, PieChart, ShieldCheck, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

const ICONS: Record<string, LucideIcon> = {
  'line-chart': LineChart,
  'pie-chart': PieChart,
  'shield-check': ShieldCheck,
};

/**
 * The source's own "Smarter Investing Starts Here" band: three service
 * cards, each with a "Learn More" link. The source shows no image or price
 * in this band (see defaults.ts), so each card is icon-led rather than
 * padded with an image the source never had.
 */
export default function Services() {
  const { SERVICES } = useContent();

  return (
    <section id="benefits" className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <h2 className="font-summit-display text-3xl text-summit-ink sm:text-4xl">
            {SERVICES.title}
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {SERVICES.items.map((item, i) => {
            const Icon = ICONS[item.icon] ?? LineChart;
            return (
              <Reveal key={item.name} delay={i * 90} className="summit-card flex flex-col gap-4 p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-white/10">
                  <Icon size={20} className="text-summit-gold" aria-hidden="true" strokeWidth={2} />
                </div>
                <h3 className="font-summit-display text-lg text-summit-ink">{item.name}</h3>
                <p className="text-sm leading-relaxed text-summit-muted">{item.body}</p>
                {item.cta ? (
                  <Link
                    href="#pricing"
                    className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-summit-gold transition-colors hover:text-summit-orange"
                  >
                    {item.cta}
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                ) : null}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
