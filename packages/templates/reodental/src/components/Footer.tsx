"use client";

import Link from "next/link";
import { BRAND_NAME, BRAND_TAGLINE, CONTACT_ADDRESS, CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_HREF, COPYRIGHT, FOOTER_SERVICES, FOOTER_STUDIO_LINKS, TEMPLATE_CREDIT } from "../defaults";
import { useContent } from "../context";

export default function Footer() {
  const { BRAND_NAME, BRAND_TAGLINE, CONTACT_ADDRESS, CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_HREF, COPYRIGHT, FOOTER_SERVICES, FOOTER_STUDIO_LINKS, TEMPLATE_CREDIT } = useContent();
  return (
    <footer className="border-t border-border bg-ink text-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-4">
        <div>
          <p className="text-lg font-semibold">{BRAND_NAME}</p>
          <p className="mt-3 max-w-xs text-sm text-cream/70">{BRAND_TAGLINE}</p>
        </div>

        <div>
          <p className="text-sm font-semibold text-cream/90">Services</p>
          <ul className="mt-4 space-y-2">
            {FOOTER_SERVICES.map((service) => (
              <li key={service} className="text-sm text-cream/70">
                {service}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-cream/90">Studio</p>
          <ul className="mt-4 space-y-2">
            {FOOTER_STUDIO_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-sm text-cream/70 transition-colors hover:text-cream"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-cream/90">Contact Us</p>
          <ul className="mt-4 space-y-2 text-sm text-cream/70">
            <li>
              <a href={CONTACT_PHONE_HREF}>{CONTACT_PHONE}</a>
            </li>
            <li>
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </li>
            <li>{CONTACT_ADDRESS}</li>
          </ul>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-2 border-t border-cream/10 px-6 py-6 text-xs text-cream/60 md:flex-row md:items-center md:justify-between">
        <p>{COPYRIGHT}</p>
        <p>{TEMPLATE_CREDIT}</p>
      </div>
    </footer>
  );
}
