'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's footer is really two bands: a final "Ready to invest
 * smarter?" CTA over a full-bleed meadow photo (this template's own
 * `CONTACT`, since the source has no embedded enquiry form — see
 * defaults.ts), then the link-column footer proper. The source has no
 * contact/reservation form anywhere on the site, so `CONTACT.showForm` is
 * not read here — rendering one would invent a form the source never had.
 */
export default function Footer() {
  const { SITE_NAME, FOOTER, SOCIAL_LINKS, TEMPLATE_CREDIT, CONTACT } = useContent();

  return (
    <footer>
      <section className="relative overflow-hidden py-20 text-center sm:py-28">
        {CONTACT.bg ? (
          <div className="absolute inset-0" aria-hidden>
            <Image src={CONTACT.bg} alt="" fill sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-vantra-bg via-vantra-bg/50 to-vantra-bg/90" />
          </div>
        ) : null}

        <Reveal className="relative mx-auto max-w-xl px-6">
          <h2 className="font-vantra-display text-4xl text-vantra-ink">{CONTACT.title}</h2>
          {CONTACT.subhead ? <p className="mt-4 text-vantra-muted">{CONTACT.subhead}</p> : null}

          {CONTACT.primaryCta || CONTACT.secondaryCta ? (
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              {CONTACT.primaryCta ? (
                <Link
                  href={CONTACT.primaryCta.href}
                  className="vantra-pill inline-flex items-center gap-2 bg-vantra-accent py-3 pr-2.5 pl-6 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(61,99,245,0.6)] transition-opacity hover:opacity-90"
                >
                  {CONTACT.primaryCta.label}
                  <span className="vantra-pill flex h-7 w-7 items-center justify-center bg-white">
                    <Image src="/t/vantra/icons/arrow.svg" alt="" width={11} height={8} />
                  </span>
                </Link>
              ) : null}
              {CONTACT.secondaryCta ? (
                <Link
                  href={CONTACT.secondaryCta.href}
                  className="vantra-pill inline-flex items-center bg-vantra-bg px-6 py-3 text-sm font-semibold text-vantra-ink ring-1 ring-vantra-border transition-colors hover:bg-vantra-surface"
                >
                  {CONTACT.secondaryCta.label}
                </Link>
              ) : null}
            </div>
          ) : null}
        </Reveal>
      </section>

      <div className="border-t border-vantra-border bg-vantra-bg">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
            <div>
              <p className="font-vantra-display text-xl text-vantra-ink">{SITE_NAME}</p>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-vantra-muted">
                {FOOTER.tagline}
              </p>
              {CONTACT.email ? (
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="vantra-pill mt-5 inline-flex bg-vantra-dark px-5 py-2.5 text-sm font-semibold text-white"
                >
                  {CONTACT.email}
                </a>
              ) : null}
            </div>

            <div>
              <h3 className="text-xs font-semibold tracking-[0.14em] text-vantra-muted uppercase">
                {FOOTER.quickLinksTitle}
              </h3>
              <ul className="mt-4 flex flex-col gap-3">
                {FOOTER.quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-vantra-muted hover:text-vantra-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold tracking-[0.14em] text-vantra-muted uppercase">
                Contact
              </h3>
              <ul className="mt-4 flex flex-col gap-3 text-sm text-vantra-muted">
                {CONTACT.address ? <li>{CONTACT.address}</li> : null}
                {CONTACT.hours ? <li>{CONTACT.hours}</li> : null}
                {CONTACT.phone ? (
                  <li>
                    <a href={`tel:${CONTACT.phone.replace(/\s+/g, '')}`} className="hover:text-vantra-ink">
                      {CONTACT.phone}
                    </a>
                  </li>
                ) : null}
              </ul>
              <div className="mt-5 flex gap-4">
                <a
                  href={SOCIAL_LINKS.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                >
                  <Image src="/t/vantra/icons/social-1.svg" alt="" width={20} height={20} />
                </a>
                <a
                  href={SOCIAL_LINKS.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                >
                  <Image src="/t/vantra/icons/social-2.svg" alt="" width={20} height={20} />
                </a>
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                >
                  <Image src="/t/vantra/icons/social-3.svg" alt="" width={20} height={20} />
                </a>
                <a
                  href={SOCIAL_LINKS.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                >
                  <Image src="/t/vantra/icons/social-4.svg" alt="" width={20} height={20} />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-col gap-2 border-t border-vantra-border pt-6 text-xs text-vantra-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {FOOTER.copyright}
            </p>
            <p>Design by {TEMPLATE_CREDIT}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
