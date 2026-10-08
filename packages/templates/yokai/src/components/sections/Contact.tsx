'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { ContactForm } from '../ContactForm';
import { Reveal } from '../Reveal';

/**
 * The reservation band sits over a photo of the lantern-lit alley outside.
 * A flat `ink/80`-style overlay runs across the *entire* photo rather than
 * a top-to-bottom gradient — tavola's hero originally shipped with a
 * gradient that was weakest exactly behind its headline, found only by
 * checking a real screenshot; every sibling template's own fix, and this
 * one, is the same flat scrim, so contrast never depends on what the photo
 * happens to show behind any one line of text.
 */
export default function Contact() {
  const { CONTACT } = useContent();

  return (
    <section id="contact" className="relative overflow-hidden bg-yokai-surface py-20 sm:py-28">
      {CONTACT.backgroundImage ? (
        <div className="absolute inset-0">
          <Image src={CONTACT.backgroundImage} alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-yokai-ink/80" />
        </div>
      ) : null}

      <div className="relative mx-auto max-w-4xl px-6">
        <Reveal className="text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-yokai-gold uppercase">
            {CONTACT.eyebrow}
          </p>
          <h2 className="font-yokai-display mt-4 text-4xl text-yokai-paper sm:text-5xl">
            {CONTACT.title}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-yokai-text/80">{CONTACT.subhead}</p>
        </Reveal>

        {CONTACT.showForm ? (
          <Reveal
            delay={100}
            className="yokai-frame mt-12 border-4 border-yokai-lantern bg-yokai-ink p-6 sm:p-10"
          >
            <ContactForm />
            {CONTACT.formNote ? (
              <p className="mt-6 text-xs text-yokai-muted">{CONTACT.formNote}</p>
            ) : null}
          </Reveal>
        ) : null}

        <Reveal
          delay={150}
          className="mt-10 flex flex-col gap-3 border-t border-white/15 pt-8 text-sm text-yokai-text/80 sm:flex-row sm:justify-center sm:gap-10"
        >
          {CONTACT.address ? <p>{CONTACT.address}</p> : null}
          {CONTACT.phone ? (
            <a
              href={`tel:${CONTACT.phone.replace(/\s+/g, '')}`}
              className="hover:text-yokai-lantern"
            >
              {CONTACT.phone}
            </a>
          ) : null}
          {CONTACT.email ? (
            <a href={`mailto:${CONTACT.email}`} className="hover:text-yokai-lantern">
              {CONTACT.email}
            </a>
          ) : null}
          {CONTACT.hours ? <p>{CONTACT.hours}</p> : null}
        </Reveal>
      </div>
    </section>
  );
}
