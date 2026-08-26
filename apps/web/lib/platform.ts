/**
 * The platform's own name — the product that hosts the contact centres, as
 * distinct from any one of them.
 *
 * Env-overridable rather than a literal: this is the one string that appears
 * above every tenant, so a white-label deployment changes it here and nowhere
 * else. FIT Institute is a tenant like any other and gets its name from its own
 * Organization row, never from this.
 */
export const PLATFORM_NAME = process.env.NEXT_PUBLIC_PLATFORM_NAME ?? 'HireStella';

/** Shown under the product name on the sign-in card. */
export const PLATFORM_TAGLINE =
  process.env.NEXT_PUBLIC_PLATFORM_TAGLINE ?? 'AI contact centre platform';
