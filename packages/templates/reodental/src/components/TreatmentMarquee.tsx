import { Sparkles, Syringe, Wrench, Smile, Brush, Layers } from "lucide-react";
import type { ComponentType } from "react";

/**
 * Infinite horizontally-scrolling row of treatment chips. The content is
 * duplicated once and the track is animated from translateX(0) to
 * translateX(-50%) on a linear infinite loop, so the seam between the two
 * copies is invisible — a seamless marquee. Pure CSS keyframes (see
 * globals.css) so it never has to fight scroll-jank; disabled entirely
 * under prefers-reduced-motion via a media query in the same stylesheet.
 */
const CHIP_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "Teeth Whitening": Sparkles,
  "Dental Implants": Syringe,
  "Tooth Fillings": Wrench,
  Veneers: Smile,
  "Tartar Removal": Brush,
  "Crowns & Bridges": Layers,
};

export default function TreatmentMarquee({ items }: { items: string[] }) {
  return (
    <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div className="marquee-track flex w-max gap-3">
        {[...items, ...items].map((item, i) => {
          const Icon = CHIP_ICONS[item];
          return (
            <span
              key={`${item}-${i}`}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium tracking-wide text-cream/90 md:text-sm"
            >
              {Icon && <Icon className="h-3.5 w-3.5 text-cream/70" />}
              {item}
            </span>
          );
        })}
      </div>
    </div>
  );
}
