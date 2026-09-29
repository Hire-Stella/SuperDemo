'use client';

import { useContent } from '../../context';
import { ContactForm } from '../ContactForm';
import { Reveal } from '../Reveal';

/**
 * The source's own Contact page has no hero photo at all — an address
 * list plus a plain "Write Us a Message" form, unlike tavola's source
 * which paired its reservation form with a full-bleed photo. Hand-matched
 * as a two-column info/form split instead of forcing a photo the source
 * never had.
 */
export default function Contact() {
  const { CONTACT } = useContent();

  return (
    <section id="contact" className="bg-forno-surface py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-start gap-12 px-6 lg:grid-cols-2">
        <Reveal>
          <p className="text-xs font-bold tracking-[0.22em] text-forno-red uppercase">
            {CONTACT.eyebrow}
          </p>
          <h2 className="font-forno-display mt-4 text-4xl text-forno-ink sm:text-5xl">
            {CONTACT.title}
          </h2>
          <p className="mt-4 max-w-md text-base text-forno-muted">{CONTACT.subhead}</p>

          <dl className="mt-8 flex flex-col gap-3 text-sm text-forno-muted">
            {CONTACT.address ? (
              <div className="flex gap-2">
                <dt className="font-semibold text-forno-ink">Address</dt>
                <dd>{CONTACT.address}</dd>
              </div>
            ) : null}
            {CONTACT.phone ? (
              <div className="flex gap-2">
                <dt className="font-semibold text-forno-ink">Phone</dt>
                <dd>
                  <a
                    href={`tel:${CONTACT.phone.replace(/\s+/g, '')}`}
                    className="hover:text-forno-red"
                  >
                    {CONTACT.phone}
                  </a>
                </dd>
              </div>
            ) : null}
            {CONTACT.email ? (
              <div className="flex gap-2">
                <dt className="font-semibold text-forno-ink">Email</dt>
                <dd>
                  <a href={`mailto:${CONTACT.email}`} className="hover:text-forno-red">
                    {CONTACT.email}
                  </a>
                </dd>
              </div>
            ) : null}
            {CONTACT.hours ? (
              <div className="flex gap-2">
                <dt className="font-semibold text-forno-ink">Hours</dt>
                <dd>{CONTACT.hours}</dd>
              </div>
            ) : null}
          </dl>
        </Reveal>

        <Reveal delay={100} className="forno-card border border-forno-border bg-forno-bg p-6 sm:p-8">
          {CONTACT.showForm ? (
            <>
              <ContactForm />
              {CONTACT.formNote ? (
                <p className="mt-4 text-xs text-forno-muted">{CONTACT.formNote}</p>
              ) : null}
            </>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
