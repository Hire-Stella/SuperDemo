"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BOOKING_URL, SERVICES } from "../../defaults";
import { useContent } from "../../context";

export default function Services() {
  const { BOOKING_URL, SERVICES } = useContent();
  return (
    <section id="services" className="bg-cream py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <motion.div
            data-framer-name="Left Wrap"
            className="max-w-2xl"
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-sm uppercase tracking-[0.3em] text-accent">
              {SERVICES.eyebrow}
            </p>
            <h2 className="font-display mt-4 text-4xl font-semibold sm:text-5xl">
              {SERVICES.title}
            </h2>
            <p className="mt-4 text-base text-muted">{SERVICES.subhead}</p>
          </motion.div>
          <Link
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-ink px-8 py-3.5 text-sm font-medium text-white transition-transform hover:scale-105"
          >
            {SERVICES.cta}
          </Link>
        </div>

        <motion.div
          data-framer-name="Service card wrap"
          className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12 } },
          }}
        >
          {SERVICES.programs.map((program) => (
            <motion.div
              key={program.title}
              data-framer-name="Content"
              className="flex flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white"
              variants={{
                hidden: { opacity: 0, x: 100 },
                visible: {
                  opacity: 1,
                  x: 0,
                  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
                },
              }}
            >
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={program.image}
                  alt={program.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-display text-2xl font-semibold text-ink">
                  {program.title}
                </h3>
                <p className="mt-1 text-sm text-muted">{program.subtitle}</p>
                <ul className="mt-5 flex flex-col gap-3">
                  {program.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3 text-sm text-muted">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime text-xs text-ink">
                        ✓
                      </span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
