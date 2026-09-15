"use client";

import Image from "next/image";
import Link from "next/link";
import WordsReveal from "./components/WordsReveal";
import { RevealGroup, RevealItem, RevealSlide, RevealPop } from "./components/Reveal";
import Reveal from "./components/Reveal";
import HeroSearchWidget from "./components/HeroSearchWidget";
import DestinationCard from "./components/DestinationCard";
import GuideCard from "./components/GuideCard";
import StatsBlock from "./components/StatsBlock";
import TestimonialCarousel from "./components/TestimonialCarousel";
import FaqAccordion from "./components/FaqAccordion";
import Marquee from "./components/Marquee";
import HeroCollage from "./components/HeroCollage";
import CtaArrowBadge from "./components/CtaArrowBadge";
import ScrollDownIndicator from "./components/ScrollDownIndicator";
import { GUIDES, HOME_DESTINATION_CARDS, JOURNEY_IMAGES, PARTNER_LOGOS, STATS, TRIP_STEPS } from "./defaults";
import { useContent } from "./context";

export default function HomePage() {
  const { GUIDES, HOME_DESTINATION_CARDS, JOURNEY_IMAGES, PARTNER_LOGOS, STATS, TRIP_STEPS } = useContent();
  return (
    <>
      {/* Hero -- animates on mount, not on scroll (above the fold on load) */}
      <section id="hero" className="relative overflow-hidden px-5 pb-20 pt-16 text-center md:px-10 md:pt-24">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-15"
        >
          <source src="/t/tripvanta/videos/hero-background-video.mp4" type="video/mp4" />
        </video>

        <HeroCollage />

        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              <Image
                src="/t/tripvanta/images/hero-avatar-3.png"
                alt=""
                width={36}
                height={36}
                className="rounded-full ring-2 ring-white"
              />
              <Image
                src="/t/tripvanta/images/hero-avatar-4.png"
                alt=""
                width={36}
                height={36}
                className="rounded-full ring-2 ring-white"
              />
              <Image
                src="/t/tripvanta/images/hero-avatar-5.png"
                alt=""
                width={36}
                height={36}
                className="rounded-full ring-2 ring-white"
              />
            </div>
            <p className="text-sm text-[var(--muted)]">
              {STATS.heroReviewCount} traveler reviews • {STATS.heroReviewRating}
            </p>
          </div>

          <h1 className="font-display text-5xl leading-[0.95] text-[var(--fg)] sm:text-6xl md:text-8xl">
            <WordsReveal text="Discover Your Next Great Adventure" animateOnMount />
          </h1>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
            <RevealSlide direction="left">
              <Link
                href="/contact"
                className="inline-flex items-center rounded-full bg-[var(--fg)] px-7 py-3.5 text-sm font-semibold text-white transition-transform hover:scale-105"
              >
                Plan Your Trip
                <CtaArrowBadge onDark />
              </Link>
            </RevealSlide>
            <RevealSlide direction="right">
              <Link
                href="/destination"
                className="inline-flex items-center rounded-full border border-[var(--fg)]/20 px-7 py-3.5 text-sm font-semibold text-[var(--fg)] transition-transform hover:scale-105"
              >
                Explore Now
                <CtaArrowBadge />
              </Link>
            </RevealSlide>
          </div>

          <ScrollDownIndicator />
        </div>

        <div className="mx-auto mt-14 max-w-4xl">
          <HeroSearchWidget />
        </div>
      </section>

      {/* Our Trusted Travel Partners -- confirmed on the live source right
          after the hero, before the destination cards: a heading followed
          by an infinite looped logo marquee. */}
      <section className="px-5 py-14 md:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-xl leading-tight text-[var(--fg)] md:text-2xl">
            <WordsReveal text="Our Trusted Travel Partners" />
          </h2>
        </div>
        <Reveal y={20} scale={1} delay={0.1} className="mx-auto mt-10 max-w-5xl">
          <Marquee duration={22}>
            {PARTNER_LOGOS.map((src) => (
              <div key={src} className="flex h-16 w-44 shrink-0 items-center justify-center px-4">
                <Image
                  src={src}
                  alt="Partner logo"
                  width={160}
                  height={64}
                  className="max-h-14 w-auto object-contain opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0"
                />
              </div>
            ))}
          </Marquee>
        </Reveal>
      </section>

      {/* Destination cards */}
      <section className="px-5 py-20 md:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl leading-tight text-[var(--fg)] md:text-5xl">
            <WordsReveal text="Discover the World's Most Loved Travel Destinations" />
          </h2>
        </div>
        <RevealGroup className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {HOME_DESTINATION_CARDS.map((card) => (
            <DestinationCard
              key={card.slug}
              slug={card.slug}
              name={card.name}
              tagline={card.tagline}
              image={card.image}
            />
          ))}
        </RevealGroup>
        <div className="mt-12 text-center">
          <Link
            href="/destination"
            className="inline-flex items-center rounded-full border border-[var(--fg)]/20 px-7 py-3 text-sm font-semibold text-[var(--fg)] transition-transform hover:scale-105"
          >
            Explore Destination
            <CtaArrowBadge />
          </Link>
        </div>
      </section>

      <StatsBlock />

      {/* Plan Your Trip in 3 Steps */}
      <section className="bg-white px-5 py-20 md:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl leading-tight text-[var(--fg)] md:text-5xl">
            <WordsReveal text="Plan Your Trip in 3 Steps" />
          </h2>
        </div>
        <RevealGroup className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
          {TRIP_STEPS.map((step) => (
            <div key={step.number} className="text-center">
              <RevealPop className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--fg)] font-display text-xl text-white">
                {step.number}
              </RevealPop>
              <h3 className="mt-5 font-display text-lg text-[var(--fg)]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{step.description}</p>
            </div>
          ))}
        </RevealGroup>
      </section>

      {/* section-divider-bg.png: a near-blank, very faint transition graphic
          -- used here as a subtle full-width divider background between
          sections rather than left unused. */}
      <div
        aria-hidden="true"
        className="h-10 bg-[var(--bg)] bg-center bg-repeat-x md:h-16"
        style={{ backgroundImage: "url(/t/tripvanta/images/section-divider-bg.png)", backgroundSize: "auto 100%" }}
      />

      {/* Visual journey / gallery teaser -- the live source mixes 7 journey
          photos with one inline video tile in this grid (confirmed in
          home.html, right after this heading); these were previously
          misplaced on the /gallery page -- see NOTES.md. */}
      <section className="px-5 py-20 md:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl leading-tight text-[var(--fg)] md:text-5xl">
            <WordsReveal text="Our Visual Journey Through Unforgettable Destinations" />
          </h2>
          <Reveal y={20} scale={1} delay={0.1} className="mt-8">
            <Link
              href="/gallery"
              className="inline-flex items-center rounded-full bg-[var(--fg)] px-7 py-3 text-sm font-semibold text-white transition-transform hover:scale-105"
            >
              View Gallery
              <CtaArrowBadge onDark />
            </Link>
          </Reveal>
        </div>
        <RevealGroup className="mx-auto mt-14 grid max-w-6xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {JOURNEY_IMAGES.map((src) => (
            <RevealItem key={src} className="relative aspect-square overflow-hidden rounded-2xl">
              <Image src={src} alt="" fill className="object-cover" sizes="25vw" />
            </RevealItem>
          ))}
          <RevealItem className="relative aspect-square overflow-hidden rounded-2xl">
            <video autoPlay muted loop playsInline className="h-full w-full object-cover">
              <source src="/t/tripvanta/videos/destination-card-video.mp4" type="video/mp4" />
            </video>
          </RevealItem>
        </RevealGroup>
      </section>

      {/* Testimonials */}
      <section className="bg-white px-5 py-20 md:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl leading-tight text-[var(--fg)] md:text-5xl">
            <WordsReveal text="Rated Excellent by Over 500K Happy Global Travelers" />
          </h2>
        </div>
        <div className="mt-14">
          <TestimonialCarousel />
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 py-20 text-center md:px-10">
        <h2 className="font-display text-3xl leading-tight text-[var(--fg)] md:text-5xl">
          <WordsReveal text="Your Next Great Adventure Starts with Wanderloom" />
        </h2>
        <Reveal y={20} scale={1} delay={0.1}>
          <p className="mx-auto mt-4 max-w-xl text-[var(--muted)]">
            Discover destinations, build your journey, and go
          </p>
        </Reveal>
        <Reveal y={20} scale={1} delay={0.2}>
          <Link
            href="/contact"
            className="mt-8 inline-flex items-center rounded-full bg-[var(--fg)] px-7 py-3.5 text-sm font-semibold text-white transition-transform hover:scale-105"
          >
            Plan Your Trip
            <CtaArrowBadge onDark />
          </Link>
        </Reveal>
      </section>

      {/* Meet Your Guides */}
      <section className="bg-white px-5 py-20 md:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl leading-tight text-[var(--fg)] md:text-5xl">
            <WordsReveal text="Meet Your Guides" />
          </h2>
        </div>
        <RevealGroup className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((guide, i) => (
            <GuideCard key={`${guide.name}-${i}`} guide={guide} />
          ))}
        </RevealGroup>
      </section>

      {/* FAQ -- decorative-shape-1.svg is a large, near-transparent (12%
          opacity) compass/map watermark illustration, used here purely as
          ambient background art (matches its style on the live source: a
          faint background flourish, not user-facing content). */}
      <section className="relative overflow-hidden px-5 py-20 md:px-10">
        <Image
          src="/t/tripvanta/images/decorative-shape-1.svg"
          alt=""
          width={500}
          height={540}
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-10 -z-10 hidden opacity-70 md:block"
        />
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl leading-tight text-[var(--fg)] md:text-5xl">
            <WordsReveal text="Answers for the Curious Smatter Traveler" />
          </h2>
        </div>
        <div className="mt-14">
          <FaqAccordion />
        </div>
      </section>
    </>
  );
}
