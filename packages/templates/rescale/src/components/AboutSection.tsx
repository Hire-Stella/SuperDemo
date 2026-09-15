"use client";

import Image from "next/image";
import Link from "next/link";

import { companyStory, founders, lifeAtVectoraPhotos } from "../defaults";
import { socialIcon } from "./icons";
import { Reveal } from "./Reveal";
import { useContent } from "../context";

export function AboutSection() {
  const { companyStory, founders, lifeAtVectoraPhotos } = useContent();
  return (
    <section id="about-us" className="relative overflow-hidden bg-rs-bg py-20 sm:py-24">
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="rs-eyebrow">About Us</span>
          <h2 className="rs-heading mt-3 text-4xl text-rs-ink sm:text-5xl">Meet the Founders</h2>
          <p className="mt-4 text-base text-rs-muted">
            The minds behind innovative solutions, making tomorrow&rsquo;s tech today with
            expertise that shapes the future of business.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {founders.map((founder, i) => (
            <Reveal key={founder.name} delay={i * 110} className="text-center">
              <div className="relative mx-auto aspect-[4/5] w-full max-w-[260px] overflow-hidden rounded-3xl border border-black/5 shadow-sm">
                <Image src={founder.photo} alt={founder.name} fill className="object-cover" />
              </div>
              <h3 className="rs-heading mt-5 text-lg text-rs-ink">{founder.name}</h3>
              <p className="text-sm text-rs-muted">{founder.role}</p>
              <div className="mt-3 flex items-center justify-center gap-2">
                {founder.socials.map((social) => {
                  const Icon = socialIcon(social.icon);
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${founder.name} on ${social.label}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-rs-brand transition-colors hover:bg-rs-brand/10 hover:text-rs-brand-dark"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-20 grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="rs-eyebrow">{companyStory.eyebrow}</p>
            <div className="mt-4 flex flex-col gap-4">
              {companyStory.paragraphs.map((paragraph, i) => (
                <p key={i} className="text-sm leading-relaxed text-rs-muted">
                  {paragraph}
                </p>
              ))}
            </div>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-rs-ink">
              <Image src="/t/rescale/images/yc-badge-logo.svg" alt="Y Combinator" width={18} height={18} />
              {companyStory.badge}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="flex items-baseline justify-between gap-4">
              <p className="rs-eyebrow">Life at Vectora</p>
              <Link
                href="/contact"
                className="shrink-0 rounded-full border border-black/10 px-4 py-1.5 text-xs font-semibold text-rs-ink transition-colors hover:border-rs-brand-dark hover:text-rs-brand-dark"
              >
                Join Us
              </Link>
            </div>
            <h3 className="rs-heading mt-2 text-2xl text-rs-ink">Our culture through the lens</h3>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {lifeAtVectoraPhotos.map((photo, i) => (
                <div
                  key={photo}
                  className={`relative overflow-hidden rounded-2xl border border-black/5 ${
                    i === 0 ? "col-span-2 aspect-[16/9]" : "aspect-square"
                  }`}
                >
                  <Image src={photo} alt="Life at Vectora" fill className="object-cover" />
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-rs-muted">
                Discover the full story of how our team collaborates, ships, and grows together.
              </p>
              <Link
                href="/journal"
                className="rs-gradient-brand inline-flex shrink-0 items-center justify-center rounded-full px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-[1.03]"
              >
                Read More
              </Link>
            </div>
          </Reveal>
        </div>
      </div>

      <Image
        src="/t/rescale/images/bg-blur-shape-3.png"
        alt=""
        fill
        className="pointer-events-none object-cover opacity-60 mix-blend-multiply"
      />
    </section>
  );
}
