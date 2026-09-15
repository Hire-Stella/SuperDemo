"use client";

import { contactAddress, contactEmail, contactHeading, contactPhone, contactSubhead, contactVideo, contactVideoPoster } from "../defaults";
import { ContactForm } from "./ContactForm";
import { useContent } from "../context";

export function ContactSection() {
  const { contactAddress, contactEmail, contactHeading, contactPhone, contactSubhead, contactVideo, contactVideoPoster } = useContent();
  return (
    <section id="contact" className="py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="zv-heading text-3xl text-zv-ink sm:text-4xl">{contactHeading}</h2>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-zv-muted">{contactSubhead}</p>

            <div className="mt-8 flex flex-col gap-4">
              <a href={`tel:${contactPhone}`} className="flex items-center gap-3 text-sm text-zv-ink">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-zv-line">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-4 w-4">
                    <path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4a2 2 0 0 1-2 2C9.5 21 3 14.5 3 6a2 2 0 0 1 2-2z" strokeLinejoin="round" />
                  </svg>
                </span>
                {contactPhone}
              </a>
              <a href={`mailto:${contactEmail}`} className="flex items-center gap-3 text-sm text-zv-ink">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-zv-line">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-4 w-4">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {contactEmail}
              </a>
              <div className="flex items-start gap-3 text-sm text-zv-ink">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zv-line">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-4 w-4">
                    <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z" strokeLinejoin="round" />
                    <circle cx="12" cy="9.5" r="2.3" />
                  </svg>
                </span>
                <span className="pt-2">{contactAddress}</span>
              </div>
            </div>

            <video
              src={contactVideo}
              poster={contactVideoPoster}
              autoPlay
              loop
              muted
              playsInline
              className="mt-8 h-36 w-36"
            />
          </div>

          <div className="rounded-3xl border border-zv-line bg-zv-card p-6 sm:p-8">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
