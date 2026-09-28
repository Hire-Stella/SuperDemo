'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { ContactForm } from '../ContactForm';
import { Reveal } from '../Reveal';

/**
 * The reservation band sits over the source's own "Book Table Image"
 * background photo. A flat `ink/80`-style overlay runs across the *entire*
 * photo rather than a top-to-bottom gradient — tavola's hero shipped with a
 * gradient that was weakest exactly behind its headline, found only by
 * checking a real screenshot; aurelia's and this template's own fix is the
 * same flat scrim, so contrast never depends on what the photo happens to
 * show behind any one line of text.
 */
export default function Contact() {
  const { CONTACT } = useContent();

  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-brasa-dark py-20 text-white sm:py-28"
    >
      {CONTACT.backgroundImage ? (
        <div className="absolute inset-0">
          <Image src={CONTACT.backgroundImage} alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-brasa-dark/80" />
        </div>
      ) : null}

      <div className="relative mx-auto max-w-4xl px-6">
        <Reveal className="text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-brasa-marigold uppercase">
            {CONTACT.eyebrow}
          </p>
          <h2 className="font-brasa-display mt-4 text-4xl sm:text-5xl">{CONTACT.title}</h2>
          <p className="mx-auto mt-4 max-w-md text-base text-white/80">{CONTACT.subhead}</p>
        </Reveal>

        {CONTACT.showForm ? (
          <Reveal
            delay={100}
            className="brasa-frame mt-12 border-4 border-brasa-marigold bg-brasa-bg p-6 sm:p-10"
          >
            <ContactForm />
            {CONTACT.formNote ? (
              <p className="mt-6 text-xs text-brasa-muted">{CONTACT.formNote}</p>
            ) : null}
          </Reveal>
        ) : null}

        <Reveal
          delay={150}
          className="mt-10 flex flex-col gap-3 border-t border-white/15 pt-8 text-sm text-white/80 sm:flex-row sm:justify-center sm:gap-10"
        >
          {CONTACT.address ? <p>{CONTACT.address}</p> : null}
          {CONTACT.phone ? (
            <a
              href={`tel:${CONTACT.phone.replace(/\s+/g, '')}`}
              className="hover:text-brasa-marigold"
            >
              {CONTACT.phone}
            </a>
          ) : null}
          {CONTACT.email ? (
            <a href={`mailto:${CONTACT.email}`} className="hover:text-brasa-marigold">
              {CONTACT.email}
            </a>
          ) : null}
          {CONTACT.hours ? <p>{CONTACT.hours}</p> : null}
        </Reveal>
      </div>
    </section>
  );
}
