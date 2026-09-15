"use client";

import { portfolioRows, processHeading, processSteps, processSubhead } from "../defaults";
import { useContent } from "../context";

function PortfolioPanel({ showOverlay }: { showOverlay?: boolean }) {
  return (
    <div className="relative h-56 overflow-hidden rounded-2xl border border-zv-line bg-white p-4">
      <div className="flex flex-col gap-2.5 blur-[1.5px]">
        {portfolioRows.map((row) => (
          <div key={row.ticker} className="flex items-center gap-3 rounded-lg bg-zv-card px-3 py-2">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
              style={{ backgroundColor: row.color }}
            >
              {row.ticker.slice(0, 2)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-zv-ink">{row.name}</p>
              <p className="text-[11px] text-zv-muted">{row.date}</p>
            </div>
            <p className="shrink-0 text-[11px] font-medium text-zv-muted">{row.shares}</p>
          </div>
        ))}
      </div>

      {showOverlay && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/40">
          <div className="w-56 rounded-xl border border-zv-line bg-white p-4 shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zv-ink text-white">
                <span className="h-2 w-2 rounded-full bg-white" />
              </span>
              <p className="text-xs font-semibold text-zv-ink">Processing your data</p>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zv-card-2">
              <div className="zv-progress-bar h-full rounded-full bg-zv-ink" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProcessSection() {
  const { portfolioRows, processHeading, processSteps, processSubhead } = useContent();
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <h2 className="zv-heading text-3xl text-zv-ink sm:text-4xl">{processHeading}</h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-zv-muted">{processSubhead}</p>
      </div>

      <div className="mx-auto mt-14 grid max-w-5xl gap-6 px-6 sm:grid-cols-3">
        {processSteps.map((step) => (
          <div key={step.number} className="rounded-3xl border border-zv-line bg-zv-card p-5">
            <PortfolioPanel showOverlay={step.number === "02"} />
            <p className="zv-heading mt-5 text-sm text-zv-muted">{step.number}</p>
            <p className="zv-heading mt-1 text-lg text-zv-ink">{step.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-zv-muted">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
