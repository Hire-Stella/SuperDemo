'use client';

import { CreditCard, Mail, TrendingUp } from 'lucide-react';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's own second feature band: three cards, each fronted by a
 * live mockup rather than a photo — a payment-link checkout card, the same
 * dashboard-stat trio as the hero's live numbers, and an email-list panel.
 * All three are real DOM in the source (confirmed against its SSR text
 * nodes), so all three are rebuilt here as real markup rather than raster
 * crops — the same reasoning `STATS`' own doc comment gives.
 */
export default function Services() {
  const { SERVICES, STATS, CHECKOUT_DEMO } = useContent();

  return (
    <section id="services" className="bg-fluxo-surface py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold tracking-[0.16em] text-fluxo-accent uppercase">
            {SERVICES.eyebrow}
          </p>
          <h2 className="font-fluxo-display mt-4 text-3xl text-fluxo-ink sm:text-4xl">
            {SERVICES.title}
          </h2>
          {SERVICES.subhead ? (
            <p className="mt-3 text-base text-fluxo-muted">{SERVICES.subhead}</p>
          ) : null}
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {SERVICES.items.map((item, i) => (
            <Reveal
              key={item.name}
              delay={i * 100}
              className="fluxo-card flex flex-col overflow-hidden border border-fluxo-border bg-white"
            >
              <div className="flex min-h-56 items-center justify-center bg-fluxo-surface p-6">
                {item.category === 'checkout' ? <CheckoutMockup demo={CHECKOUT_DEMO} /> : null}
                {item.category === 'stats' ? <StatsMockup stats={STATS} /> : null}
                {item.category === 'email' ? <EmailMockup /> : null}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-7">
                <p className="font-fluxo-display text-lg text-fluxo-ink">{item.name}</p>
                <p className="text-sm leading-relaxed text-fluxo-muted">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** The source's own live payment-link checkout-card mockup, hand-rebuilt. */
function CheckoutMockup({
  demo,
}: {
  demo: { product: string; price: string; cardNumber: string; cta: string };
}) {
  return (
    <div className="w-full max-w-[260px] rounded-2xl border border-fluxo-border bg-white p-4 shadow-[0_20px_40px_-24px_rgba(17,14,52,0.35)]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-fluxo-ink">{demo.product}</span>
        <span className="text-sm font-semibold text-fluxo-ink">{demo.price}</span>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-fluxo-border px-3 py-2">
        <CreditCard size={16} strokeWidth={1.8} className="text-fluxo-faint" aria-hidden="true" />
        <span className="font-mono text-xs text-fluxo-muted">{demo.cardNumber}</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-fluxo-border px-3 py-2 text-xs text-fluxo-faint">
          MM / YY
        </div>
        <div className="rounded-lg border border-fluxo-border px-3 py-2 text-xs text-fluxo-faint">
          CVV
        </div>
      </div>
      <div className="fluxo-pill mt-3 flex items-center justify-center bg-fluxo-primary py-2 text-xs font-semibold text-white">
        {demo.cta}
      </div>
    </div>
  );
}

/** The source's own live dashboard-stat trio — see defaults.ts's `STATS`. */
function StatsMockup({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <div className="grid w-full max-w-[280px] grid-cols-1 gap-2.5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center justify-between rounded-xl border border-fluxo-border bg-white px-4 py-3"
        >
          <span className="text-xs text-fluxo-muted">{stat.label}</span>
          <span className="font-fluxo-display text-base text-fluxo-ink">{stat.value}</span>
        </div>
      ))}
    </div>
  );
}

/** This port's own small email-list panel, in the same mockup register. */
function EmailMockup() {
  return (
    <div className="w-full max-w-[260px] rounded-2xl border border-fluxo-border bg-white p-4 shadow-[0_20px_40px_-24px_rgba(17,14,52,0.35)]">
      <div className="flex items-center gap-2 border-b border-fluxo-border pb-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-fluxo-primary text-white">
          <Mail size={15} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold text-fluxo-ink">Customer list</span>
        <span className="ml-auto flex items-center gap-1 text-xs text-fluxo-accent">
          <TrendingUp size={13} strokeWidth={2} aria-hidden="true" />
          +18%
        </span>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {[80, 55, 68].map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-6 w-6 shrink-0 rounded-full bg-fluxo-surface" />
            <span className="h-2 rounded-full bg-fluxo-surface" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}
