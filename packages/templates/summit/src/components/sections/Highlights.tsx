'use client';

import { Activity, Shuffle, Target, Zap, type LucideIcon } from 'lucide-react';
import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

const ICONS: Record<string, LucideIcon> = { target: Target, shuffle: Shuffle, activity: Activity, zap: Zap };

/**
 * The intro band's own four-card grid: each card pairs an icon badge in the
 * source's own literal gradient-badge colour with one of the source's real
 * isometric illustration assets (see defaults.ts for how each was matched).
 */
export default function Highlights() {
  const { HIGHLIGHTS } = useContent();

  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {HIGHLIGHTS.items.map((item, i) => {
            const Icon = ICONS[item.icon] ?? Target;
            return (
              <Reveal key={item.title} delay={i * 90} className="summit-card overflow-hidden p-7">
                <div className="summit-glow flex h-11 w-11 items-center justify-center rounded-[10px]">
                  <Icon size={20} className="text-summit-bg" aria-hidden="true" strokeWidth={2.25} />
                </div>
                <h3 className="font-summit-display mt-5 text-xl text-summit-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-summit-muted">{item.body}</p>
                {item.image ? (
                  <div className="relative mt-6 h-40 w-full overflow-hidden rounded-lg bg-white/5">
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 420px, 90vw"
                      className="object-contain p-4"
                    />
                  </div>
                ) : null}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
