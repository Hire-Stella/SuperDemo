'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's "Directions" band: a blue "Find Us" eyebrow, a giant
 * auto-fit "Directions" headline, an address line and a transit note, and
 * one filled pill button that opens a Google Maps search for the address —
 * the source's own only filled button anywhere on the page. No enquiry
 * form: the source has none, and `CONTACT.showForm` is not read here for
 * the same reason kiln's Contact.tsx gives.
 */
export default function Contact() {
  const { CONTACT } = useContent();

  return (
    <section id="contact" className="bg-folio-white py-20 sm:py-28">
      <div className="mx-auto flex max-w-lg flex-col items-center px-6 text-center">
        <Reveal className="flex flex-col items-center">
          <p className="font-folio-display text-[10px] text-folio-accent uppercase">
            {CONTACT.eyebrow}
          </p>
          <h2
            className="font-folio-display mt-3 text-folio-accent uppercase"
            style={{ fontSize: 'clamp(2.5rem, 9vw, 5rem)' }}
          >
            {CONTACT.title}
          </h2>
        </Reveal>

        <Reveal className="mt-8 flex flex-col items-center gap-2" delay={80}>
          {CONTACT.address ? (
            <p className="font-folio-display text-sm text-folio-accent uppercase">
              {CONTACT.address}
            </p>
          ) : null}
          {CONTACT.transit ? (
            <p className="font-folio-display text-xs text-folio-accent uppercase">
              {CONTACT.transit}
            </p>
          ) : null}
          {CONTACT.hours ? (
            <p className="font-folio-display text-xs text-folio-accent uppercase">
              {CONTACT.hours}
            </p>
          ) : null}
          {CONTACT.phone ? (
            <a
              href={`tel:${CONTACT.phone.replace(/\s+/g, '')}`}
              className="font-folio-display text-xs text-folio-accent uppercase hover:opacity-70"
            >
              {CONTACT.phone}
            </a>
          ) : null}
          {CONTACT.email ? (
            <a
              href={`mailto:${CONTACT.email}`}
              className="font-folio-display text-xs text-folio-accent uppercase hover:opacity-70"
            >
              {CONTACT.email}
            </a>
          ) : null}
        </Reveal>

        <Reveal delay={140}>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT.mapQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="folio-pill font-folio-display mt-10 inline-flex items-center justify-center bg-folio-accent px-8 py-4 text-xs text-white uppercase transition-transform hover:scale-[1.03]"
          >
            Get Directions
          </a>
        </Reveal>
      </div>
    </section>
  );
}
