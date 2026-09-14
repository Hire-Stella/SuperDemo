"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { formatPrice, productFaq, site, type Product } from "../defaults";
import { useCart } from "./CartProvider";
import { ChevronDown } from "./icons";
import { useContent } from "../context";

export function ProductDetail({ product }: { product: Product }) {
  const { productFaq, site } = useContent();
  const { add } = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [selection, setSelection] = useState<Record<string, string>>(() =>
    Object.fromEntries(product.options.map((o) => [o.name, o.values[0]])),
  );

  const gallery = product.gallery.length ? product.gallery : [product.card];

  return (
    <div className="mx-auto grid max-w-[1265px] gap-12 px-5 py-12 lg:grid-cols-[minmax(0,829px)_minmax(0,1fr)] lg:gap-16 lg:px-0 lg:py-16">
      {/* ------------------------- Gallery ------------------------- */}
      <div className="flex flex-col-reverse gap-4 sm:flex-row">
        {gallery.length > 1 && (
          <div className="flex gap-3 sm:w-[100px] sm:flex-col">
            {gallery.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setActiveImage(i)}
                aria-label={`View image ${i + 1}`}
                aria-current={i === activeImage}
                className={`relative aspect-[4/3] w-[100px] shrink-0 overflow-hidden bg-cream transition-opacity ${
                  i === activeImage ? "ring-1 ring-ink" : "opacity-60 hover:opacity-100"
                }`}
              >
                <Image src={src} alt="" fill sizes="100px" className="object-contain" />
              </button>
            ))}
          </div>
        )}
        <div className="relative aspect-square flex-1 overflow-hidden bg-cream">
          <Image
            key={gallery[activeImage]}
            src={gallery[activeImage]}
            alt={product.name}
            fill
            priority
            sizes="(min-width: 1024px) 715px, 92vw"
            className="ev-fade object-contain"
          />
        </div>
      </div>

      {/* ------------------------- Buy panel ------------------------- */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-[22px] font-medium text-[#0b0b0b]">{product.name}</h1>
          <Link
            href="/contact"
            className="ev-underline mt-1 shrink-0 text-[10px] tracking-[0.14em] text-[#0b0b0b] uppercase"
          >
            Contact us
          </Link>
        </div>

        <p className="mt-4 text-[16px] text-ink-soft tabular-nums">
          {formatPrice(product.price)}
        </p>

        <p className="mt-4 max-w-[420px] text-[14px] leading-relaxed text-ink/70">
          {product.description}
        </p>

        <div className="mt-8 flex items-center justify-between border-y border-line py-3">
          <span className="text-[14px] text-muted-light">Active Market</span>
          <span className="flex items-center gap-2 text-[14px]">
            <Image
              src={site.locale.flag}
              alt=""
              width={21}
              height={16}
              className="h-4 w-[21px] object-cover"
            />
            {site.locale.label}
          </span>
        </div>

        {/* Variant options */}
        {product.options.map((option) => (
          <fieldset key={option.name} className="mt-7">
            <legend className="mb-3 text-[12px] tracking-[0.1em] text-muted uppercase">
              {option.name}
            </legend>
            <div className="flex flex-wrap gap-2">
              {option.values.map((value) => {
                const selected = selection[option.name] === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      setSelection((s) => ({ ...s, [option.name]: value }))
                    }
                    className={`min-w-[64px] border px-4 py-2 text-[13px] transition-colors ${
                      selected
                        ? "border-ink bg-ink text-white"
                        : "border-line text-[#858585] hover:border-ink hover:text-ink"
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

        {/* Quantity */}
        <div className="mt-8 flex items-center justify-between border-y border-line py-3">
          <span className="text-[14px] text-ink">Quantity of product</span>
          <div className="flex items-center border border-line">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="h-9 w-9 text-[16px] hover:bg-cream"
            >
              −
            </button>
            <span className="w-9 text-center text-[14px] tabular-nums">{quantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQuantity((q) => Math.min(99, q + 1))}
              className="h-9 w-9 text-[16px] hover:bg-cream"
            >
              +
            </button>
          </div>
        </div>

        <p className="mt-6 text-[10px] tracking-[0.14em] text-[#0b0b0b] uppercase">
          How to take care?
        </p>

        <button
          type="button"
          onClick={() =>
            add({
              slug: product.slug,
              name: product.name,
              price: product.price,
              image: product.card,
              options: selection,
              quantity,
            })
          }
          className="mt-5 w-full bg-ink py-4 text-[16px] text-white transition-opacity hover:opacity-85"
        >
          Add to cart
        </button>

        {/* FAQ accordion */}
        <div className="mt-10 divide-y divide-line border-t border-line">
          {productFaq.map((item, i) => {
            const open = openFaq === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left"
                >
                  <span className="text-[16px] text-black">{item.q}</span>
                  <ChevronDown
                    className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>
                {open && (
                  <p className="ev-fade pb-5 text-[14px] leading-relaxed text-black/60">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
