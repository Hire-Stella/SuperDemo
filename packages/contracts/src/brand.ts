/**
 * Tenant identity — a name, a tagline, and a logo that is allowed not to exist.
 *
 * The logo is optional on purpose. Spinning up a demo centre should take a name
 * and nothing else, and "upload a logo first" is exactly the friction that stops
 * you creating six of them before a meeting. So every surface that shows a logo
 * asks for one through the same fallback: a monogram built from the centre's own
 * name in its own brand colour. It is deterministic, so the same centre is
 * always the same mark, and it is never empty.
 *
 * The mark is SVG rather than a generated raster because the two places it has
 * to work are a 24px sidebar badge and a 512px favicon, and the colour has to
 * come from the live theme in the first case (`var(--primary)`) and be baked in
 * the second (no CSS variables exist in a favicon).
 */

/** Words that carry no identity, so they never win an initial. */
const NOISE = new Set([
  'the',
  'and',
  'of',
  'for',
  'a',
  'an',
  'llc',
  'ltd',
  'inc',
  'fz',
  'fze',
  'fzc',
  'co',
  'company',
  'group',
  'holding',
  'holdings',
]);

/**
 * The letters for a monogram.
 *
 * Two words give one initial each ("Tamil Mart" → TM). One word gives its first
 * two letters ("Lendi" → LE), because a single letter reads as a placeholder
 * rather than a mark. Noise words are skipped so "The Grocery Company" is GC and
 * not TG.
 */
export function initials(name: string | null | undefined, max = 2): string {
  const words = (name ?? '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const meaningful = words.filter((w) => !NOISE.has(w.toLowerCase()));
  const chosen = meaningful.length > 0 ? meaningful : words;

  if (chosen.length === 0) return '?';
  if (chosen.length === 1) return chosen[0]!.slice(0, max).toUpperCase();
  return chosen
    .slice(0, max)
    .map((w) => w[0]!)
    .join('')
    .toUpperCase();
}

export interface MonogramOptions {
  /**
   * Any CSS colour. Pass `var(--primary)` for an inline SVG inside the app —
   * custom properties resolve normally there — and a literal colour for a
   * favicon or an og:image, where no cascade exists.
   */
  background?: string;
  foreground?: string;
  /** Viewbox is 0 0 64 64, so 14 is roughly the app's `rounded-xl`. */
  radius?: number;
  /** Squared-off mark for favicons, where rounding is the browser's business. */
  square?: boolean;
}

/**
 * A monogram as standalone SVG markup.
 *
 * Two overlaid fills rather than a gradient definition: `<linearGradient>` needs
 * an id, and two of these on one page with the same id is a rendering collision
 * that only shows up in the second one. A translucent white wedge over a flat
 * fill gives the same lift with no shared namespace.
 */
export function monogramSvg(name: string | null | undefined, opts: MonogramOptions = {}): string {
  const {
    background = 'var(--primary)',
    foreground = 'oklch(0.99 0 0)',
    radius = 14,
    square = false,
  } = opts;

  const text = initials(name);
  // Two letters at 26px sit inside 64px comfortably; one wide letter pair like
  // "MW" would overflow, so the text element scales itself down instead.
  const fontSize = text.length > 2 ? 20 : 26;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${escapeXml(name ?? '')}">`,
    `<rect width="64" height="64" rx="${square ? 0 : radius}" fill="${background}"/>`,
    // A soft highlight across the top-left, so the mark reads as an object
    // rather than a coloured square with text on it.
    `<path d="M0 0H64L0 64Z" fill="#fff" opacity="0.11"/>`,
    `<text x="32" y="33" text-anchor="middle" dominant-baseline="central"`,
    ` font-family="system-ui, -apple-system, Segoe UI, sans-serif"`,
    ` font-size="${fontSize}" font-weight="650" letter-spacing="0.5" fill="${foreground}">${escapeXml(text)}</text>`,
    `</svg>`,
  ].join('');
}

/** The same mark as a `data:` URI, for `<link rel="icon">` and og:image. */
export function monogramDataUri(name: string | null | undefined, opts: MonogramOptions = {}): string {
  return `data:image/svg+xml,${encodeURIComponent(monogramSvg(name, opts))}`;
}

/**
 * Whether a logo URL is safe to put in an `<img src>` on a public page.
 *
 * A tenant's logo is operator-supplied text that ends up in HTML we serve to
 * strangers, so the scheme is allowlisted rather than sanitised. `data:` is
 * refused even though an `<img>` will not run script inside an SVG it loads —
 * the rule is easier to keep true than the exception is to keep verified, and a
 * pasted data URI is not a thing anyone needs here.
 *
 * Relative paths are allowed for logos we host ourselves.
 */
export function isSafeLogoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const value = url.trim();
  if (!value) return false;
  // Our own upload paths. `//host` is protocol-relative and would be a remote
  // fetch, so one leading slash only.
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try {
    // http as well as https: demo centres run against localhost, and refusing
    // it would mean the fallback is the only thing anyone ever sees locally.
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

/** Escapes text destined for SVG markup — tenant names are arbitrary input. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
