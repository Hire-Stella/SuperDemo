"use client";

import Link from "next/link";
import { useState } from "react";
import AsciiImage from "../components/AsciiImage";
import { ramps, testimonials } from "../defaults";
import { useContent } from "../context";

/**
 * The outcomes block: a company selector on the left, and the selected
 * client's quote plus ASCII portrait on the right. The portrait is
 * converted client-side against the 70-step luminance ramp.
 */
export default function Testimonials() {
  const { ramps, testimonials } = useContent();
  const [active, setActive] = useState(0);
  const item = testimonials.items[active];

  return (
    <div className="grid grid-cols-1 gap-px lg:grid-cols-[320px_1fr]">
      {/* Selector */}
      <div className="flex flex-col gap-px" role="tablist" aria-label="Clients">
        {testimonials.items.map((candidate, index) => {
          const selected = index === active;
          return (
            <button
              key={candidate.company}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="sg-testimonial-panel"
              onClick={() => setActive(index)}
              className="sg-hair flex flex-col gap-2 p-5 text-left transition-colors duration-200"
              style={{
                background: selected ? "var(--sg-surface)" : "var(--sg-white)",
              }}
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block size-[5px]"
                  style={{
                    background: selected ? "var(--sg-black)" : "var(--sg-marker)",
                  }}
                />
                <span className="text-[15px] text-[var(--sg-text)]">
                  {candidate.company}
                </span>
              </span>
              <span className="sg-small line-clamp-3">{candidate.overview}</span>
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div
        id="sg-testimonial-panel"
        role="tabpanel"
        className="sg-hair flex flex-col justify-between gap-8 p-7 md:flex-row md:items-end"
        style={{ background: "var(--sg-white)" }}
      >
        <div className="flex max-w-[62ch] flex-col gap-6">
          <blockquote className="text-[18px] leading-[1.6] text-[var(--sg-text)]">
            “{item.quote}”
          </blockquote>

          <div className="flex flex-col gap-1">
            <span className="text-[15px] text-[var(--sg-text)]">{item.name}</span>
            <span className="sg-small">
              {item.role}, {item.company}
            </span>
          </div>

          <Link
            href={`/case-studies/${item.caseStudySlug}`}
            className="inline-flex w-fit items-center gap-2 text-[13px] text-[var(--sg-text)] underline decoration-[var(--sg-border-strong)] underline-offset-4 transition-colors duration-200 hover:decoration-[var(--sg-black)]"
          >
            {testimonials.ctaLabel}
            <span aria-hidden>→</span>
          </Link>
        </div>

        <AsciiImage
          key={item.portrait.src}
          src={item.portrait.src}
          alt={item.portrait.alt}
          ramp={ramps.dense}
          color="var(--sg-ascii-grey)"
          width={220}
          height={260}
          className="shrink-0"
        />
      </div>
    </div>
  );
}
