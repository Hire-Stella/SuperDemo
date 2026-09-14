"use client";

import Image from "next/image";
import { WHY_MOMENTUM } from "../../defaults";
import Reveal, { RevealGroup, RevealItem } from "../../components/Reveal";
import { useContent } from "../../context";

export default function WhyMomentum() {
  const { WHY_MOMENTUM } = useContent();
  return (
    <section id="why-momentum" className="bg-ink py-24 text-cream">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-accent">
            {WHY_MOMENTUM.eyebrow}
          </p>
          <h2 className="font-display mt-4 text-4xl font-semibold sm:text-5xl">
            {WHY_MOMENTUM.title}
          </h2>
          <p className="mt-4 text-base text-cream/70">{WHY_MOMENTUM.subhead}</p>
        </Reveal>

        <RevealGroup className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_MOMENTUM.features.map((feature) => (
            <RevealItem
              key={feature.title}
              className="group relative overflow-hidden rounded-3xl border border-white/10"
            >
              <div className="relative aspect-[3/4]">
                <Image
                  src={feature.image}
                  alt={feature.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
              </div>

              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="text-lg font-medium leading-snug text-white">
                  {feature.title}
                </p>
                {feature.callout && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-lime px-4 py-2">
                    <span className="font-display text-xl font-semibold text-ink">
                      {feature.callout.value}
                    </span>
                    <span className="text-xs text-ink/80">
                      {feature.callout.label}
                    </span>
                  </div>
                )}
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
