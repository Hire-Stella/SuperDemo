"use client";

import Image from "next/image";

import { partnerLogos } from "../defaults";
import { useContent } from "../context";

// NOTE: these are placeholder demo logos bundled with the Framer template
// (named "Fakebrand 1"-"Fakebrand 4" in the source file's own layers) — not
// real Zova customers. See lib/data.ts for details.
//
// The live site scrolls this row as an infinite marquee (confirmed via the
// DOM: the same 4 logos are rendered twice back-to-back for a seamless
// loop). Reproduced here with a duplicated track + CSS animation rather
// than a static row.
export function LogoStrip() {
  const { partnerLogos } = useContent();
  const track = [...partnerLogos, ...partnerLogos];

  return (
    <section className="overflow-hidden py-10 sm:py-14">
      <div className="mx-auto max-w-5xl px-6">
        <p className="text-center text-xs font-medium tracking-wide text-zv-muted uppercase">Trusted by teams at</p>
      </div>
      <div className="relative mt-6 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
        <div className="zv-marquee-track flex w-max items-center gap-16 opacity-70 grayscale">
          {track.map((logo, i) => (
            <Image
              key={`${logo}-${i}`}
              src={logo}
              alt={`Partner logo ${(i % partnerLogos.length) + 1}`}
              width={140}
              height={32}
              className="h-6 w-auto shrink-0 object-contain sm:h-7"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
