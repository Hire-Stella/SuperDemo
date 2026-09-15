"use client";

import Button from "../components/Button";
import Reveal from "../components/Reveal";
import { pricing } from "../defaults";
import { useContent } from "../context";

/** The three service tiers, as a hairline three-up. */
export default function Pricing() {
  const { pricing } = useContent();
  return (
    <div className="grid grid-cols-1 gap-px md:grid-cols-3">
      {pricing.tiers.map((tier, index) => (
        <Reveal
          key={tier.name}
          delay={index * 80}
          className="sg-hair flex flex-col gap-6 p-7"
          style={{ background: "var(--sg-white)" }}
        >
          <div className="flex flex-col gap-2">
            <span className="text-[13px] text-[var(--sg-text-label)]">{tier.label}</span>
            <h3 className="sg-h3">{tier.name}</h3>
            <p className="sg-body">{tier.description}</p>
          </div>

          <p className="flex items-baseline gap-1">
            <span
              className="text-[34px] leading-none text-[var(--sg-text)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {tier.price}
            </span>
            {tier.byline && <span className="sg-small">{tier.byline}</span>}
          </p>

          <Button href={tier.cta.href}>{tier.cta.label}</Button>

          <ul className="flex flex-col gap-3 border-t border-[var(--sg-border)] pt-6">
            {tier.points.map((point) => (
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
        </Reveal>
      ))}
    </div>
  );
}
