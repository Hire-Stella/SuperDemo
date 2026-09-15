import { ArrowDownRight } from "lucide-react";

type CtaArrowBadgeProps = {
  /**
   * Set true when the button it sits on has a DARK background (e.g.
   * bg-[var(--fg)], or a transparent/outline button on a dark video/image
   * backdrop) -- the badge then renders light (white circle, dark icon)
   * for contrast. Leave false for light-background buttons (white, or an
   * outline button on the page's light background) -- the badge then
   * renders dark (brand-color circle, white icon).
   */
  onDark?: boolean;
  className?: string;
};

/**
 * Small circular arrow-icon badge appended to primary/secondary CTA
 * buttons site-wide, matching the live screenshot's down-right diagonal
 * arrow badge at the end of each button.
 */
export default function CtaArrowBadge({ onDark = false, className = "" }: CtaArrowBadgeProps) {
  return (
    <span
      aria-hidden="true"
      className={`ml-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
        onDark ? "bg-white text-[var(--fg)]" : "bg-[var(--fg)] text-white"
      } ${className}`}
    >
      <ArrowDownRight size={14} strokeWidth={2.5} />
    </span>
  );
}
