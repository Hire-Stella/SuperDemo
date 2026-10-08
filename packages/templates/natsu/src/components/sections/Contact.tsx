'use client';

import { useContent } from '../../context';
import { ContactForm } from '../ContactForm';
import { Reveal } from '../Reveal';

/**
 * The contact page's own address, hours and "Fill Form To Contact" band —
 * on the source's own cream ground rather than a photo, since the source's
 * contact page has no background image of its own to scrim.
 */
export default function Contact() {
  const { CONTACT } = useContent();

  return (
    <section id="contact" className="bg-natsu-ink py-20 text-natsu-bg sm:py-28">
      <div className="mx-auto max-w-4xl px-6">
        <Reveal className="text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-natsu-gold uppercase">
            {CONTACT.eyebrow}
          </p>
          <h2 className="font-natsu-display mt-4 text-4xl sm:text-5xl">{CONTACT.title}</h2>
          <p className="mx-auto mt-4 max-w-md text-base text-natsu-bg/80">{CONTACT.subhead}</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.2fr]">
          <Reveal className="flex flex-col gap-6 text-sm text-natsu-bg/85">
            {CONTACT.address ? (
              <div>
                <p className="text-xs font-semibold tracking-[0.14em] text-natsu-gold uppercase">
                  Address
                </p>
                <p className="mt-2">{CONTACT.address}</p>
              </div>
            ) : null}
            {CONTACT.hours ? (
              <div>
                <p className="text-xs font-semibold tracking-[0.14em] text-natsu-gold uppercase">
                  Opening Hours
                </p>
                <p className="mt-2">{CONTACT.hours}</p>
              </div>
            ) : null}
            <div className="flex flex-col gap-2">
              {CONTACT.phone ? (
                <a
                  href={`tel:${CONTACT.phone.replace(/\s+/g, '')}`}
                  className="hover:text-natsu-gold"
                >
                  {CONTACT.phone}
                </a>
              ) : null}
              {CONTACT.email ? (
                <a href={`mailto:${CONTACT.email}`} className="hover:text-natsu-gold">
                  {CONTACT.email}
                </a>
              ) : null}
            </div>
          </Reveal>

          {CONTACT.showForm ? (
            <Reveal delay={100} className="natsu-soft bg-natsu-bg p-6 text-natsu-ink sm:p-8">
              <ContactForm />
              {CONTACT.formNote ? (
                <p className="mt-6 text-xs text-natsu-muted">{CONTACT.formNote}</p>
              ) : null}
            </Reveal>
          ) : null}
        </div>
      </div>
    </section>
  );
}
