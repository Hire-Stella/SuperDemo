'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's "Client" band: one line of copy over a looping row of bare
 * client wordmarks. The source loops the row twice for a seamless marquee;
 * ported here as a single wrapped row instead of a continuous-scroll
 * marquee, since a marquee needs either a motion library or hand-rolled
 * keyframe math this port doesn't need to take on for eleven static logos.
 */
export default function TrustTicker() {
  const { TRUST } = useContent();
  if (TRUST.logos.length === 0) return null;

  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          <p className="w-full text-center text-sm font-medium text-vantra-muted sm:w-auto sm:text-left">
            {TRUST.label}
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 opacity-70 grayscale">
            {TRUST.logos.map((logo, i) => (
              <li key={logo} className="flex h-7 w-[100px] items-center justify-center">
                <Image
                  src={logo}
                  alt=""
                  width={100}
                  height={28}
                  className="h-full w-auto max-w-[100px] object-contain"
                  aria-hidden={i > 0}
                />
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
