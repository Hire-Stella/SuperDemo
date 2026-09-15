"use client";

import Accordion from "./components/Accordion";
import AsciiImage from "./components/AsciiImage";
import AsciiVideo from "./components/AsciiVideo";
import Button from "./components/Button";
import Container from "./components/Container";
import CtaSection from "./components/CtaSection";
import FeatureGrid from "./components/FeatureGrid";
import IntegrationDiagram from "./components/IntegrationDiagram";
import Marquee from "./components/Marquee";
import Pricing from "./components/Pricing";
import Reveal from "./components/Reveal";
import SectionHeading from "./components/SectionHeading";
import Testimonials from "./components/Testimonials";
import { customers, faq, features, hero, integration, pricing, ramps, solution, testimonials } from "./defaults";
import { useContent } from "./context";

export default function Home() {
  const { customers, faq, features, hero, integration, pricing, ramps, solution, testimonials } = useContent();
  return (
    <>
      {/* ------------------------------ hero ------------------------------ */}
      <section className="pt-16 pb-20">
        <Container>
          <div className="flex flex-col items-center gap-8 text-center">
            <Reveal as="h1" className="sg-display max-w-[18ch]">
              {hero.headline}
            </Reveal>

            <Reveal as="p" delay={80} className="sg-body max-w-[52ch]">
              {hero.subcopy}
            </Reveal>

            <Reveal delay={160} className="flex flex-wrap items-center justify-center gap-3">
              <Button href={hero.secondaryCta.href} variant="secondary">
                {hero.secondaryCta.label}
              </Button>
              <Button href={hero.primaryCta.href}>{hero.primaryCta.label}</Button>
            </Reveal>

            <Reveal delay={240} className="mt-6 flex w-full justify-center overflow-hidden">
              <AsciiVideo />
            </Reveal>
          </div>
        </Container>
      </section>

      {/* --------------------------- customers --------------------------- */}
      <section className="sg-hair sg-hair-x py-12">
        <Container>
          <div className="flex flex-col gap-6">
            <p className="text-center text-[13px] text-[var(--sg-text-label)]">
              {customers.label}
            </p>
            <Marquee items={customers.logos.map((logo) => <span key={logo}>{logo}</span>)} />
          </div>
        </Container>
      </section>

      {/* --------------------------- solution --------------------------- */}
      <section id="the-solution" className="py-24">
        <Container>
          <div className="flex flex-col gap-12">
            <SectionHeading heading={solution.heading} subcopy={solution.subcopy} />

            <div
              className="sg-hair grid grid-cols-1 items-center gap-px md:grid-cols-2"
              style={{ background: "var(--sg-white)" }}
            >
              <div className="flex items-center justify-center overflow-hidden p-8">
                <AsciiImage
                  src={solution.photo.src}
                  alt={solution.photo.alt}
                  ramp={ramps.dense}
                  color="var(--sg-ascii-grey)"
                  width={420}
                  height={300}
                />
              </div>

              <div className="flex items-center justify-center overflow-hidden border-t border-[var(--sg-border)] p-8 md:border-t-0 md:border-l">
                <span
                  className="text-[44px] leading-none text-[var(--sg-text)]"
                  style={{ fontFamily: "var(--font-instrument-serif), serif" }}
                >
                  {solution.asciiLabel}
                </span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* --------------------------- features --------------------------- */}
      <section className="py-24" style={{ background: "var(--sg-surface)" }}>
        <Container>
          <div className="flex flex-col gap-12">
            <SectionHeading
              eyebrow={features.eyebrow}
              heading={features.heading}
              subcopy={features.subcopy}
            />
            <FeatureGrid />
          </div>
        </Container>
      </section>

      {/* -------------------------- integration -------------------------- */}
      <section className="py-24">
        <Container>
          <div className="flex flex-col gap-8">
            <SectionHeading
              heading={integration.heading}
              subcopy={integration.subcopy}
            />
            <IntegrationDiagram />
          </div>
        </Container>
      </section>

      {/* ---------------------------- pricing ---------------------------- */}
      <section id="pricing" className="py-24" style={{ background: "var(--sg-surface)" }}>
        <Container>
          <div className="flex flex-col gap-12">
            <SectionHeading heading={pricing.heading} subcopy={pricing.subcopy} />
            <Pricing />
          </div>
        </Container>
      </section>

      {/* -------------------------- testimonials -------------------------- */}
      <section className="py-24">
        <Container>
          <div className="flex flex-col gap-12">
            <SectionHeading
              heading={testimonials.heading}
              subcopy={testimonials.subcopy}
            />
            <Testimonials />
          </div>
        </Container>
      </section>

      {/* ------------------------------ faq ------------------------------ */}
      <section className="py-24" style={{ background: "var(--sg-surface)" }}>
        <Container>
          <div className="flex flex-col gap-12">
            <SectionHeading heading={faq.heading} subcopy={faq.subcopy} />
            <div className="mx-auto w-full max-w-[860px]">
              <Accordion items={faq.items} />
            </div>
          </div>
        </Container>
      </section>

      <CtaSection />
    </>
  );
}
