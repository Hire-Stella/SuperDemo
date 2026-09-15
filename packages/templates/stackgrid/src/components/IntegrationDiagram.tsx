"use client";

import Reveal from "../components/Reveal";
import { integration } from "../defaults";
import { useContent } from "../context";

/**
 * The hub-and-branch diagram.
 *
 * Each branch is a 2px-tall rule rotated about its left edge, with the
 * label pinned to its far end — the rotation angles, lengths and hub
 * offsets are the measured values stored in lib/data. Below 900px the
 * geometry is dropped for a plain stacked list, which is what the live
 * site does too.
 */
export default function IntegrationDiagram() {
  const { integration } = useContent();
  return (
    <>
      {/* Wide: the real diagram. */}
      <div className="relative hidden h-[360px] w-full items-center justify-center md:flex">
        <Reveal
          className="sg-hair z-10 flex h-[44px] items-center px-5 text-[13px] text-[var(--sg-text)]"
          style={{ background: "var(--sg-white)" }}
        >
          {integration.hubLabel}
        </Reveal>

        {integration.branches.map((branch, index) => (
          <div
            key={branch.title}
            aria-hidden
            className="absolute top-1/2 left-1/2"
            style={{
              transform: `translate(${branch.left}px, ${branch.top}px)`,
            }}
          >
            <div
              className="relative h-[2px] origin-left"
              style={{
                width: `${branch.length}px`,
                transform: `rotate(${branch.rotate}deg)`,
                background: "var(--sg-border-strong)",
              }}
            >
              <span
                className="absolute top-1/2 left-full ml-3 -translate-y-1/2 whitespace-nowrap text-[13px] text-[var(--sg-text-muted)]"
                style={{ transform: `translateY(-50%) rotate(${-branch.rotate}deg)` }}
              >
                {branch.title}
              </span>
            </div>
            <span className="sr-only">{branch.title}</span>
            {index === 0 && <span className="sr-only">{integration.hubLabel}</span>}
          </div>
        ))}
      </div>

      {/* Narrow: the same information, no geometry. */}
      <ul className="flex flex-col gap-px md:hidden">
        {integration.branches.map((branch) => (
          <li
            key={branch.title}
            className="sg-hair px-5 py-4 text-[14px] text-[var(--sg-text)]"
            style={{ background: "var(--sg-white)" }}
          >
            {branch.title}
          </li>
        ))}
      </ul>
    </>
  );
}
