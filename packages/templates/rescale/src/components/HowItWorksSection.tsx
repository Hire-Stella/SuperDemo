"use client";

import Image from "next/image";

import { processSteps } from "../defaults";
import { Reveal } from "./Reveal";
import { useContent } from "../context";

export function HowItWorksSection() {
  const { processSteps } = useContent();
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-rs-bg py-20 sm:py-24">
      <Image
        src="/t/rescale/images/bg-blur-shape-2.png"
        alt=""
        fill
        className="pointer-events-none object-cover opacity-90"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="rs-eyebrow">How it Works</span>
          <h2 className="rs-heading mt-3 text-4xl text-rs-ink sm:text-5xl">
            <span className="rs-gradient-text">Explore</span> Our Simple, Easy Process
          </h2>
          <p className="mt-4 text-base text-rs-muted">
            Start with ease and watch your business thrive from the get-go with personalized
            guidance every step of the way.
          </p>
        </Reveal>

        <div className="relative mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {processSteps.map((step, i) => (
            <Reveal
              key={step.step}
              delay={i * 110}
              className="rs-gradient-diagonal-light relative flex flex-col rounded-3xl border border-black/5 p-6 shadow-sm"
            >
              <span className="inline-flex w-fit rounded-full bg-white px-3.5 py-1.5 text-xs font-bold tracking-wide text-rs-brand-dark uppercase shadow-sm">
                {step.step}
              </span>

              <div className="mt-6 flex h-28 items-center justify-center">
                <Image
                  src={`/t/rescale/images/step-illustration-${i + 1}.svg`}
                  alt=""
                  width={510}
                  height={416}
                  className="h-full w-auto"
                />
              </div>

              <h3 className="rs-heading mt-6 text-lg text-rs-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-rs-muted">{step.description}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="rs-gradient-diagonal mt-14 flex flex-col items-center justify-between gap-6 rounded-3xl px-8 py-10 text-center text-white sm:flex-row sm:text-left">
          <p className="text-lg font-semibold sm:text-xl">
            Seamless integration with expert guidance
          </p>
          <a
            href="/#integration"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-rs-brand-dark transition-transform hover:scale-[1.03]"
          >
            Connect Now
          </a>
        </Reveal>
      </div>
    </section>
  );
}
