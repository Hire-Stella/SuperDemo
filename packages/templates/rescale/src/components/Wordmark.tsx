/**
 * Text-based brand wordmark. The original template shipped a hand-traced
 * SVG spelling out its old brand name letter-by-letter, which can't be
 * relabelled — so the mark is rebuilt here as styled text using the same
 * measured gradient (`rs-gradient-text`) and display typeface instead.
 */
export function Wordmark({
  className = "",
  variant = "gradient",
}: {
  className?: string;
  variant?: "gradient" | "mono";
}) {
  return (
    <span
      className={`font-display font-extrabold lowercase tracking-tight ${
        variant === "gradient" ? "rs-gradient-text" : ""
      } ${className}`}
    >
      vectora
    </span>
  );
}
