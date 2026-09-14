"use client";

import CountUpStat from "../components/CountUpStat";
import WordsReveal from "../components/WordsReveal";
import { STATS } from "../defaults";
import { useContent } from "../context";

export default function StatsBlock() {
  const { STATS } = useContent();
  return (
    <section className="px-5 py-20 md:px-10">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="font-display text-3xl leading-tight text-[var(--fg)] md:text-5xl">
          <WordsReveal text={STATS.heading} />
        </h2>
        <div className="mt-14 grid grid-cols-2 gap-10 md:grid-cols-4">
          <CountUpStat value={STATS.tripsBooked} label="Trips Booked" />
          <CountUpStat value={STATS.destinationsCovered} label="Destinations Covered" />
          <CountUpStat value={STATS.verifiedStays} label="Verified Stays" />
          <CountUpStat value={STATS.customerRating} label="Customer Rating" />
        </div>
      </div>
    </section>
  );
}
