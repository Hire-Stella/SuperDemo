"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import type { Product } from "../defaults";
import { ProductCard } from "./ProductCard";

/** Tab label -> ?category= value. "All" clears the param. */
const TABS = [
  { label: "All", value: null, tag: null },
  { label: "Man", value: "man", tag: "man" },
  { label: "Women", value: "woman", tag: "woman" },
] as const;

export function CollectionsGrid({ collections }: { collections: Product[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const category = params.get("category");

  const visible = useMemo(() => {
    if (!category) return collections;
    return collections.filter((c) => c.tags.includes(category));
  }, [category, collections]);

  const select = (value: string | null) => {
    router.replace(value ? `/collections?category=${value}` : "/collections", {
      scroll: false,
    });
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="Filter collections"
        className="flex gap-2 overflow-x-auto pb-2"
      >
        {TABS.map((tab) => {
          const selected = (tab.value ?? null) === (category ?? null);
          return (
            <button
              key={tab.label}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => select(tab.value)}
              className={`shrink-0 border px-5 py-2 text-[14px] font-medium transition-colors ${
                selected
                  ? "border-ink bg-ink text-white"
                  : "border-line text-ink hover:border-ink"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <p aria-live="polite" className="mt-4 text-[13px] text-muted">
        {visible.length} {visible.length === 1 ? "collection" : "collections"}
      </p>

      {visible.length === 0 ? (
        <p className="ev-body mt-16">No collections match this filter yet.</p>
      ) : (
        <div className="ev-fade mt-8 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
          {visible.map((c, i) => (
            <ProductCard key={c.slug} product={c} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
