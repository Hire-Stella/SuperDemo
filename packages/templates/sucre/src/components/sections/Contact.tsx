'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { ContactForm } from '../ContactForm';
import { Reveal } from '../Reveal';

/**
 * The source's closing "Let's create something sweet" CTA band, folded
 * together with its footer's own address/phone/email block and a plain
 * enquiry form (see defaults.ts's `CONTACT` note on why the form itself is
 * hand-built rather than ported).
 */
export default function Contact() {
  const { CONTACT } = useContent();

  return (
    <section id="contact" className="bg-sucre-surface py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal className="sucre-card relative order-2 aspect-[4/5] overflow-hidden lg:order-1">
            {CONTACT.image ? (
              <Image
                src={CONTACT.image}
                alt="A finished celebration cake ready for pickup"
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            ) : null}
          </Reveal>

          <Reveal delay={100} className="order-1 lg:order-2">
            <p className="text-xs font-semibold tracking-[0.28em] text-sucre-rose uppercase">
              {CONTACT.eyebrow}
            </p>
            <h2 className="font-sucre-display mt-4 text-3xl text-sucre-ink sm:text-4xl">
              {CONTACT.title}
            </h2>
            <p className="mt-3 max-w-md text-base text-sucre-muted">{CONTACT.subhead}</p>

            <div className="mt-8 flex flex-col gap-2 text-sm text-sucre-muted">
              {CONTACT.address ? <p>{CONTACT.address}</p> : null}
              {CONTACT.phone ? (
                <a
                  href={`tel:${CONTACT.phone.replace(/\s+/g, '')}`}
                  className="hover:text-sucre-pink"
                >
                  {CONTACT.phone}
                </a>
              ) : null}
              {CONTACT.email ? (
                <a href={`mailto:${CONTACT.email}`} className="hover:text-sucre-pink">
                  {CONTACT.email}
                </a>
              ) : null}
            </div>

            {CONTACT.showForm ? (
              <div className="sucre-card mt-8 bg-sucre-bg p-6 sm:p-8">
                <ContactForm />
              </div>
            ) : null}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
