"use client";

import Link from "next/link";
import AsciiImage from "../components/AsciiImage";
import Reveal from "../components/Reveal";
import { caseStudiesIndex, ramps, type CaseStudy } from "../defaults";
import { useContent } from "../context";

/**
 * One case study in the listing grid. `featured` is the wide variant
 * used for the pinned study above the "all case studies" grid.
 */
export default function CaseStudyCard({
  study,
  featured = false,
  delay = 0,
}: {
  study: CaseStudy;
  featured?: boolean;
  delay?: number;
}) {
  const { caseStudiesIndex, ramps } = useContent();
  return (
    <Reveal
      delay={delay}
      className={`sg-hair group flex flex-col ${featured ? "md:flex-row" : ""}`}
      style={{ background: "var(--sg-white)" }}
    >
      <div
        className={`flex items-center justify-center overflow-hidden border-b border-[var(--sg-border)] p-6 ${
          featured ? "md:w-[46%] md:border-b-0 md:border-r" : ""
        }`}
        style={{ background: "var(--sg-surface)" }}
      >
        <AsciiImage
          src={study.thumbnail.src}
          alt={study.thumbnail.alt}
          ramp={ramps.blocks}
          color="var(--sg-ascii-grey)"
          width={featured ? 420 : 340}
          height={featured ? 280 : 210}
        />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-7">
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-[var(--sg-text-label)]">
            {study.industry}
          </span>
          <span aria-hidden className="text-[var(--sg-border-strong)]">
            /
          </span>
          <span className="sg-small">{study.date}</span>
        </div>

        <h3 className={featured ? "sg-h2 text-[28px]" : "sg-h3"}>{study.title}</h3>
        <p className="sg-body max-w-[62ch]">{study.summary}</p>

        {featured && (
          <ul className="mt-2 grid grid-cols-1 gap-px sm:grid-cols-3">
            {study.metrics.map((metric) => (
              <li
                key={metric.label}
                className="sg-hair flex flex-col gap-1 p-4"
                style={{ background: "var(--sg-bg)" }}
              >
                <span
                  className="text-[22px] leading-none text-[var(--sg-text)]"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {metric.value}
                </span>
                <span className="sg-small">{metric.label}</span>
              </li>
            ))}
          </ul>
        )}

        <Link
          href={`/case-studies/${study.slug}`}
          className="mt-auto inline-flex w-fit items-center gap-2 pt-2 text-[13px] text-[var(--sg-text)] underline decoration-[var(--sg-border-strong)] underline-offset-4 transition-colors duration-200 group-hover:decoration-[var(--sg-black)]"
        >
          {caseStudiesIndex.ctaLabel}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </Reveal>
  );
}
