"use client";

import Image from "next/image";

import { integrationHeading, integrationIcons, integrationSubhead, integrationVideo, integrationVideoPoster } from "../defaults";
import { useContent } from "../context";

// The live page's integration icon grid is 9 real, downloadable images —
// each <img> there carries alt="Sample logo", confirming they're generic
// placeholder icons bundled with the template rather than real integration
// partners. Self-hosted here as-is; swap in real partner logos when
// available. The character-with-wand graphic above the grid is a short
// looping video on the live site, not a static illustration.
export function IntegrationSection() {
  const { integrationHeading, integrationIcons, integrationSubhead, integrationVideo, integrationVideoPoster } = useContent();
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <h2 className="zv-heading text-3xl text-zv-ink sm:text-4xl">{integrationHeading}</h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-zv-muted">{integrationSubhead}</p>
      </div>

      <div className="relative mx-auto mt-10 max-w-2xl px-6">
        <div className="relative flex flex-col items-center gap-8">
          <video
            src={integrationVideo}
            poster={integrationVideoPoster}
            autoPlay
            loop
            muted
            playsInline
            className="h-44 w-44 sm:h-52 sm:w-52"
          />

          <div className="grid grid-cols-5 gap-4 sm:gap-6">
            {integrationIcons.map((icon, i) => (
              <div
                key={icon}
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-zv-line bg-white p-2.5 shadow-sm sm:h-14 sm:w-14"
              >
                <Image
                  src={icon}
                  alt={`Sample integration icon ${i + 1}`}
                  width={64}
                  height={64}
                  className="h-full w-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
