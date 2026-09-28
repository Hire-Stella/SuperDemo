'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's own closing full-width CTA band — one heading, one line of
 * body copy, one button — and nothing else. See defaults.ts for why
 * `showForm` is false: the source has no contact form, phone, email,
 * address or hours anywhere on its one real page.
 */
export default function Contact() {
  const { CONTACT } = useContent();

  return (
    <section id="contact" className="py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Reveal className="summit-card relative overflow-hidden px-8 py-14 sm:py-20">
          <div aria-hidden="true" className="summit-glow absolute inset-x-8 -top-20 h-40 rounded-full opacity-40 blur-3xl" />
          <div className="relative">
            <h2 className="font-summit-display text-3xl text-summit-ink sm:text-4xl">
              {CONTACT.title}
            </h2>
            {CONTACT.subhead ? (
              <p className="mx-auto mt-4 max-w-lg text-base text-summit-muted">{CONTACT.subhead}</p>
            ) : null}
            {CONTACT.cta ? (
              <Link
                href={CONTACT.cta.href}
                className="summit-pill mt-8 inline-flex items-center gap-2 bg-white/85 px-7 py-3.5 text-sm font-semibold text-summit-bg transition-colors hover:bg-white"
              >
                {CONTACT.cta.label}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
