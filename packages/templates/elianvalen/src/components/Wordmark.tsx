/**
 * The brand wordmark. On the live site the giant lockup sets "LE" in the
 * Inspiration script face while the rest stays Inter SemiBold — that mix is
 * preserved for the display variant, applied here to "UR" in "PURE".
 */
export function Wordmark({
  className = "",
  script = false,
}: {
  className?: string;
  script?: boolean;
}) {
  if (!script) {
    return (
      <span className={`ev-wordmark ${className}`}>
        <span className="sr-only">LIGNE PURE</span>
        <span aria-hidden="true">LIGNE PURE</span>
      </span>
    );
  }

  return (
    <span className={`ev-wordmark ${className}`}>
      <span className="sr-only">LIGNE PURE</span>
      <span aria-hidden="true">
        LIGNE P
        <span className="font-script font-normal">UR</span>E
      </span>
    </span>
  );
}
