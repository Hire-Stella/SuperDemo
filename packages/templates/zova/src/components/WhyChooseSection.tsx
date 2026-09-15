"use client";

import Image from "next/image";

import { benefitRows, whyChooseHeading, whyChooseSubhead } from "../defaults";
import { TypewriterLine } from "./TypewriterLine";
import { useContent } from "../context";

function TypewriterVisual() {
  return (
    <div className="flex h-full min-h-56 items-center justify-center rounded-3xl border border-zv-line bg-zv-card p-8">
      <div className="w-full max-w-xs rounded-2xl border border-zv-line bg-white p-5 shadow-[0_12px_32px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          <p className="text-xs font-medium text-zv-muted">AI Assistant</p>
        </div>
        <p className="mt-3 min-h-10 text-sm text-zv-ink">
          <TypewriterLine />
        </p>
      </div>
    </div>
  );
}

function NotificationVisual() {
  return (
    <div className="flex h-full min-h-56 items-center justify-center rounded-3xl border border-zv-line bg-zv-card p-8">
      <div className="w-full max-w-xs rounded-2xl border border-zv-line bg-white p-4 shadow-[0_12px_32px_rgba(0,0,0,0.06)]">
        <p className="text-xs font-semibold text-zv-ink">Upcoming Investment Reminder</p>
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-zv-card p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-bold text-zv-ink shadow-sm">
            G
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zv-ink">Google</p>
            <p className="text-xs text-zv-muted">Recurring investment</p>
          </div>
          <p className="text-sm font-semibold text-zv-ink">$2,000 USD</p>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-zv-muted">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zv-card-2 text-[10px] font-semibold text-zv-ink">
            S
          </div>
          Confirmed by Sarah
        </div>
      </div>
    </div>
  );
}

function ImageVisual({ src }: { src: string }) {
  return (
    <div className="relative h-full min-h-56 overflow-hidden rounded-3xl border border-zv-line bg-zv-card">
      <Image src={src} alt="Zova dashboard screenshot" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
    </div>
  );
}

export function WhyChooseSection() {
  const { benefitRows, whyChooseHeading, whyChooseSubhead } = useContent();
  return (
    <section id="feature" className="py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <h2 className="zv-heading text-3xl text-zv-ink sm:text-4xl">{whyChooseHeading}</h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-zv-muted">{whyChooseSubhead}</p>
      </div>

      <div className="mx-auto mt-14 flex max-w-5xl flex-col gap-16 px-6">
        {benefitRows.map((row, index) => {
          const reversed = index % 2 === 1;
          return (
            <div
              key={row.title}
              className={`grid items-center gap-10 lg:grid-cols-2 ${reversed ? "lg:[&>*:first-child]:order-2" : ""}`}
            >
              <div>
                <h3 className="zv-heading text-2xl text-zv-ink">{row.title}</h3>
                <p className="mt-4 text-base leading-relaxed text-zv-muted">{row.description}</p>
              </div>
              <div>
                {row.visual === "typewriter" && <TypewriterVisual />}
                {row.visual === "notification" && <NotificationVisual />}
                {row.visual === "image" && row.image && <ImageVisual src={row.image} />}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
