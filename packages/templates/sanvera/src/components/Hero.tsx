"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import StaggerText from "./StaggerText";
import { useSanvera } from "../context";

export default function Hero() {
  const { HERO } = useSanvera();
  return (
    <section
      id="home"
      className="relative h-[820px] overflow-hidden bg-[var(--maroon-deepest)] sm:h-[760px] md:h-[850px]"
    >
      {/* Large, near full-bleed subject photo -- spans almost the entire
          hero height (not boxed into a small centered thumbnail) so it
          reads at the same "zoomed in" scale as the source site. */}
      <motion.div
        initial={{ opacity: 0, scale: 1.06 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-x-0 top-[86px] bottom-0 z-0 flex justify-center sm:top-[92px]"
      >
        <Image
          src={HERO.image}
          alt={`${HERO.giantText} founder meditating`}
          width={900}
          height={1100}
          priority
          className="h-full w-auto object-cover object-top"
        />
      </motion.div>

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 pt-20 md:grid-cols-2 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-display text-3xl font-bold uppercase leading-[1.05] text-[var(--cream)] sm:text-4xl">
            {HERO.headline.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-start gap-6 md:items-end md:text-right"
        >
          <p className="max-w-xs text-sm leading-relaxed text-[var(--cream)]/85">{HERO.subhead}</p>
          <a href="#faq" className="btn-orange">
            {HERO.cta}
            <span className="icon-badge">↗</span>
          </a>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-[64px] z-20 flex justify-center px-4 sm:bottom-[70px]">
        <StaggerText
          text={HERO.giantText}
          className="font-display select-none text-center text-[14vw] font-bold leading-none tracking-tight text-[var(--cream)] sm:text-[11vw] md:text-[120px]"
        />
      </div>
    </section>
  );
}
