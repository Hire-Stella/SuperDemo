"use client";

import { FAQ } from "../../defaults";
import FaqAccordion from "../../components/FaqAccordion";
import Reveal from "../../components/Reveal";
import { useContent } from "../../context";

export default function Faq() {
  const { FAQ } = useContent();
  return (
    <section id="faq" className="bg-cream py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-accent">
            {FAQ.eyebrow}
          </p>
          <h2 className="font-display mt-4 text-4xl font-semibold sm:text-5xl">
            {FAQ.title}
          </h2>
          <p className="mt-4 text-base text-muted">{FAQ.subhead}</p>
        </Reveal>

        <Reveal className="mt-14" delay={0.15}>
          <FaqAccordion />
        </Reveal>
      </div>
    </section>
  );
}
