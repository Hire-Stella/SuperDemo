import Reveal from "../components/Reveal";

/**
 * The eyebrow + 44px heading + muted subcopy stack that opens nearly
 * every section. The eyebrow is a 13px label preceded by a small square
 * marker, matching the live treatment.
 */
export default function SectionHeading({
  eyebrow,
  heading,
  subcopy,
  align = "center",
  className = "",
}: {
  eyebrow?: string;
  heading: string;
  subcopy?: string;
  align?: "center" | "left";
  className?: string;
}) {
  const centered = align === "center";

  return (
    <div
      className={`flex flex-col gap-3 ${centered ? "items-center text-center" : "items-start text-left"} ${className}`}
    >
      {eyebrow && (
        <Reveal className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block size-[5px]"
            style={{ background: "var(--sg-marker)" }}
          />
          <span className="text-[13px] text-[var(--sg-text-label)]">{eyebrow}</span>
        </Reveal>
      )}

      <Reveal as="h2" delay={60} className="sg-h2 max-w-[20ch]">
        {heading}
      </Reveal>

      {subcopy && (
        <Reveal
          as="p"
          delay={120}
          className={`sg-body max-w-[62ch] ${centered ? "" : "max-w-[70ch]"}`}
        >
          {subcopy}
        </Reveal>
      )}
    </div>
  );
}
