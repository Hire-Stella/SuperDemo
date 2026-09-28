'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { ContactForm } from '../ContactForm';
import { Reveal } from '../Reveal';

export default function Contact() {
  const { CONTACT } = useContent();

  return (
    <section id="contact" className="bg-tavola-bg py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-start gap-12 px-6 lg:grid-cols-2">
        <Reveal className="relative aspect-[4/5] overflow-hidden rounded-2xl">
          <Image
            src={CONTACT.image}
            alt="Tavola"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </Reveal>

        <Reveal delay={100}>
          <p className="text-xs font-semibold tracking-[0.3em] text-tavola-gold uppercase">
            {CONTACT.eyebrow}
          </p>
          <h2 className="font-display mt-4 text-4xl text-tavola-text sm:text-5xl">
            {CONTACT.title}
          </h2>
          <p className="mt-4 max-w-md text-base text-tavola-muted">{CONTACT.subhead}</p>

          <dl className="mt-8 flex flex-col gap-3 text-sm text-tavola-muted">
            {CONTACT.address ? (
              <div className="flex gap-2">
                <dt className="font-medium text-tavola-text">Address</dt>
                <dd>{CONTACT.address}</dd>
              </div>
            ) : null}
            {CONTACT.phone ? (
              <div className="flex gap-2">
                <dt className="font-medium text-tavola-text">Phone</dt>
                <dd>
                  <a
                    href={`tel:${CONTACT.phone.replace(/\s+/g, '')}`}
                    className="hover:text-tavola-gold"
                  >
                    {CONTACT.phone}
                  </a>
                </dd>
              </div>
            ) : null}
            {CONTACT.hours ? (
              <div className="flex gap-2">
                <dt className="font-medium text-tavola-text">Hours</dt>
                <dd>{CONTACT.hours}</dd>
              </div>
            ) : null}
          </dl>

          {CONTACT.showForm ? (
            <div className="mt-10 border-t border-tavola-muted/15 pt-8">
              <ContactForm />
              {CONTACT.formNote ? (
                <p className="mt-4 text-xs text-tavola-muted">{CONTACT.formNote}</p>
              ) : null}
            </div>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
