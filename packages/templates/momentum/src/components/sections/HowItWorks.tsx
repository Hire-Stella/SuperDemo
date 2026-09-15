"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BOOKING_URL, HOW_IT_WORKS } from "../../defaults";
import Reveal from "../../components/Reveal";
import { useContent } from "../../context";

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function HowItWorks() {
  const { BOOKING_URL, HOW_IT_WORKS } = useContent();
  return (
    <section id="how-it-works" className="bg-cream py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-accent">
            {HOW_IT_WORKS.eyebrow}
          </p>
          <h2 className="font-display mt-4 text-4xl font-semibold sm:text-5xl">
            {HOW_IT_WORKS.title}
          </h2>
          <p className="mt-4 text-base text-muted">{HOW_IT_WORKS.subhead}</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-2">
          <motion.ol
            className="flex flex-col gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={listVariants}
          >
            {HOW_IT_WORKS.steps.map((step) => (
              <motion.li key={step.number} className="flex gap-6" variants={itemVariants}>
                <span className="font-display text-3xl font-semibold text-accent">
                  {step.number}
                </span>
                <div>
                  <h3 className="font-display text-xl font-semibold text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted">{step.description}</p>
                </div>
              </motion.li>
            ))}
          </motion.ol>

          <Reveal className="relative overflow-hidden rounded-3xl bg-ink" delay={0.15}>
            <div className="relative aspect-[4/3] w-full opacity-70">
              <Image
                src={HOW_IT_WORKS.midCta.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/20" />
            </div>
            <div className="absolute inset-0 flex flex-col items-start justify-end p-8">
              <h3 className="font-display text-2xl font-semibold text-white sm:text-3xl">
                {HOW_IT_WORKS.midCta.title}
              </h3>
              <Link
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-accent px-8 py-3.5 text-sm font-medium text-white transition-transform hover:scale-105"
              >
                {HOW_IT_WORKS.midCta.subtitle}
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
