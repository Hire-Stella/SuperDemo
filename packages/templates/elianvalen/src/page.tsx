"use client";

import Image from "next/image";

import { ProductCard } from "./components/ProductCard";
import { Wordmark } from "./components/Wordmark";
import {
  CampaignCards,
  CuratedBand,
  GenderBanners,
  InfoSections,
  SectionHeading,
  TextLink,
} from "./components/sections";
import { home, productBySlug, type Product } from "./defaults";
import { useContent } from "./context";

const pick = (slugs: string[]) =>
  slugs.map((s) => productBySlug(s)).filter((p): p is Product => Boolean(p));

export default function HomePage() {
  const { home } = useContent();
  const popular = pick(home.popularProducts.slugs);

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden bg-cream">
        <div className="mx-auto grid max-w-[1265px] gap-10 px-5 pt-16 pb-0 lg:grid-cols-[1fr_auto_1fr] lg:items-start lg:px-0 lg:pt-20">
          <div className="ev-rise">
            <SectionHeading lines={[home.hero.heading]} className="max-w-[420px]" />
            <div className="mt-9">
              <TextLink href={home.hero.cta.href}>{home.hero.cta.label}</TextLink>
            </div>
          </div>

          <div className="relative order-first mx-auto aspect-[867/900] w-full max-w-[560px] lg:order-none lg:w-[520px] xl:w-[620px]">
            <Image
              src={home.hero.image}
              alt={home.hero.imageAlt}
              fill
              priority
              sizes="(min-width: 1024px) 620px, 90vw"
              className="object-cover object-top"
            />
          </div>

          <p className="ev-body max-w-[260px] text-[14px] lg:justify-self-end lg:text-right">
            {home.hero.blurb}
          </p>
        </div>

        {/* Oversized wordmark washing out under the top-down scrim */}
        <div className="relative -mt-2 px-4 pb-8 lg:px-6">
          <Wordmark
            className="ev-wordmark-fit block w-full text-center leading-[0.85] text-ink opacity-[0.55]"
            script
          />
          <div className="ev-scrim pointer-events-none absolute inset-0 opacity-10" aria-hidden="true" />
        </div>
      </section>

      {/* ---------------- Products & collections intro ---------------- */}
      <section className="mx-auto grid max-w-[1265px] gap-12 px-5 py-20 lg:grid-cols-[478px_minmax(0,1fr)] lg:px-0 lg:py-28">
        <div>
          <SectionHeading lines={home.intro.heading} className="max-w-[390px]" />
          <p className="ev-body mt-8 max-w-[300px]">{home.intro.blurb}</p>
          <div className="mt-10">
            <TextLink href={home.intro.cta.href}>{home.intro.cta.label}</TextLink>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {home.intro.images.map((img) => (
            <div key={img.src} className="ev-zoom relative aspect-[387/540] overflow-hidden bg-cream">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(min-width: 1024px) 390px, 45vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Popular collection ---------------- */}
      <section className="mx-auto grid max-w-[1265px] gap-12 px-5 pb-20 lg:grid-cols-[478px_minmax(0,1fr)] lg:px-0 lg:pb-28">
        <div>
          <SectionHeading lines={home.popularCollection.heading} className="max-w-[390px]" />
          <p className="ev-body mt-8 max-w-[300px]">{home.popularCollection.blurb}</p>
          <div className="mt-10">
            <TextLink href={home.popularCollection.cta.href}>
              {home.popularCollection.cta.label}
            </TextLink>
          </div>
        </div>
        <div className="ev-zoom relative aspect-[553/830] max-h-[830px] overflow-hidden bg-cream lg:mx-auto lg:w-[553px]">
          <Image
            src={home.popularCollection.image}
            alt={home.popularCollection.imageAlt}
            fill
            sizes="(min-width: 1024px) 553px, 90vw"
            className="object-cover"
          />
        </div>
      </section>

      {/* ---------------- Popular products (2-up) ---------------- */}
      <section className="mx-auto grid max-w-[1265px] gap-12 px-5 pb-20 lg:grid-cols-[478px_minmax(0,1fr)] lg:px-0 lg:pb-28">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading lines={home.popularProducts.heading} className="max-w-[390px]" />
          <p className="ev-body mt-8 max-w-[300px]">{home.popularProducts.blurb}</p>
          <div className="mt-10">
            <TextLink href={home.popularProducts.cta.href}>
              {home.popularProducts.cta.label}
            </TextLink>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-12">
          {popular.map((p) => (
            <ProductCard
              key={p.slug}
              product={p}
              sizes="(min-width: 1024px) 384px, 45vw"
            />
          ))}
        </div>
      </section>

      {/* ---------------- Showcase: 4-up grids with lookbook banners ---------------- */}
      <div className="mx-auto max-w-[1265px] px-5 pb-20 lg:px-0">
        {home.showcase.map((block, i) => {
          const items = pick(block.slugs);
          return (
            <div key={i} className={i > 0 ? "mt-20" : ""}>
              <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
                {items.map((p) => (
                  <ProductCard key={p.slug + i} product={p} />
                ))}
              </div>

              {block.banner && (
                <div
                  className={`mt-16 flex ${
                    block.banner.align === "right" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="ev-zoom relative aspect-[670/900] w-full max-w-[670px] overflow-hidden bg-cream">
                    <Image
                      src={block.banner.src}
                      alt={block.banner.alt}
                      fill
                      sizes="(min-width: 1024px) 670px, 100vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <GenderBanners />
      <InfoSections />
      <CuratedBand />
      <CampaignCards />
    </>
  );
}
