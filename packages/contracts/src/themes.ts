import { z } from 'zod';

/**
 * Per-tenant theming.
 *
 * Every visual token in this app is already a shadcn CSS custom property in
 * `globals.css`, so a tenant theme is nothing more than a set of overrides for
 * those same properties — which is exactly what tweakcn exports. That means a
 * client's brand can be pasted in rather than translated: generate a theme at
 * tweakcn.com, hand over the `:root` / `.dark` blocks, store them as
 * `themeTokens`, done.
 *
 * The presets below are that same shape, written by hand so a new tenant looks
 * deliberate before anyone has opened a design tool. They override the brand and
 * surface tokens and inherit the rest — the state colours (amber for warnings,
 * green for live, purple for AI) are deliberately NOT themeable, because they
 * carry meaning across every centre and an operator moving between two clients
 * should not have to relearn them. One exception, and only because it is forced:
 * a green *brand* would be indistinguishable from the green that means "live",
 * so green presets shift that one state hue. See `greenAware`.
 */

export const ThemePreset = z.enum([
  'default',
  'clinical',
  'hospitality',
  'legal',
  'retail',
  'fitness',
  'grocery',
  'slate',
]);
export type ThemePreset = z.infer<typeof ThemePreset>;

/** A tweakcn-shaped token map: CSS custom properties, minus the leading `--`. */
export const ThemeTokens = z.object({
  light: z.record(z.string(), z.string()),
  dark: z.record(z.string(), z.string()),
});
export type ThemeTokens = z.infer<typeof ThemeTokens>;

export interface ThemeDefinition {
  label: string;
  /** One-line rationale, shown next to the picker. */
  note: string;
  /** The colour shown in the picker's swatch. */
  swatch: string;
  tokens: ThemeTokens;
}

/**
 * Builds a token map from a brand hue.
 *
 * Hand-writing seven full palettes invites drift — one preset ends up with a
 * different border contrast than the rest for no reason. Deriving them from a
 * hue and a chroma keeps every tenant's UI structurally identical and only
 * differently coloured, which is the point: same product, their brand.
 */
function palette(hue: number, chroma: number): ThemeTokens {
  const c = chroma.toFixed(3);
  const tint = (l: number, mult = 0.12) =>
    `oklch(${l} ${(chroma * mult).toFixed(3)} ${hue})`;

  return {
    light: {
      background: tint(0.995, 0.02),
      foreground: `oklch(0.19 ${(chroma * 0.06).toFixed(3)} ${hue})`,
      card: 'oklch(1 0 0)',
      popover: 'oklch(1 0 0)',
      primary: `oklch(0.53 ${c} ${hue})`,
      'primary-foreground': 'oklch(0.99 0 0)',
      secondary: tint(0.972, 0.03),
      'secondary-foreground': `oklch(0.28 ${(chroma * 0.1).toFixed(3)} ${hue})`,
      muted: tint(0.968, 0.025),
      'muted-foreground': `oklch(0.5 ${(chroma * 0.07).toFixed(3)} ${hue})`,
      accent: tint(0.955, 0.1),
      'accent-foreground': `oklch(0.53 ${c} ${hue})`,
      border: tint(0.925, 0.05),
      input: tint(0.925, 0.05),
      ring: `oklch(0.53 ${c} ${hue})`,
    },
    dark: {
      background: `oklch(0.16 ${(chroma * 0.05).toFixed(3)} ${hue})`,
      foreground: tint(0.96, 0.03),
      card: `oklch(0.2 ${(chroma * 0.055).toFixed(3)} ${hue})`,
      popover: `oklch(0.2 ${(chroma * 0.055).toFixed(3)} ${hue})`,
      primary: `oklch(0.7 ${(chroma * 0.9).toFixed(3)} ${hue})`,
      'primary-foreground': `oklch(0.16 ${(chroma * 0.05).toFixed(3)} ${hue})`,
      secondary: `oklch(0.26 ${(chroma * 0.07).toFixed(3)} ${hue})`,
      'secondary-foreground': tint(0.95, 0.03),
      muted: `oklch(0.26 ${(chroma * 0.07).toFixed(3)} ${hue})`,
      'muted-foreground': `oklch(0.68 ${(chroma * 0.06).toFixed(3)} ${hue})`,
      accent: `oklch(0.3 ${(chroma * 0.12).toFixed(3)} ${hue})`,
      'accent-foreground': `oklch(0.7 ${(chroma * 0.9).toFixed(3)} ${hue})`,
      border: `oklch(0.3 ${(chroma * 0.06).toFixed(3)} ${hue})`,
      input: `oklch(0.3 ${(chroma * 0.06).toFixed(3)} ${hue})`,
      ring: `oklch(0.7 ${(chroma * 0.9).toFixed(3)} ${hue})`,
    },
  };
}

