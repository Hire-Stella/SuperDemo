"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

type CountUpStatProps = {
  value: string; // e.g. "4.5K", "30+", "150+", "4.7"
  label: string;
};

function parseValue(value: string) {
  const match = value.match(/^([\d.]+)(.*)$/);
  if (!match) return { number: 0, suffix: value, decimals: 0 };
  const numberStr = match[1];
  const decimals = numberStr.includes(".") ? numberStr.split(".")[1].length : 0;
  return { number: parseFloat(numberStr), suffix: match[2], decimals };
}

export default function CountUpStat({ value, label }: CountUpStatProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState("0");
  const { number, suffix, decimals } = parseValue(value);

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      const id = requestAnimationFrame(() => setDisplay(value));
      return () => cancelAnimationFrame(id);
    }
    const duration = 1200;
    const start = performance.now();
    let raf: number;
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = number * eased;
      setDisplay(current.toFixed(decimals));
      if (progress < 1) raf = requestAnimationFrame(tick);
      else setDisplay(number.toFixed(decimals));
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, number, decimals, reduceMotion, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="text-center"
    >
      <div className="font-display text-4xl text-[var(--fg)] md:text-5xl">
        {display}
        {suffix}
      </div>
      <p className="mt-2 text-sm text-[var(--muted)]">{label}</p>
    </motion.div>
  );
}
