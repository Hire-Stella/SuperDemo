"use client";

import Ascii from "../components/Ascii";
import Reveal from "../components/Reveal";
import { features } from "../defaults";
import { useContent } from "../context";

/**
 * The four capability cards: a 2x2 hairline grid where each card's
 * coloured artwork sits either above or below the copy (alternating, per
 * `artOnTop`) so the grid reads diagonally rather than in bands.
 */
export default function FeatureGrid() {
  const { features } = useContent();
  return (
    <div className="grid grid-cols-1 gap-px md:grid-cols-2">
      {features.cards.map((card, index) => (
        <Reveal
          key={card.title}
          delay={index * 80}
          className="sg-hair flex min-h-[420px] flex-col"
          style={{ background: "var(--sg-white)" }}
        >
          <div
            className={`flex flex-1 flex-col ${card.artOnTop ? "" : "flex-col-reverse"}`}
          >
            <div className="flex flex-1 items-center justify-center overflow-hidden p-6">
              <Ascii art={card.art} color={card.color} />
            </div>

            <div className="flex flex-col gap-2 px-6 py-7">
              <h3 className="sg-h3">{card.title}</h3>
              <p className="sg-body max-w-[38ch]">{card.description}</p>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
