"use client";

import Image from "next/image";

import { performanceStats } from "../defaults";
import { CountUp } from "./CountUp";
import { useContent } from "../context";

export function PerformanceSection() {
  const { performanceStats } = useContent();
  return (
    <section id="performance" className="relative overflow-hidden bg-rs-ink py-20 text-white sm:py-24">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-40">
        <Image src="/t/rescale/images/performance-bg.png" alt="" fill className="object-cover" />
      </div>
      <div className="rs-gradient-diagonal absolute inset-0 -z-20 opacity-90" />

      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="rs-eyebrow text-white/70">Performance</span>
          <h2 className="rs-heading mt-3 text-3xl text-white sm:text-4xl">
            Our Milestones, your Advantage
          </h2>
          <p className="mt-4 text-base text-white/80">
            Driving measurable growth worldwide with every campaign launched, user supported, and
            AI-driven solution delivered.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
          {performanceStats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/15 bg-white/10 p-5 text-center backdrop-blur-sm">
              <CountUp
                target={stat.target}
                prefix={stat.prefix}
                suffix={stat.suffix}
                className="rs-heading block text-3xl text-white"
              />
              <p className="mt-2 text-xs text-white/70">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-6 rounded-3xl border border-white/15 bg-white/10 px-8 py-8 backdrop-blur-sm sm:flex-row">
          <p className="text-base text-white/90">
            Experience our analytics engine how we shape businesses worldwide.
          </p>
          <a
            href="/#pricing"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-rs-ink transition-transform hover:scale-[1.03]"
          >
            Analytics Demo
          </a>
        </div>
      </div>
    </section>
  );
}
