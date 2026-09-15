"use client";

import { useId, useState } from "react";
import type { Faq } from "../defaults";

/**
 * The FAQ list. One row open at a time, matching the live behaviour;
 * rows are hairline-separated and the marker rotates rather than
 * swapping glyphs.
 */
export default function Accordion({ items }: { items: readonly Faq[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className="sg-hair flex w-full flex-col" style={{ background: "var(--sg-white)" }}>
      {items.map((item, index) => {
        const expanded = open === index;
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;

        return (
          <div
            key={item.question}
            className="border-b border-[var(--sg-border)] last:border-b-0"
          >
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpen(expanded ? null : index)}
                className="flex w-full items-center justify-between gap-6 px-5 py-5 text-left text-[15px] text-[var(--sg-text)]"
              >
                {item.question}
                <span
                  aria-hidden
                  className="relative size-[11px] shrink-0 transition-transform duration-300"
                  style={{
                    transform: expanded ? "rotate(45deg)" : "none",
                    transitionTimingFunction: "var(--sg-ease)",
                  }}
                >
                  <span
                    className="absolute top-1/2 left-0 h-[1px] w-full -translate-y-1/2"
                    style={{ background: "var(--sg-icon)" }}
                  />
                  <span
                    className="absolute top-0 left-1/2 h-full w-[1px] -translate-x-1/2"
                    style={{ background: "var(--sg-icon)" }}
                  />
                </span>
              </button>
            </h3>

            {/* Grid-rows animation keeps the panel height automatic while
                still transitioning, and keeps it out of the a11y tree
                and tab order while collapsed. */}
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!expanded}
              className="px-5 pb-5"
            >
              <p className="sg-body max-w-[70ch]">{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
