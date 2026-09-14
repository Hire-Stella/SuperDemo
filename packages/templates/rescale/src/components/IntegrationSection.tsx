"use client";

import Image from "next/image";

import { integrationHighlights, integrationLogos, integrationReliability } from "../defaults";
import { CountUp } from "./CountUp";
import { Reveal } from "./Reveal";
import { useContent } from "../context";

export function IntegrationSection() {
  const { integrationHighlights, integrationLogos, integrationReliability } = useContent();
  return (
    <section id="integration" className="rs-gradient-soft relative overflow-hidden py-20 sm:py-24">
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="rs-eyebrow">Integration</span>
          <h2 className="rs-heading mt-3 text-4xl text-rs-ink sm:text-5xl">
            <span className="rs-gradient-text">Powerful Integrations</span> Made Simple
          </h2>
          <p className="mt-4 text-base text-rs-muted">
            Integrate your favorite platforms into one powerful ecosystem, enabling seamless
            collaboration and enhanced efficiency.
          </p>
        </Reveal>

        {/* Bento grid — tall "Analytics Module" panel beside four smaller cells */}
        <div className="mt-14 grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
          <Reveal className="rs-gradient-diagonal-light flex flex-col rounded-3xl border border-black/5 p-7 shadow-sm lg:row-span-2">
            <div className="flex items-center gap-2">
              <Image src="/t/rescale/images/integration-icon-1.svg" alt="" width={14} height={16} />
              <span className="text-sm font-medium text-rs-muted">Advanced Architecture</span>
            </div>

            <div className="my-10 flex flex-1 items-center justify-center">
              <Image
                src="/t/rescale/images/integration-icon-2.svg"
                alt=""
                width={40}
                height={46}
                className="h-36 w-auto"
              />
            </div>

            <h3 className="rs-heading text-2xl text-rs-brand-dark">Analytics Module</h3>
            <p className="mt-2 text-sm leading-relaxed text-rs-muted">
              Optimize your integrations with performance metrics.
            </p>
          </Reveal>

          <Reveal
            delay={90}
            className="rs-gradient-diagonal-light flex flex-col items-center justify-center rounded-3xl border border-black/5 p-7 shadow-sm"
          >
            <Image
              src="/t/rescale/images/integration-illustration.png"
              alt=""
              width={380}
              height={380}
              className="w-32 max-w-full"
            />
            <p className="rs-heading mt-4 text-lg text-rs-ink">AI Model 3</p>
          </Reveal>

          <Reveal
            delay={150}
            className="rs-gradient-diagonal-light flex flex-col items-center justify-center gap-6 rounded-3xl border border-black/5 p-7 shadow-sm"
          >
            <div className="flex items-end gap-3" aria-hidden="true">
              <span className="flex h-11 w-11 gap-1 rounded-md border border-rs-brand/40 p-1">
                <span className="flex-1 rounded-sm border border-rs-brand/25" />
                <span className="flex-1 rounded-sm border border-rs-brand/25" />
              </span>
              <span className="flex h-14 w-14 flex-col gap-1 rounded-md border-2 border-dashed border-rs-brand/60 p-1">
                <span className="h-3 rounded-sm border border-rs-brand/40" />
                <span className="flex-1 rounded-sm border border-rs-brand/40" />
              </span>
              <span className="flex h-11 w-11 flex-col gap-1 rounded-md border border-rs-brand/40 p-1">
                <span className="h-2.5 rounded-sm border border-rs-brand/25" />
                <span className="flex-1 rounded-sm border border-rs-brand/25" />
              </span>
            </div>
            <p className="rs-heading text-lg text-rs-ink">Integration Templates</p>
          </Reveal>

          <Reveal
            delay={90}
            className="rs-gradient-diagonal-light flex flex-col justify-center gap-5 rounded-3xl border border-black/5 p-7 shadow-sm"
          >
            {integrationHighlights.map((item) => (
              <div key={item.label}>
                <p className="text-sm text-rs-ink">
                  <span className="rs-heading mr-2 text-base">{item.value}</span>
                  {item.label}
                </p>
                <span className="rs-gradient-sky mt-2 block h-1.5 w-full rounded-full opacity-80" />
              </div>
            ))}
          </Reveal>

          <Reveal
            delay={150}
            className="rs-gradient-diagonal-light flex flex-col justify-between rounded-3xl border border-black/5 p-7 shadow-sm"
          >
            <Image src="/t/rescale/images/integration-icon-3.svg" alt="" width={26} height={27} className="h-7 w-7" />
            <div>
              <CountUp
                target={integrationReliability.target}
                suffix={integrationReliability.suffix}
                className="rs-heading block text-4xl text-rs-ink"
              />
              <p className="mt-1 text-xs text-rs-muted">{integrationReliability.label}</p>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-10 flex flex-col items-center gap-6 rounded-3xl border border-black/5 bg-white/70 p-7 backdrop-blur-sm lg:flex-row lg:justify-between">
          <p className="max-w-xs text-center text-sm font-medium text-rs-ink lg:text-left">
            Your favorite platforms are ready to be connected.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {integrationLogos.map((logo) => (
              <div
                key={logo}
                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-black/5 bg-white shadow-sm"
              >
                <Image src={logo} alt="Integration partner logo" width={26} height={26} className="h-6 w-6" />
              </div>
            ))}
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-black/5 bg-white shadow-sm">
              <Image
                src="/t/rescale/images/integration-icon-4.svg"
                alt="Integration partner logo"
                width={28}
                height={28}
                className="h-6 w-6"
              />
            </div>
          </div>
        </Reveal>

        <Reveal className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-rs-muted">
            Receive assistance from our integration specialists.
          </p>
          <a
            href="/contact"
            className="rs-gradient-brand inline-flex shrink-0 items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.03]"
          >
            Instant Support
          </a>
        </Reveal>
      </div>

      <Image
        src="/t/rescale/images/bg-blur-shape-3.png"
        alt=""
        fill
        className="pointer-events-none object-cover opacity-70 mix-blend-multiply"
      />
    </section>
  );
}
