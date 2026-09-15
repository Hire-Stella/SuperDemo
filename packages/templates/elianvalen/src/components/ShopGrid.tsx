"use client";

import { useMemo, useState } from "react";

import type { Product } from "../defaults";
import { ProductCard } from "./ProductCard";

const FILTERS: { label: string; test: (p: Product) => boolean }[] = [
  { label: "All", test: () => true },
  { label: "Shirts", test: (p) => p.productType === "Shirt" },
  { label: "Pants", test: (p) => p.productType === "Pants" },
  { label: "Shoes", test: (p) => p.productType === "Shoes" },
  { label: "Man", test: (p) => p.tags.includes("man") },
  { label: "Woman", test: (p) => p.tags.includes("woman") },
];

export function ShopGrid({ products }: { products: Product[] }) {
  const [active, setActive] = useState("All");

  const visible = useMemo(() => {
    const filter = FILTERS.find((f) => f.label === active) ?? FILTERS[0];
    return products.filter(filter.test);
  }, [active, products]);

  return (
    <div>
      <div
        role="tablist"
        aria-label="Filter products"
        className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 lg:mx-0 lg:px-0"
      >
        {FILTERS.map((f) => {
          const selected = f.label === active;
          return (
            <button
              key={f.label}
              role="tab"
              aria-selected={selected}
              type="button"
              onClick={() => setActive(f.label)}
              className={`shrink-0 border px-5 py-2 text-[14px] font-medium transition-colors ${
                selected
                  ? "border-ink bg-ink text-white"
                  : "border-line text-ink hover:border-ink"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <p aria-live="polite" className="mt-4 text-[13px] text-muted">
        {visible.length} {visible.length === 1 ? "piece" : "pieces"}
      </p>

      {visible.length === 0 ? (
        <p className="ev-body mt-16">No pieces match this filter yet.</p>
      ) : (
        <div className="ev-fade mt-8 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
          {visible.map((p, i) => (
            <ProductCard key={p.slug} product={p} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
