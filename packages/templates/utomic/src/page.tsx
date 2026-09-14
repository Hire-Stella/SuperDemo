"use client";

import Image from "next/image";
import Link from "next/link";
import CtaBanner from "./components/CtaBanner";
import { services, projects, pricingPlans, testimonials, blogPosts, homeWhyChoose, controlFeatures } from "./defaults";
import { useContent } from "./context";

export default function Home() {
  const { services, projects, pricingPlans, testimonials, blogPosts, homeWhyChoose, controlFeatures } = useContent();
  return (
    <>
      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden px-6 pb-40 pt-16 text-white sm:pb-56 lg:pb-72">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-10 lg:flex-row lg:items-start">
          <h1 className="max-w-xl text-3xl font-semibold leading-tight sm:text-4xl lg:text-[2.75rem]">
            Empowering businesses through intelligent automation and scalable AI-driven digital
            systems
          </h1>

          <Link
            href="/project"
            className="flex w-full max-w-xs shrink-0 flex-col gap-6 rounded-3xl bg-white/10 p-6 backdrop-blur-md transition-transform hover:-translate-y-1"
          >
            <p className="text-sm text-white/80">
              Explore a curated selection of our selected projects
            </p>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-semibold">12+</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black">
                &#8599;
              </span>
            </div>
          </Link>
        </div>

        <div className="relative mx-auto mt-16 flex max-w-7xl justify-center sm:mt-24">
          <h2 className="select-none text-center text-[3.2rem] font-bold uppercase leading-none tracking-tight text-white sm:text-[6rem] lg:text-[8.5rem]">
            Cognitive
          </h2>
          <Image
            src="/t/utomic/images/hero-head.png"
            alt="Cognitive AI illustration"
            width={520}
            height={505}
            className="pointer-events-none absolute -bottom-16 left-1/2 w-56 -translate-x-1/2 opacity-90 sm:w-72 lg:w-96"
          />
        </div>
      </section>

      {/* Who we are */}
      <section className="bg-black px-6 pb-24 pt-4 text-white">
        <div className="mx-auto max-w-5xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-periwinkle">
            Who we are
          </span>
          <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
            We design AI systems that turn complexity into clear, scalable business intelligence
          </h2>
          <Link
            href="/about"
            className="mt-8 inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold transition-colors hover:bg-white hover:text-black"
          >
            More about us
          </Link>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-10 border-t border-white/10 pt-12 text-center sm:grid-cols-2">
          <div>
            <p className="text-4xl font-semibold sm:text-5xl">12+</p>
            <p className="mt-2 text-sm text-white/60">Years of digital innovation experience</p>
          </div>
          <div>
            <p className="text-4xl font-semibold sm:text-5xl">250+</p>
            <p className="mt-2 text-sm text-white/60">
              Projects delivered across AI, automation, and digital systems
            </p>
          </div>
        </div>
      </section>

      {/* Featured projects */}
      <section className="bg-white px-6 py-24 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-plum">
                Featured projects
              </span>
              <h2 className="mt-3 max-w-xl text-3xl font-semibold text-black sm:text-4xl">
                Projects that drive real impact
              </h2>
            </div>
            <Link
              href="/project"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-black hover:text-white"
            >
              View all projects &rarr;
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.slug}
                href={`/project/${project.slug}`}
                className="group overflow-hidden rounded-3xl bg-surface transition-shadow hover:shadow-xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={project.image}
                    alt={project.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-black">{project.name}</h3>
                  <div className="mt-3 flex gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-black/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-surface px-6 py-24 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-plum">
                Our services
              </span>
              <h2 className="mt-3 max-w-xl text-3xl font-semibold text-black sm:text-4xl">
                Smart systems for business growth
              </h2>
            </div>
            <Link
              href="/service"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-black hover:text-white"
            >
              View all services &rarr;
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {services.slice(0, 4).map((service) => (
              <Link
                key={service.slug}
                href={`/service/${service.slug}`}
                className="group flex flex-col justify-between gap-8 rounded-3xl bg-white p-8 transition-shadow hover:shadow-xl"
              >
                <div>
                  <h3 className="text-xl font-semibold text-black">{service.name}</h3>
                  <p className="mt-3 text-sm text-black/60">{service.tagline}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {service.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-black/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white transition-transform group-hover:rotate-45">
                    &#8599;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="bg-black px-6 py-24 text-white lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-periwinkle">
                Why choose us
              </span>
              <h2 className="mt-3 max-w-xl text-3xl font-semibold sm:text-4xl">
                Built for smarter digital growth
              </h2>
            </div>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white hover:text-black"
            >
              Learn More &rarr;
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {homeWhyChoose.map((item) => (
              <div key={item.label} className="rounded-3xl border border-white/10 p-8">
                <p className="text-4xl font-semibold text-brand-periwinkle">{item.value}</p>
                <h3 className="mt-4 text-lg font-semibold">{item.label}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/60">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Real-time AI control */}
      <section className="gradient-secondary px-6 py-24 text-white lg:py-28">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 lg:grid-cols-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-periwinkle">
              Real time ai control
            </span>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
              Your personal AI control system
            </h2>
            <p className="mt-4 max-w-md text-white/70">
              Manage every workflow and insight from one intelligent real-time AI platform.
            </p>
            <Link
              href="/pricing"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black"
            >
              View our transparent pricing
            </Link>

            <div className="mt-12 space-y-6">
              {controlFeatures.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4">
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm">
                    &#10003;
                  </span>
                  <div>
                    <h4 className="font-semibold">{feature.title}</h4>
                    <p className="text-sm text-white/60">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-md items-center justify-center">
            <Image
              src="/t/utomic/images/dashboard-mockup-2.png"
              alt="AI dashboard"
              width={640}
              height={800}
              className="w-full rounded-3xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-surface px-6 py-24 lg:py-28">
        <div className="mx-auto max-w-5xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-plum">
            Price plan
          </span>
          <h2 className="mt-3 text-3xl font-semibold text-black sm:text-4xl">
            Flexible plans for modern teams
          </h2>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
          {pricingPlans.map((plan, index) => (
            <div
              key={plan.name}
              className={`flex flex-col rounded-3xl p-8 ${
                index === 1 ? "bg-black text-white" : "bg-white text-black"
              }`}
            >
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <p className={`mt-3 text-sm ${index === 1 ? "text-white/60" : "text-black/60"}`}>
                {plan.description}
              </p>
              <Link
                href="/contact"
                className={`mt-6 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold ${
                  index === 1 ? "bg-white text-black" : "bg-black text-white"
                }`}
              >
                Start a project today
              </Link>
              <ul className="mt-8 space-y-3 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                        index === 1 ? "bg-white/10" : "bg-black/5"
                      }`}
                    >
                      &#10003;
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex items-baseline gap-1">
                <span className="text-3xl font-semibold">{plan.price}</span>
                <span className={index === 1 ? "text-white/50" : "text-black/50"}>USD</span>
                <span className={index === 1 ? "text-white/50" : "text-black/50"}>
                  {plan.period}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white px-6 py-24 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-plum">
              Testimonial
            </span>
            <h2 className="mt-3 text-3xl font-semibold text-black sm:text-4xl">
              Stories shared by trusted partners
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="flex flex-col justify-between rounded-3xl bg-surface p-8">
                <p className="text-sm leading-relaxed text-black/70">&ldquo;{testimonial.quote}&rdquo;</p>
                {testimonial.stat && (
                  <div className="mt-6">
                    <p className="text-2xl font-semibold text-black">{testimonial.stat}</p>
                    <p className="text-xs text-black/50">{testimonial.statLabel}</p>
                  </div>
                )}
                <div className="mt-6 flex items-center gap-3 border-t border-black/10 pt-6">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-black">{testimonial.name}</p>
                    <p className="text-xs text-black/50">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog */}
      <section className="bg-surface px-6 py-24 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-plum">
                Our blog
              </span>
              <h2 className="mt-3 max-w-xl text-3xl font-semibold text-black sm:text-4xl">
                Insights shaping smarter AI growth
              </h2>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-black hover:text-white"
            >
              View all blogs &rarr;
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group overflow-hidden rounded-3xl bg-white transition-shadow hover:shadow-xl"
              >
                <div className="relative aspect-[6/5] overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-base font-semibold text-black">{post.title}</h3>
                  <p className="mt-3 text-xs text-black/50">
                    {post.author} &mdash; {post.date}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
