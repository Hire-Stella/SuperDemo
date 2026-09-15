"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal } from "./Reveal";
import { useSanvera } from "../context";

export default function Services() {
  const { SERVICES, SERVICES_CTA, SERVICES_EYEBROW, SERVICES_GALLERY, BRAND_NAME } = useSanvera();
  const [active, setActive] = useState(0);

  return (
    <section className="bg-pattern bg-[var(--cream)] px-6 py-24 md:px-10">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 md:grid-cols-2">
        <div className="relative h-[420px] sm:h-[520px]">
          <Reveal className="absolute left-0 top-0 h-2/3 w-3/5 overflow-hidden rounded-2xl shadow-xl">
            <Image
              src={SERVICES_GALLERY[0] ?? ""}
              alt={BRAND_NAME}
              fill
              sizes="(max-width: 768px) 60vw, 30vw"
              className="object-cover"
            />
          </Reveal>
          <Reveal delay={0.15} className="absolute bottom-0 left-0 h-1/2 w-2/5 overflow-hidden rounded-2xl shadow-xl">
            <Image
              src={SERVICES_GALLERY[1] ?? ""}
              alt={BRAND_NAME}
              fill
              sizes="(max-width: 768px) 40vw, 20vw"
              className="object-cover"
            />
          </Reveal>
          <Reveal delay={0.25} className="absolute bottom-6 right-0 h-1/2 w-2/5 overflow-hidden rounded-2xl shadow-xl">
            <Image
              src={SERVICES_GALLERY[2] ?? ""}
              alt={BRAND_NAME}
              fill
              sizes="(max-width: 768px) 40vw, 20vw"
              className="object-cover"
            />
          </Reveal>
        </div>

        <div>
          <Reveal>
            <span className="eyebrow-pill">{SERVICES_EYEBROW}</span>
          </Reveal>

          <div className="mt-6 divide-y divide-[var(--maroon)]/15">
            {SERVICES.map((service, i) => {
              const isActive = i === active;
              return (
                <div key={`${service.number}-${i}`} className="py-5">
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <span className="flex items-center gap-4">
                      <span className="text-xs text-[var(--maroon)]/60">{service.number}</span>
                      <span className="font-display text-lg font-bold uppercase text-[var(--maroon)] sm:text-2xl">
                        {service.title}
                      </span>
                    </span>
                    <span className="text-[var(--maroon)]/60">{isActive ? "−" : "+"}</span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isActive && service.description && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="mt-3 max-w-md pl-9 text-sm leading-relaxed text-[var(--maroon)]/75">
                          {service.description}
                        </p>
                        <a href="#faq" className="btn-orange ml-9 mt-4">
                          {SERVICES_CTA}
                          <span className="icon-badge">↗</span>
                        </a>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
