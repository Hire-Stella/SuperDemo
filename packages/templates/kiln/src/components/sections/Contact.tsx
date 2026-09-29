'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source has no contact or reservation form anywhere on the site — its
 * footer carries only an address, one set of hours, and two bare social
 * links. This band ports that literally: no `ContactForm` component exists
 * in this package, and `CONTACT.showForm` is not read here, since rendering
 * one would invent a form the source never had.
 */
export default function Contact() {
  const { CONTACT } = useContent();

  return (
    <section id="contact" className="bg-kiln-surface py-20 sm:py-28">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.28em] text-kiln-faint uppercase">
            {CONTACT.eyebrow}
          </p>
          <h2 className="font-kiln-display mt-4 text-4xl text-kiln-ink uppercase sm:text-5xl">
            {CONTACT.title}
          </h2>

          <div className="mt-8 flex flex-col items-center gap-2 text-sm text-kiln-muted">
            {CONTACT.address ? <p>{CONTACT.address}</p> : null}
            {CONTACT.hours ? <p className="font-kiln-mono text-kiln-ink">{CONTACT.hours}</p> : null}
            {CONTACT.phone ? (
              <a href={`tel:${CONTACT.phone.replace(/\s+/g, '')}`} className="hover:text-kiln-ink">
                {CONTACT.phone}
              </a>
            ) : null}
            {CONTACT.email ? (
              <a href={`mailto:${CONTACT.email}`} className="hover:text-kiln-ink">
                {CONTACT.email}
              </a>
            ) : null}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
