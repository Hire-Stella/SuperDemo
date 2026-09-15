"use client";

import Image from "next/image";
import Link from "next/link";
import { ABOUT, BOOKING_URL } from "../../defaults";
import Reveal from "../../components/Reveal";
import { useContent } from "../../context";

export default function About() {
  const { ABOUT, BOOKING_URL } = useContent();
  return (
    <section id="about-me" className="bg-cream py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2">
        <Reveal className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl">
          <Image
            src={ABOUT.photo}
            alt={`${ABOUT.name}, ${ABOUT.title}`}
            fill
            sizes="(min-width: 1024px) 480px, 100vw"
            className="object-cover"
          />
        </Reveal>

        <Reveal delay={0.15}>
          <p className="text-sm uppercase tracking-[0.3em] text-accent">
            {ABOUT.eyebrow}
          </p>
          <h2 className="font-display mt-4 text-4xl font-semibold sm:text-5xl">
            {ABOUT.name}
          </h2>
          <p className="mt-2 text-base text-muted">{ABOUT.title}</p>

          <div className="mt-6 flex flex-col gap-4">
            {ABOUT.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-relaxed text-muted sm:text-base">
                {paragraph}
              </p>
            ))}
          </div>

          <Link
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-ink px-8 py-3.5 text-sm font-medium text-white transition-transform hover:scale-105"
          >
            {ABOUT.cta}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
