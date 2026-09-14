"use client";

import Image from "next/image";
import Link from "next/link";

import { formatPrice } from "../defaults";
import { useCart } from "./CartProvider";
import { Close } from "./icons";

export function CartDrawer() {
  const { lines, subtotal, count, isOpen, close, setQuantity, remove, clear } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Cart">
      <button
        type="button"
        aria-label="Close cart"
        onClick={close}
        className="ev-fade absolute inset-0 bg-black/40"
      />
      <aside className="ev-slide-in relative flex h-full w-full max-w-[420px] flex-col bg-white">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <p className="text-[14px] tracking-[0.08em] uppercase">
            Cart <span className="tabular-nums text-muted">({count})</span>
          </p>
          <button type="button" onClick={close} aria-label="Close cart" className="p-1">
            <Close className="h-5 w-5" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="ev-body">Your cart is empty.</p>
            <Link
              href="/products"
              onClick={close}
              className="border border-ink px-6 py-3 text-[14px] transition-colors hover:bg-ink hover:text-white"
            >
              Discover Products
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
              {lines.map((line) => (
                <li key={line.id} className="flex gap-4 py-5">
                  <Link
                    href={`/products/${line.slug}`}
                    onClick={close}
                    className="relative h-[104px] w-20 shrink-0 overflow-hidden bg-cream"
                  >
                    <Image
                      src={line.image}
                      alt={line.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`/products/${line.slug}`}
                        onClick={close}
                        className="text-[15px] hover:opacity-70"
                      >
                        {line.name}
                      </Link>
                      <span className="shrink-0 text-[14px] font-semibold tabular-nums">
                        {formatPrice(line.price * line.quantity)}
                      </span>
                    </div>
                    {Object.entries(line.options).length > 0 && (
                      <p className="mt-1 text-[12px] text-muted">
                        {Object.entries(line.options)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" · ")}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-4">
                      <div className="flex items-center border border-line">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => setQuantity(line.id, line.quantity - 1)}
                          className="h-8 w-8 text-[15px] hover:bg-cream"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-[13px] tabular-nums">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => setQuantity(line.id, line.quantity + 1)}
                          className="h-8 w-8 text-[15px] hover:bg-cream"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(line.id)}
                        className="text-[12px] text-muted underline hover:text-ink"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-line px-6 py-5">
              <div className="flex items-center justify-between text-[15px]">
                <span>Subtotal</span>
                <span className="font-semibold tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-2 text-[12px] text-muted">
                Taxes and shipping are calculated at checkout.
              </p>
              <Link
                href="/cart"
                onClick={close}
                className="mt-4 block bg-ink py-3.5 text-center text-[15px] text-white transition-opacity hover:opacity-85"
              >
                View cart
              </Link>
              <button
                type="button"
                onClick={clear}
                className="mt-3 w-full text-[12px] text-muted underline hover:text-ink"
              >
                Clear cart
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
