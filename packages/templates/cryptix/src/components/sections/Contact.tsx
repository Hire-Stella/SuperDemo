'use client';

import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's closing "Ready to take control of your crypto?" band — one
 * heading, one line of body copy, one CTA, over the same ambient glow the
 * hero uses. The source has no address, phone, or enquiry form anywhere on
 * the page (a crypto exchange product, not a storefront with a location),
 * so `CONTACT.showForm` is not read here — rendering one would invent a
 * form the source never had, the same call kiln's own Contact band makes.
 */
export default function Contact() {
  const { CONTACT } = useContent();

  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="cryptix-ambient" aria-hidden />
      <div className="relative mx-auto max-w-2xl px-6 text-center">
        <Reveal>
          {CONTACT.eyebrow ? (
            <p className="text-xs font-semibold tracking-[0.2em] text-cryptix-link uppercase">
              {CONTACT.eyebrow}
            </p>
          ) : null}
          <h2 className="font-cryptix-display mt-2 text-3xl text-cryptix-ink sm:text-5xl">{CONTACT.title}</h2>
          {CONTACT.subhead ? (
            <p className="mt-5 text-base text-cryptix-muted sm:text-lg">{CONTACT.subhead}</p>
          ) : null}
          {CONTACT.cta ? (
            <Link
              href={CONTACT.cta.href}
              className="cryptix-pill cryptix-glow mt-8 inline-flex items-center justify-center bg-cryptix-accent px-8 py-3.5 text-sm font-semibold text-cryptix-accent-ink transition-transform hover:scale-[1.03]"
            >
              {CONTACT.cta.label}
            </Link>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
