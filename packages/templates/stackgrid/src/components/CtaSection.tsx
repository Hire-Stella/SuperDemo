"use client";

import Button from "../components/Button";
import Container from "../components/Container";
import Reveal from "../components/Reveal";
import { CAL_USERNAME, cta } from "../defaults";
import { useContent } from "../context";

/**
 * The closing booking panel.
 *
 * The original embeds a Cal.com widget pointed at an unconfigured
 * placeholder account, so the panel here is self-contained and its
 * primary action goes to /contact. Set CAL_USERNAME in lib/data to a
 * real handle and the note below flips to the booking language.
 */
export default function CtaSection() {
  const { CAL_USERNAME, cta } = useContent();
  return (
    <section className="py-24" style={{ background: "var(--sg-surface)" }}>
      <Container>
        <div
          className="sg-hair flex flex-col gap-10 p-8 md:flex-row md:items-center md:justify-between md:p-12"
          style={{ background: "var(--sg-white)" }}
        >
          <div className="flex max-w-[52ch] flex-col gap-4">
            <Reveal as="h2" className="sg-h2">
              {cta.heading}
            </Reveal>
            <Reveal as="p" delay={60} className="sg-body">
              {cta.subcopy}
            </Reveal>
          </div>

          <div className="flex flex-col gap-6">
            <ul className="flex flex-col gap-3">
              {cta.points.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-[7px] inline-block size-[5px] shrink-0"
                    style={{ background: "var(--sg-marker)" }}
                  />
                  <span className="sg-body">{point}</span>
                </li>
              ))}
            </ul>

            <Button href={CAL_USERNAME ? `https://cal.com/${CAL_USERNAME}` : cta.action.href}>
              {cta.action.label}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
