"use client";

import Image from "next/image";
import Link from "next/link";

import { formatPrice, site } from "../defaults";
import { useCart } from "./CartProvider";
import { useContent } from "../context";

export function CartPageContent() {
  const { site } = useContent();
  const { lines, subtotal, count, ready, setQuantity, remove, clear } = useCart();

  return (
    <div className="mx-auto max-w-[1265px] px-5 py-16 lg:px-0 lg:py-20">
      <h1 className="ev-heading">
        Cart{" "}
        <span className="text-muted tabular-nums">({ready ? count : 0})</span>
      </h1>

      {!ready ? (
        <p className="ev-body mt-10">Loading your cart…</p>
      ) : lines.length === 0 ? (
        <div className="mt-10">
          <p className="ev-body">
            Your cart is empty. Browse the 2026 catalogue to get started.
          </p>
          <Link
            href="/products"
            className="mt-8 inline-block border border-ink px-8 py-3.5 text-[15px] transition-colors hover:bg-ink hover:text-white"
          >
            Discover Products
          </Link>
        </div>
      ) : (
        <div className="mt-12 grid gap-14 lg:grid-cols-[minmax(0,1fr)_340px]">
          <ul className="divide-y divide-line border-y border-line">
            {lines.map((line) => (
              <li key={line.id} className="flex gap-5 py-6">
                <Link
                  href={`/products/${line.slug}`}
                  className="relative h-[150px] w-[115px] shrink-0 overflow-hidden bg-cream"
                >
                  <Image
                    src={line.image}
                    alt={line.name}
                    fill
                    sizes="115px"
                    className="object-cover"
                  />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <Link
                      href={`/products/${line.slug}`}
                      className="ev-underline text-[17px]"
                    >
                      {line.name}
                    </Link>
                    <span className="shrink-0 text-[15px] font-semibold tabular-nums">
                      {formatPrice(line.price * line.quantity)}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] text-muted tabular-nums">
                    {formatPrice(line.price)} each
                  </p>
                  {Object.entries(line.options).length > 0 && (
                    <p className="mt-2 text-[13px] text-muted">
                      {Object.entries(line.options)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" · ")}
                    </p>
                  )}
                  <div className="mt-auto flex items-center gap-5 pt-4">
                    <div className="flex items-center border border-line">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => setQuantity(line.id, line.quantity - 1)}
                        className="h-9 w-9 text-[16px] hover:bg-cream"
                      >
                        −
                      </button>
                      <span className="w-9 text-center text-[14px] tabular-nums">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => setQuantity(line.id, line.quantity + 1)}
                        className="h-9 w-9 text-[16px] hover:bg-cream"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(line.id)}
                      className="text-[13px] text-muted underline hover:text-ink"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="text-[20px]">Summary</h2>
            <dl className="mt-6 space-y-3 border-y border-line py-5 text-[15px]">
              <div className="flex justify-between">
                <dt className="text-muted">Items</dt>
                <dd className="tabular-nums">{count}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-semibold tabular-nums">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Market</dt>
                <dd>{site.locale.label}</dd>
              </div>
            </dl>
            <p className="mt-5 text-[13px] leading-relaxed text-muted">
              This storefront is a showcase — there is no online checkout. To place an
              order, email{" "}
              <a href={`mailto:${site.email}`} className="underline hover:text-ink">
                {site.email}
              </a>{" "}
              or call {site.phone}.
            </p>
            <a
              href={`mailto:${site.email}?subject=${encodeURIComponent("Order enquiry")}&body=${encodeURIComponent(
                lines
                  .map(
                    (l) =>
                      `${l.quantity} × ${l.name}${
                        Object.keys(l.options).length
                          ? ` (${Object.entries(l.options)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(", ")})`
                          : ""
                      }`,
                  )
                  .join("\n") + `\n\nSubtotal: ${formatPrice(subtotal)}`,
              )}`}
              className="mt-6 block bg-ink py-4 text-center text-[15px] text-white transition-opacity hover:opacity-85"
            >
              Enquire about this order
            </a>
            <button
              type="button"
              onClick={clear}
              className="mt-4 w-full text-[13px] text-muted underline hover:text-ink"
            >
              Clear cart
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
