import { Sparkle } from 'lucide-react';

/**
 * The brand mark — a hand-recreated copy of the source's own diamond-in-
 * circle logo icon (a filled dark badge with a four-pointed diamond cut
 * from its centre), confirmed against the source's own standalone icon
 * asset. The source's wordmark is a raster PNG with "Paywave" baked into
 * the pixels (the same baked-logo situation every sibling template's own
 * port note flags), so only this simple geometric badge is redrawn — as a
 * filled circle behind lucide's own four-point `Sparkle` glyph, close
 * enough to the source's own negative-space diamond that redrawing its
 * exact boolean-cut geometry by hand would add nothing real — and the
 * brand name next to it is set as real text in this port's own display
 * face, so it renders `SITE_NAME` instead of staying fixed to "Paywave".
 */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-fluxo-primary"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Sparkle size={size * 0.56} strokeWidth={0} fill="#ffffff" />
    </span>
  );
}
