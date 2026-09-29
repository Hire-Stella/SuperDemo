'use client';

import Image from 'next/image';
import { KeyRound, Layers, Zap, type LucideIcon } from 'lucide-react';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/** Matches the schema's own `icon` field, which names a lucide icon. */
const ICONS: Record<string, LucideIcon> = {
  'key-round': KeyRound,
  layers: Layers,
  zap: Zap,
};

/**
 * The middle "15+ Supported Assets" card's own real visual in the source: a
 * vertically auto-scrolling ticker of five coin rows (confirmed against the
 * source's own `data-framer-name="Ticker"` list, `ul.ticker-item` markup).
 * Live market data has no schema field — this renders the same fixed rows
 * every load, the way a real deployment would swap in a live price feed
 * without touching tenant content (see defaults.ts's `TICKER`).
 */
function Ticker() {
  const { TICKER } = useContent();
  const rows = [...TICKER, ...TICKER];

  return (
    <div className="cryptix-card relative h-full max-h-56 overflow-hidden border border-cryptix-border bg-cryptix-bg/60 p-3">
      <div className="cryptix-ticker-track flex flex-col gap-2">
        {rows.map((coin, i) => (
          <div
            key={`${coin.symbol}-${i}`}
            className="flex items-center justify-between gap-3 rounded-full border border-cryptix-border bg-cryptix-surface px-4 py-2.5"
          >
            <span className="flex items-center gap-2">
              <span className="font-cryptix-mono text-xs font-medium text-cryptix-ink">{coin.symbol}</span>
              <span className="hidden text-xs text-cryptix-faint sm:inline">{coin.name}</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="font-cryptix-mono text-sm text-cryptix-ink">{coin.price}</span>
              <span
                className={`font-cryptix-mono text-xs ${coin.positive ? 'text-cryptix-accent' : 'text-cryptix-negative'}`}
              >
                {coin.change}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Features() {
  const { FEATURES } = useContent();

  return (
    <section id="features" className="bg-cryptix-bg py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-cryptix-link uppercase">
            {FEATURES.eyebrow}
          </p>
          <h2 className="font-cryptix-display mt-4 text-3xl text-cryptix-ink sm:text-4xl">{FEATURES.title}</h2>
          {FEATURES.subhead ? (
            <p className="mt-4 text-base text-cryptix-muted">{FEATURES.subhead}</p>
          ) : null}
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {FEATURES.items.map((item, i) => {
            const Icon = ICONS[item.icon] ?? Zap;
            return (
              <Reveal
                key={item.title}
                delay={i * 100}
                className="cryptix-card flex flex-col gap-5 border border-cryptix-border bg-cryptix-surface p-6"
              >
                {item.image ? (
                  <div className="cryptix-card relative aspect-[4/3] overflow-hidden border border-cryptix-border">
                    <Image src={item.image} alt={item.title} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
                  </div>
                ) : (
                  <Ticker />
                )}
                <div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cryptix-accent/10 text-cryptix-accent">
                    <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <h3 className="font-cryptix-display mt-4 text-lg text-cryptix-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-cryptix-muted">{item.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
