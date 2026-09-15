"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { HERO_COLLAGE_IMAGES } from "../defaults";
import { useContent } from "../context";

/**
 * Floating hero photo collage -- confirmed via source CSS: each photo is a
 * circular bubble (border-radius:55px on a 98px box, i.e. functionally a
 * full circle since the radius exceeds half the box size), 6 total,
 * scattered around the hero's corners/edges (2 upper corners, 2 mid-height
 * edges, 2 lower corners). Hidden below lg to avoid crowding the hero on
 * small screens.
 */
export default function HeroCollage() {
  const { HERO_COLLAGE_IMAGES } = useContent();
  return (
    <div className="pointer-events-none absolute inset-0 -z-[5] hidden lg:block" aria-hidden="true">
      {HERO_COLLAGE_IMAGES.map((photo, i) => (
        <motion.div
          key={photo.src}
          className={`absolute h-[90px] w-[90px] overflow-hidden rounded-full shadow-lg ring-2 ring-white ${photo.className}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: [0, -10, 0] }}
          transition={{
            opacity: { duration: 0.6, delay: i * 0.1 },
            y: { duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 },
          }}
        >
          <Image src={photo.src} alt="" fill className="object-cover" sizes="90px" />
        </motion.div>
      ))}
    </div>
  );
}
