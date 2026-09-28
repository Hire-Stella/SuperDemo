'use client';

import { useContent } from '../../context';
import { ContactForm } from '../ContactForm';
import { Reveal } from '../Reveal';

/**
 * The source's own closing CTA band — literal heading and subhead, this
 * port's own name+email form beneath it (see ContactForm.tsx's own note).
 */
export default function Contact() {
  const { CONTACT } = useContent();

  return (
    <section id="contact" className="bg-fluxo-primary py-20 sm:py-28">
      <div className="mx-auto grid max-w-5xl items-center gap-12 px-6 lg:grid-cols-2">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.16em] text-fluxo-accent uppercase">
            {CONTACT.eyebrow}
          </p>
          <h2 className="font-fluxo-display mt-4 text-3xl text-white sm:text-4xl">
            {CONTACT.title}
          </h2>
          {CONTACT.subhead ? (
            <p className="mt-4 max-w-md text-base text-white/70">{CONTACT.subhead}</p>
          ) : null}

          <dl className="mt-8 flex flex-col gap-2 text-sm text-white/70">
            {CONTACT.email ? (
              <div className="flex gap-2">
                <dt className="font-medium text-white">Email</dt>
                <dd>
                  <a href={`mailto:${CONTACT.email}`} className="hover:text-white">
                    {CONTACT.email}
                  </a>
                </dd>
              </div>
            ) : null}
            {CONTACT.phone ? (
              <div className="flex gap-2">
                <dt className="font-medium text-white">Phone</dt>
                <dd>
                  <a href={`tel:${CONTACT.phone.replace(/\s+/g, '')}`} className="hover:text-white">
                    {CONTACT.phone}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        </Reveal>

        <Reveal delay={100} className="fluxo-card border border-white/10 bg-white p-7 sm:p-8">
          {CONTACT.showForm ? (
            <>
              <ContactForm />
              {CONTACT.formNote ? (
                <p className="mt-4 text-center text-xs text-fluxo-faint">{CONTACT.formNote}</p>
              ) : null}
            </>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
