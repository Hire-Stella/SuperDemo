'use client';

import { useContent } from '../../context';
import { ContactForm } from '../ContactForm';
import { Reveal } from '../Reveal';

/**
 * The order-ahead band sits on the template's own dark plum ink rather than
 * over a photo — Pearl has no dedicated contact backdrop image, so this
 * avoids inventing a scrim over a photo that was never shot for the job.
 */
export default function Contact() {
  const { CONTACT } = useContent();

  return (
    <section id="contact" className="bg-pearl-ink py-20 text-pearl-bg sm:py-28">
      <div className="mx-auto max-w-4xl px-6">
        <Reveal className="text-center">
          <p className="text-xs font-bold tracking-[0.28em] text-pearl-berry-soft uppercase">
            {CONTACT.eyebrow}
          </p>
          <h2 className="font-pearl-display mt-4 text-4xl sm:text-5xl">{CONTACT.title}</h2>
          <p className="mx-auto mt-4 max-w-md text-base text-pearl-bg/80">{CONTACT.subhead}</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.2fr]">
          <Reveal className="flex flex-col gap-6 text-sm text-pearl-bg/85">
            {CONTACT.address ? (
              <div>
                <p className="text-xs font-bold tracking-[0.14em] text-pearl-berry-soft uppercase">
                  Address
                </p>
                <p className="mt-2">{CONTACT.address}</p>
              </div>
            ) : null}
            {CONTACT.hours ? (
              <div>
                <p className="text-xs font-bold tracking-[0.14em] text-pearl-berry-soft uppercase">
                  Hours
                </p>
                <p className="mt-2">{CONTACT.hours}</p>
              </div>
            ) : null}
            <div className="flex flex-col gap-2">
              {CONTACT.phone ? (
                <a
                  href={`tel:${CONTACT.phone.replace(/\s+/g, '')}`}
                  className="hover:text-pearl-berry-soft"
                >
                  {CONTACT.phone}
                </a>
              ) : null}
              {CONTACT.email ? (
                <a href={`mailto:${CONTACT.email}`} className="hover:text-pearl-berry-soft">
                  {CONTACT.email}
                </a>
              ) : null}
            </div>
          </Reveal>

          {CONTACT.showForm ? (
            <Reveal delay={100} className="pearl-cup bg-pearl-bg p-6 text-pearl-ink sm:p-8">
              <ContactForm />
              {CONTACT.formNote ? (
                <p className="mt-6 text-xs text-pearl-muted">{CONTACT.formNote}</p>
              ) : null}
            </Reveal>
          ) : null}
        </div>
      </div>
    </section>
  );
}
