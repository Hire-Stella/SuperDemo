"use client";

import { RESULTS } from "../../defaults";
import ResultsSlideshow from "../../components/ResultsSlideshow";
import Reveal from "../../components/Reveal";
import { useContent } from "../../context";

export default function Results() {
  const { RESULTS } = useContent();
  return (
    <section id="results" className="bg-ink py-24 text-cream">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-accent">
            {RESULTS.eyebrow}
          </p>
          <h2 className="font-display mt-4 text-4xl font-semibold sm:text-5xl">
            {RESULTS.title}
          </h2>
          <p className="mt-4 text-base text-cream/70">{RESULTS.subhead}</p>
        </Reveal>

        <Reveal className="mt-14" delay={0.15}>
          <ResultsSlideshow />
        </Reveal>
      </div>
    </section>
  );
}
