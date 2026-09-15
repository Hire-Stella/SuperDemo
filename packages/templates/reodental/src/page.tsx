"use client";

import Image from "next/image";
import { Calendar, ArrowRight } from "lucide-react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LabelTrackButton from "./components/LabelTrackButton";
import HeroBackground from "./components/HeroBackground";
import AvatarStack from "./components/AvatarStack";
import BeforeAfterSlider from "./components/BeforeAfterSlider";
import StatCounter from "./components/StatCounter";
import FaqAccordion from "./components/FaqAccordion";
import TreatmentMarquee from "./components/TreatmentMarquee";
import TestimonialCarousel from "./components/TestimonialCarousel";
import Reveal, { RevealGroup, RevealItem } from "./components/Reveal";
import { CONTACT_ADDRESS, CONTACT_EMAIL, CONTACT_HOURS, CONTACT_PHONE, CONTACT_PHONE_HREF, DIFFERENCE_STEPS, FAQS, HERO, SERVICES, STATS, TEAM, TESTIMONIALS, TREATMENT_CHIPS } from "./defaults";
import { useContent } from "./context";

export default function Home() {
  const { CONTACT_ADDRESS, CONTACT_EMAIL, CONTACT_HOURS, CONTACT_PHONE, CONTACT_PHONE_HREF, DIFFERENCE_STEPS, FAQS, HERO, SERVICES, STATS, TEAM, TESTIMONIALS, TREATMENT_CHIPS } = useContent();
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-ink text-cream">
          <HeroBackground
            src="/t/reodental/images/hero-dentist-treating-patient.png"
            alt="Dentist treating a smiling patient"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/30" />
          <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
            <Reveal>
              <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-cream/70">
                <span className="h-px w-6 bg-cream/50" />
                {HERO.eyebrow}
              </span>
            </Reveal>
            <Reveal delay={0.1}>
              <h1 className="mt-6 max-w-2xl text-4xl font-medium leading-tight tracking-tight md:text-6xl">
                {HERO.titleLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h1>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-6 max-w-md text-sm text-cream/80 md:text-base">
                {HERO.subhead}
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <LabelTrackButton
                  href="/book-appointment"
                  variant="primary"
                  className="!bg-cream !text-ink hover:!bg-white"
                  icon={<Calendar className="h-4 w-4" aria-hidden="true" />}
                >
                  {HERO.primaryCta}
                </LabelTrackButton>
                <LabelTrackButton
                  href={CONTACT_PHONE_HREF}
                  variant="secondary"
                  className="!border-cream/40 !text-cream hover:!border-cream"
                  icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
                >
                  {HERO.secondaryCta}
                </LabelTrackButton>
                <span className="text-xs italic text-cream/60">
                  {HERO.emergencyNote}
                </span>
              </div>
            </Reveal>
            <Reveal delay={0.4}>
              <div className="mt-10 flex items-center gap-3">
                <AvatarStack />
                <p className="text-sm text-cream/80">{HERO.socialProof}</p>
              </div>
            </Reveal>
          </div>
          <div className="relative border-t border-cream/10 bg-ink/60 py-4">
            <TreatmentMarquee items={TREATMENT_CHIPS} />
          </div>
        </section>

        {/* Services */}
        <section id="services" className="relative bg-cream py-24">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal>
              <span className="text-xs font-semibold tracking-[0.2em] text-gold">
                OUR SERVICES
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-4 max-w-2xl text-3xl font-medium tracking-tight text-ink md:text-4xl">
                Treatments designed around your smile.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-4 max-w-2xl text-sm text-muted md:text-base">
                From everyday repairs to complete smile improvements, our
                treatments are designed to restore function, improve
                appearance, and help you feel confident again.
              </p>
            </Reveal>

            <RevealGroup className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {SERVICES.map((service) => (
                <RevealItem
                  key={service.number}
                  className="flex flex-col rounded-3xl border border-border bg-white p-5"
                >
                  <BeforeAfterSlider
                    before={service.before}
                    after={service.after}
                    label={service.name}
                  />
                  <div className="mt-5 flex items-start justify-between gap-3">
                    <span className="text-xs font-semibold text-gold">
                      {service.number}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-medium text-ink">
                    {service.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm text-muted">
                    {service.description}
                  </p>
                  <a
                    href="/book-appointment"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-ink"
                  >
                    Learn more <span aria-hidden="true">→</span>
                  </a>
                </RevealItem>
              ))}
            </RevealGroup>

            {/* Stats card */}
            <Reveal delay={0.1}>
              <div className="mt-16 grid gap-8 overflow-hidden rounded-3xl bg-ink text-cream md:grid-cols-2">
                <div className="relative min-h-[220px]">
                  <Image
                    src="/t/reodental/images/clinic-stats-photo.png"
                    alt="Lumina Dental clinic interior"
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col justify-center gap-8 p-8 sm:flex-row sm:items-center md:p-10">
                  {STATS.map((stat) => (
                    <StatCounter
                      key={stat.label}
                      value={stat.value}
                      suffix={stat.suffix}
                      label={stat.label}
                    />
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* The Difference / Why Us */}
        <section id="benefits" className="bg-cream-deep py-24">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal>
              <span className="text-xs font-semibold tracking-[0.2em] text-gold">
                THE DIFFERENCE
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-4 max-w-2xl text-3xl font-medium tracking-tight text-ink md:text-4xl">
                Modern treatments, thoughtful care.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-4 max-w-2xl text-sm text-muted md:text-base">
                From a simple filling to a complete smile restoration, every
                treatment starts with understanding what your teeth need and
                what you want to achieve.
              </p>
            </Reveal>

            <RevealGroup className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {DIFFERENCE_STEPS.map((step) => (
                <RevealItem
                  key={step.number}
                  className="rounded-2xl border border-border-strong/40 bg-cream p-6"
                >
                  <span className="text-sm font-semibold text-gold">
                    {step.number}
                  </span>
                  <p className="mt-3 text-base font-medium text-ink">
                    {step.title}
                  </p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>

        {/* Team */}
        <section className="bg-cream py-24">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal>
              <span className="text-xs font-semibold tracking-[0.2em] text-gold">
                THE TEAM
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-4 max-w-2xl text-3xl font-medium tracking-tight text-ink md:text-4xl">
                The people who&rsquo;ll treat you
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-4 max-w-2xl text-sm text-muted md:text-base">
                Experienced hands behind every treatment. Our team combines
                clinical experience with modern techniques to make every
                treatment precise, comfortable, and considered.
              </p>
            </Reveal>

            <RevealGroup className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {TEAM.map((member) => (
                <RevealItem key={member.name} className="text-center">
                  <div className="relative mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-2xl">
                    <Image
                      src={member.photo}
                      alt={member.name}
                      fill
                      sizes="220px"
                      className="object-cover"
                    />
                  </div>
                  <p className="mt-4 text-base font-medium text-ink">
                    {member.name}
                  </p>
                  <p className="text-sm text-muted">{member.role}</p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="bg-cream-deep py-24">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal className="text-center">
              <span className="text-xs font-semibold tracking-[0.2em] text-gold">
                PATIENT STORIES
              </span>
            </Reveal>
            <Reveal delay={0.05} className="text-center">
              <h2 className="mx-auto mt-4 max-w-xl text-3xl font-medium tracking-tight text-ink md:text-4xl">
                Results patients feel good about.
              </h2>
            </Reveal>

            <div className="mt-14">
              <TestimonialCarousel items={TESTIMONIALS} />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="bg-cream py-24">
          <div className="mx-auto max-w-4xl px-6">
            <Reveal>
              <span className="text-xs font-semibold tracking-[0.2em] text-gold">
                COMMON QUESTIONS
              </span>
            </Reveal>
            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <Reveal delay={0.05}>
                  <h2 className="max-w-lg text-3xl font-medium tracking-tight text-ink md:text-4xl">
                    Questions before you book?
                  </h2>
                </Reveal>
                <Reveal delay={0.1}>
                  <p className="mt-4 max-w-lg text-sm text-muted md:text-base">
                    Still have a question? Reach out and a real person from
                    our front desk will get back to you the same day.
                  </p>
                </Reveal>
              </div>
              <Reveal delay={0.15}>
                <LabelTrackButton href="/book-appointment" variant="secondary">
                  Ask Us Anything
                </LabelTrackButton>
              </Reveal>
            </div>

            <Reveal delay={0.1} className="mt-10">
              <FaqAccordion items={FAQS} />
            </Reveal>
          </div>
        </section>

        {/* Get In Touch */}
        <section className="bg-ink py-24 text-cream">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-2 md:items-center">
            <div>
              <Reveal>
                <span className="text-xs font-semibold tracking-[0.2em] text-gold">
                  GET IN TOUCH
                </span>
              </Reveal>
              <Reveal delay={0.05}>
                <h2 className="mt-4 max-w-lg text-3xl font-medium tracking-tight md:text-4xl">
                  Ready to improve your smile?
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-4 max-w-lg text-sm text-cream/70 md:text-base">
                  Whether you need a simple repair, want to brighten your
                  smile, or are considering a more complete restoration,
                  we&rsquo;re here to help you find the right treatment.
                </p>
              </Reveal>
              <Reveal delay={0.15}>
                <ul className="mt-8 space-y-2 text-sm text-cream/80">
                  <li>{CONTACT_PHONE}</li>
                  <li>{CONTACT_EMAIL}</li>
                  <li>{CONTACT_ADDRESS}</li>
                  <li>{CONTACT_HOURS}</li>
                </ul>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="mt-8">
                  <LabelTrackButton
                    href="/book-appointment"
                    variant="primary"
                    className="!bg-cream !text-ink hover:!bg-white"
                    icon={<Calendar className="h-4 w-4" aria-hidden="true" />}
                  >
                    Book an appointment
                  </LabelTrackButton>
                </div>
              </Reveal>
            </div>
            <Reveal delay={0.1}>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl">
                <Image
                  src="/t/reodental/images/clinic-exterior.png"
                  alt="Lumina Dental clinic exterior"
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
