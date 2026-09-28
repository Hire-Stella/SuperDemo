'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { ContactForm } from '../ContactForm';
import { Reveal } from '../Reveal';

/**
 * The source's own closing "Don't wait for tomorrow, insure yourself
 * today." CTA band, folded together with its separate `/contact` route's
 * own office list and enquiry form (see defaults.ts's `CONTACT` note).
 */
export default function Contact() {
  const { CONTACT } = useContent();

  return (
    <section id="contact" className="bg-insunet-bg py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="text-xs font-semibold tracking-[0.24em] text-insunet-teal uppercase">
              {CONTACT.eyebrow}
            </p>
            <h2 className="font-insunet-display mt-4 text-3xl text-insunet-ink sm:text-4xl">
              {CONTACT.title}
            </h2>
            <p className="mt-3 max-w-md text-base leading-relaxed text-insunet-muted">
              {CONTACT.subhead}
            </p>

            {CONTACT.image ? (
              <div className="insunet-card relative mt-8 aspect-[4/3] w-full overflow-hidden bg-insunet-surface">
                <Image
                  src={CONTACT.image}
                  alt="A couple meeting with their insurance advisor"
                  fill
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : null}

            {CONTACT.offices.length > 0 ? (
              <div className="mt-8 grid grid-cols-1 gap-5 border-t border-insunet-border/60 pt-6 sm:grid-cols-3">
                {CONTACT.offices.map((office) => (
                  <div key={office.city}>
                    <p className="text-sm font-semibold text-insunet-ink">{office.city}</p>
                    <a
                      href={`tel:${office.phone.replace(/\s+/g, '')}`}
                      className="mt-1 block text-xs text-insunet-muted hover:text-insunet-primary"
                    >
                      {office.phone}
                    </a>
                    <a
                      href={`mailto:${office.email}`}
                      className="block text-xs text-insunet-muted hover:text-insunet-primary"
                    >
                      {office.email}
                    </a>
                  </div>
                ))}
              </div>
            ) : null}
          </Reveal>

          <Reveal delay={100}>
            <div className="insunet-card border border-insunet-border/60 bg-insunet-surface p-6 sm:p-8">
              <div className="flex flex-col gap-1 text-sm text-insunet-muted">
                {CONTACT.address ? <p>{CONTACT.address}</p> : null}
                {CONTACT.phone ? (
                  <a
                    href={`tel:${CONTACT.phone.replace(/\s+/g, '')}`}
                    className="hover:text-insunet-primary"
                  >
                    {CONTACT.phone}
                  </a>
                ) : null}
                {CONTACT.email ? (
                  <a href={`mailto:${CONTACT.email}`} className="hover:text-insunet-primary">
                    {CONTACT.email}
                  </a>
                ) : null}
              </div>

              {CONTACT.showForm ? (
                <div className="mt-6">
                  <ContactForm />
                </div>
              ) : null}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
