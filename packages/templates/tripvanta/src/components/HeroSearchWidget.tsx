"use client";

import { useState } from "react";
import CtaArrowBadge from "../components/CtaArrowBadge";
import { GUEST_OPTIONS_HERO } from "../defaults";
import { useContent } from "../context";

/**
 * "Plan Your Trip" hero search widget: real controlled form, client-side
 * only. Cosmetic/placeholder submit -- no backend (see NOTES.md).
 */
export default function HeroSearchWidget() {
  const { GUEST_OPTIONS_HERO } = useContent();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [location, setLocation] = useState("");
  const [guests, setGuests] = useState(GUEST_OPTIONS_HERO[0]);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-3 rounded-3xl bg-white/95 p-4 shadow-xl backdrop-blur sm:grid-cols-2 lg:grid-cols-5 lg:items-end lg:gap-2"
    >
      <label className="flex flex-col gap-1 text-left text-xs font-medium text-[var(--muted)]">
        Check in
        <input
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="rounded-xl border border-black/10 px-3 py-2 text-sm text-[var(--fg)]"
        />
      </label>
      <label className="flex flex-col gap-1 text-left text-xs font-medium text-[var(--muted)]">
        Check Out
        <input
          type="date"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className="rounded-xl border border-black/10 px-3 py-2 text-sm text-[var(--fg)]"
        />
      </label>
      <label className="flex flex-col gap-1 text-left text-xs font-medium text-[var(--muted)]">
        Location
        <input
          type="text"
          placeholder="Where to?"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="rounded-xl border border-black/10 px-3 py-2 text-sm text-[var(--fg)]"
        />
      </label>
      <label className="flex flex-col gap-1 text-left text-xs font-medium text-[var(--muted)]">
        Person
        <select
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          className="rounded-xl border border-black/10 px-3 py-2 text-sm text-[var(--fg)]"
        >
          {GUEST_OPTIONS_HERO.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-xl bg-[var(--fg)] px-5 py-3 text-sm font-semibold text-white transition-transform hover:scale-105"
      >
        Book Now
        <CtaArrowBadge onDark />
      </button>
      {submitted && (
        <p className="col-span-full mt-1 text-center text-xs text-[var(--muted)]" role="status">
          Thanks! We&apos;ve received your search — a member of our team will follow up shortly.
        </p>
      )}
    </form>
  );
}