export const THEME_PRESETS: Record<ThemePreset, ThemeDefinition> = {
  default: {
    label: 'HireStella red',
    note: 'The platform default. Inherits globals.css untouched.',
    swatch: 'oklch(0.53 0.204 26)',
    // Empty maps: "default" must mean *no overrides at all*, so the base
    // stylesheet stays the single source of truth for it.
    tokens: { light: {}, dark: {} },
  },
  clinical: {
    label: 'Clinical teal',
    note: 'Calm and medical. Reads as care rather than urgency.',
    swatch: 'oklch(0.53 0.11 195)',
    tokens: palette(195, 0.11),
  },
  hospitality: {
    label: 'Hospitality amber',
    note: 'Warm and appetising — restaurants, cafés, hotels.',
    swatch: 'oklch(0.53 0.13 62)',
    tokens: palette(62, 0.13),
  },
  legal: {
    label: 'Professional navy',
    note: 'Sober and institutional. Law, accountancy, consulting.',
    swatch: 'oklch(0.53 0.12 255)',
    tokens: palette(255, 0.12),
  },
  retail: {
    label: 'Retail violet',
    note: 'Bright and commercial, for storefronts and e-commerce.',
    swatch: 'oklch(0.53 0.16 300)',
    tokens: palette(300, 0.16),
  },
  fitness: {
    label: 'Fitness lime',
    note: 'High-energy green. Gyms, studios, sports clubs.',
    swatch: 'oklch(0.53 0.14 145)',
    tokens: greenAware(palette(145, 0.14)),
  },
  grocery: {
    label: 'Fresh green',
    note: 'Deep produce green — groceries, farm shops, anything fresh.',
    swatch: 'oklch(0.5 0.13 150)',
    tokens: greenAware(palette(150, 0.13)),
  },
  slate: {
    label: 'Neutral slate',
    note: 'No brand colour at all — for tenants who want the UI to recede.',
    swatch: 'oklch(0.53 0.02 250)',
    tokens: palette(250, 0.02),
  },
};

/**
 * A green brand collides with a green meaning.
 *
 * `--live` is green (hue 152) and carries "agent available", "on a call", "AI
 * resolved" across every centre. Give a tenant a green *brand* and the two stop
 * being distinguishable — the same objection globals.css raises about a red
 * brand sitting next to red alerts.
 *
 * State colours are otherwise deliberately not themeable, because an operator
 * moving between two clients should not have to relearn them. This is the one
 * justified exception: for a green-branded centre the state green shifts to
 * teal, so "healthy" is still one consistent idea — just not the same hue as
 * the client's logo. Amber and red are untouched.
 */
function greenAware(tokens: ThemeTokens): ThemeTokens {
  return {
    light: { ...tokens.light, live: 'oklch(0.55 0.115 192)', 'live-soft': 'oklch(0.962 0.03 192)' },
    dark: { ...tokens.dark, live: 'oklch(0.73 0.13 192)', 'live-soft': 'oklch(0.29 0.045 192)' },
  };
}

/** The preset a vertical starts on, so onboarding looks considered by default. */
export const DEFAULT_PRESET_FOR_INDUSTRY: Record<string, ThemePreset> = {
  EDUCATION: 'default',
  CLINIC: 'clinical',
  RESTAURANT: 'hospitality',
  PROFESSIONAL: 'legal',
  RETAIL: 'retail',
  FITNESS: 'fitness',
  GENERIC: 'slate',
};

/**
 * The tokens a tenant should actually render with.
 *
 * A pasted tweakcn export wins over the preset — that is the escape hatch for
 * "our brand is this exact hex", and it is why the preset list does not need to
 * grow every time a client has an opinion.
 */
export function resolveThemeTokens(
  preset: ThemePreset | null | undefined,
  custom?: unknown,
): ThemeTokens {
  const parsed = ThemeTokens.safeParse(custom);
  if (parsed.success) return parsed.data;
  return THEME_PRESETS[preset ?? 'default'].tokens;
}

/** Serialises a token map into CSS that overrides globals.css. */
export function themeToCss(tokens: ThemeTokens): string {
  const block = (vars: Record<string, string>) =>
    Object.entries(vars)
      .map(([k, v]) => `--${k}:${v};`)
      .join('');

  const light = block(tokens.light);
  const dark = block(tokens.dark);
  if (!light && !dark) return '';

  // `.dark` is how next-themes marks dark mode in this app, and both selectors
  // match globals.css so specificity ties are broken by document order — this
  // stylesheet is injected after it, so it wins.
  return [light && `:root{${light}}`, dark && `.dark{${dark}}`].filter(Boolean).join('');
}
