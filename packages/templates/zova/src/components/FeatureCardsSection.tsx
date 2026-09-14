"use client";

import { featureCards } from "../defaults";
import { featureIcon } from "./icons";
import { useContent } from "../context";

export function FeatureCardsSection() {
  const { featureCards } = useContent();
  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featureCards.map((feature) => {
            const Icon = featureIcon(feature.icon);
            return (
              <div
                key={feature.title}
                className="rounded-2xl border border-zv-line bg-zv-card p-6 transition-colors hover:bg-zv-card-2"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-zv-ink shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="zv-heading mt-4 text-base text-zv-ink">{feature.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-zv-muted">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
