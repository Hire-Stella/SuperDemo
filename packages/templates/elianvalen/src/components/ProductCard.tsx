"use client";

import Image from "next/image";
import Link from "next/link";

import { formatPrice, type Product } from "../defaults";

export function ProductCard({
  product,
  sizes = "(min-width: 1024px) 302px, (min-width: 640px) 45vw, 90vw",
  priority = false,
}: {
  product: Product;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <Link href={`/products/${product.slug}`} className="ev-zoom group block">
      <div className="relative aspect-[302/449] overflow-hidden bg-cream">
        <Image
          src={product.card}
          alt={product.name}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <p className="text-[16px] text-ink">{product.name}</p>
        <span className="shrink-0 text-[14px] font-semibold tabular-nums text-ink">
          {formatPrice(product.price)}
        </span>
      </div>
    </Link>
  );
}
