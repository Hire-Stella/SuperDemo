'use client';

import { useContent } from '../../context';
import { ContactForm } from '../ContactForm';
import { Reveal } from '../Reveal';

export default function Contact() {
  const { CONTACT } = useContent();

  return (
    <section id="contact" className="bg-aurelia-surface py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-6">
        <Reveal className="text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-aurelia-accent uppercase">
            {CONTACT.eyebrow}
          </p>
          <h2 className="font-aurelia-display mt-4 text-4xl text-aurelia-ink sm:text-5xl">
            {CONTACT.title}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-aurelia-muted">{CONTACT.subhead}</p>
        </Reveal>

        {CONTACT.showForm ? (
          <Reveal
            delay={100}
            className="aurelia-card mt-12 border border-aurelia-border/70 bg-aurelia-bg p-6 sm:p-10"
          >
            <ContactForm />
            {CONTACT.formNote ? (
              <p className="mt-6 text-xs text-aurelia-muted">{CONTACT.formNote}</p>
            ) : null}
          </Reveal>
        ) : null}

        <Reveal
          delay={150}
          className="mt-10 flex flex-col gap-3 border-t border-aurelia-border/70 pt-8 text-sm text-aurelia-muted sm:flex-row sm:justify-center sm:gap-10"
        >
          {CONTACT.address ? <p>{CONTACT.address}</p> : null}
          {CONTACT.phone ? (
            <a
              href={`tel:${CONTACT.phone.replace(/\s+/g, '')}`}
              className="hover:text-aurelia-plum"
            >
              {CONTACT.phone}
            </a>
          ) : null}
          {CONTACT.email ? (
            <a href={`mailto:${CONTACT.email}`} className="hover:text-aurelia-plum">
              {CONTACT.email}
            </a>
          ) : null}
          {CONTACT.hours ? <p>{CONTACT.hours}</p> : null}
        </Reveal>
      </div>
    </section>
  );
}
