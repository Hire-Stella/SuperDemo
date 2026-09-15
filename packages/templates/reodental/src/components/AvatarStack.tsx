"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const AVATARS = [
  "/t/reodental/images/avatar-patient-1.jpg",
  "/t/reodental/images/avatar-patient-2.jpg",
  "/t/reodental/images/avatar-patient-3.jpg",
];

/**
 * Overlapping circular avatar row (source: data-framer-name="Avatar Stack" /
 * "Avatar Frame") with a subtle stagger-in on load.
 */
export default function AvatarStack() {
  return (
    <div className="flex -space-x-3">
      {AVATARS.map((src, i) => (
        <motion.span
          key={src}
          className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-cream bg-cream-soft"
          initial={{ opacity: 0, scale: 0.6, x: -8 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 + i * 0.12, ease: "easeOut" }}
        >
          <Image
            src={src}
            alt=""
            fill
            sizes="36px"
            className="object-cover"
          />
        </motion.span>
      ))}
    </div>
  );
}
