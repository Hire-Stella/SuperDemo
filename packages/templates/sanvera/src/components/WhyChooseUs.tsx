"use client";

import Image from "next/image";
import { Reveal } from "./Reveal";
import { CountUp } from "./CountUp";
import { useSanvera } from "../context";

export default function WhyChooseUs() {
  const { WHY_CHOOSE, BRAND_NAME } = useSanvera();
  return (
    <section className="bg-pattern bg-[var(--cream)] px-6 pb-24 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-end">
          <Reveal className="order-2 h-[320px] overflow-hidden rounded-2xl shadow-xl md:order-1 md:h-[420px]">
            <Image
              src={WHY_CHOOSE.image}
              alt={`Why choose ${BRAND_NAME}`}
              width={700}
              height={840}
              className="h-full w-full object-cover"
            />
          </Reveal>

          <div className="order-1 md:order-2">
            <Reveal>
              <span className="eyebrow-pill">{WHY_CHOOSE.eyebrow}</span>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="mt-6 font-display text-3xl font-bold uppercase leading-[1.05] text-[var(--maroon)] sm:text-5xl">
                {WHY_CHOOSE.heading}
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-[var(--maroon)]/75">
                {WHY_CHOOSE.paragraph}
              </p>
            </Reveal>
            <Reveal delay={0.3} className="mt-6">
              <a href="#faq" className="btn-orange">
                {WHY_CHOOSE.cta}
                <span className="icon-badge">↗</span>
              </a>
            </Reveal>
          </div>
        </div>

        <Reveal delay={0.15}>
          <div className="mt-16 grid grid-cols-2 gap-x-6 gap-y-10 divide-[var(--maroon)]/15 sm:grid-cols-4 sm:divide-x">
            {WHY_CHOOSE.stats.map((s) => (
              <div key={s.label} className="px-2 first:pl-0">
                <div className="font-display text-3xl font-bold text-[var(--maroon)] sm:text-4xl">
                  <CountUp value={s.value} suffix={s.suffix} />
                </div>
                <div className="mt-1 text-xs text-[var(--maroon)]/70">{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
