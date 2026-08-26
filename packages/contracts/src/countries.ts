/**
 * Dialling countries.
 *
 * Ordered by who a Gulf contact centre actually rings — the UAE first, then the
 * countries its customers and staff come from — rather than alphabetically. A
 * telecaller picking a country hundreds of times a day should find the common
 * ones without scrolling, and an alphabetical list buries India under Iceland.
 *
 * Not exhaustive, deliberately: this is a picker, not a reference table. A
 * number for a country that is missing can still be typed in full, because the
 * field accepts a complete E.164 string as well as a national one.
 */

export interface DiallingCountry {
  /** ISO 3166-1 alpha-2. Matches PhoneNumber.country. */
  code: string;
  name: string;
  /** Without the plus. */
  dial: string;
  flag: string;
  /** Digits after the country code, for the length hint and validation. */
  nationalDigits: [min: number, max: number];
  /** What someone in that country would type, shown as the placeholder. */
  example: string;
}

export const DIALLING_COUNTRIES: DiallingCountry[] = [
  // ── the Gulf ──────────────────────────────────────────────────────────────
  { code: 'AE', name: 'United Arab Emirates', dial: '971', flag: '🇦🇪', nationalDigits: [8, 9], example: '50 123 4567' },
  { code: 'SA', name: 'Saudi Arabia', dial: '966', flag: '🇸🇦', nationalDigits: [8, 9], example: '50 123 4567' },
  { code: 'OM', name: 'Oman', dial: '968', flag: '🇴🇲', nationalDigits: [8, 8], example: '9123 4567' },
  { code: 'QA', name: 'Qatar', dial: '974', flag: '🇶🇦', nationalDigits: [8, 8], example: '3312 3456' },
  { code: 'KW', name: 'Kuwait', dial: '965', flag: '🇰🇼', nationalDigits: [8, 8], example: '5012 3456' },
  { code: 'BH', name: 'Bahrain', dial: '973', flag: '🇧🇭', nationalDigits: [8, 8], example: '3600 1234' },

  // ── where the customers and staff are from ────────────────────────────────
  { code: 'IN', name: 'India', dial: '91', flag: '🇮🇳', nationalDigits: [10, 10], example: '98765 43210' },
  { code: 'LK', name: 'Sri Lanka', dial: '94', flag: '🇱🇰', nationalDigits: [9, 9], example: '71 234 5678' },
  { code: 'PK', name: 'Pakistan', dial: '92', flag: '🇵🇰', nationalDigits: [10, 10], example: '301 234 5678' },
  { code: 'BD', name: 'Bangladesh', dial: '880', flag: '🇧🇩', nationalDigits: [10, 10], example: '1712 345678' },
  { code: 'NP', name: 'Nepal', dial: '977', flag: '🇳🇵', nationalDigits: [10, 10], example: '984 123 4567' },
  { code: 'PH', name: 'Philippines', dial: '63', flag: '🇵🇭', nationalDigits: [10, 10], example: '917 123 4567' },
  { code: 'ID', name: 'Indonesia', dial: '62', flag: '🇮🇩', nationalDigits: [9, 12], example: '812 345 678' },
  { code: 'EG', name: 'Egypt', dial: '20', flag: '🇪🇬', nationalDigits: [9, 10], example: '100 123 4567' },
  { code: 'JO', name: 'Jordan', dial: '962', flag: '🇯🇴', nationalDigits: [9, 9], example: '79 123 4567' },
  { code: 'LB', name: 'Lebanon', dial: '961', flag: '🇱🇧', nationalDigits: [7, 8], example: '71 123 456' },
  { code: 'SY', name: 'Syria', dial: '963', flag: '🇸🇾', nationalDigits: [9, 9], example: '944 567 890' },
  { code: 'IQ', name: 'Iraq', dial: '964', flag: '🇮🇶', nationalDigits: [10, 10], example: '791 234 5678' },
  { code: 'SD', name: 'Sudan', dial: '249', flag: '🇸🇩', nationalDigits: [9, 9], example: '91 123 4567' },
  { code: 'MA', name: 'Morocco', dial: '212', flag: '🇲🇦', nationalDigits: [9, 9], example: '650 123 456' },
  { code: 'NG', name: 'Nigeria', dial: '234', flag: '🇳🇬', nationalDigits: [10, 10], example: '802 123 4567' },
  { code: 'KE', name: 'Kenya', dial: '254', flag: '🇰🇪', nationalDigits: [9, 9], example: '712 345 678' },
  { code: 'ET', name: 'Ethiopia', dial: '251', flag: '🇪🇹', nationalDigits: [9, 9], example: '911 234 567' },

  // ── the rest of the common ones ───────────────────────────────────────────
  { code: 'GB', name: 'United Kingdom', dial: '44', flag: '🇬🇧', nationalDigits: [9, 10], example: '7400 123456' },
  { code: 'US', name: 'United States', dial: '1', flag: '🇺🇸', nationalDigits: [10, 10], example: '415 555 0123' },
  { code: 'CA', name: 'Canada', dial: '1', flag: '🇨🇦', nationalDigits: [10, 10], example: '416 555 0123' },
  { code: 'AU', name: 'Australia', dial: '61', flag: '🇦🇺', nationalDigits: [9, 9], example: '412 345 678' },
  { code: 'DE', name: 'Germany', dial: '49', flag: '🇩🇪', nationalDigits: [10, 11], example: '151 23456789' },
  { code: 'FR', name: 'France', dial: '33', flag: '🇫🇷', nationalDigits: [9, 9], example: '6 12 34 56 78' },
  { code: 'NL', name: 'Netherlands', dial: '31', flag: '🇳🇱', nationalDigits: [9, 9], example: '6 12345678' },
  { code: 'TR', name: 'Türkiye', dial: '90', flag: '🇹🇷', nationalDigits: [10, 10], example: '532 123 4567' },
  { code: 'RU', name: 'Russia', dial: '7', flag: '🇷🇺', nationalDigits: [10, 10], example: '912 345 6789' },
  { code: 'CN', name: 'China', dial: '86', flag: '🇨🇳', nationalDigits: [11, 11], example: '131 2345 6789' },
  { code: 'SG', name: 'Singapore', dial: '65', flag: '🇸🇬', nationalDigits: [8, 8], example: '8123 4567' },
  { code: 'MY', name: 'Malaysia', dial: '60', flag: '🇲🇾', nationalDigits: [9, 10], example: '12 345 6789' },
  { code: 'ZA', name: 'South Africa', dial: '27', flag: '🇿🇦', nationalDigits: [9, 9], example: '71 234 5678' },
];

/** Default when a centre has no number of its own to infer one from. */
export const DEFAULT_DIALLING_COUNTRY = 'AE';

export function countryByCode(code: string | null | undefined): DiallingCountry {
  return (
    DIALLING_COUNTRIES.find((c) => c.code === code) ??
    DIALLING_COUNTRIES.find((c) => c.code === DEFAULT_DIALLING_COUNTRY)!
  );
}

/**
 * Which country an E.164 number belongs to.
 *
 * Longest dial code first, because +1 would otherwise swallow nothing and +97
 * prefixes overlap: +971 (UAE) and +974 (Qatar) share their first three
 * characters with each other but not with +97 alone. Ambiguous codes like +1
 * resolve to the first entry, which is why the US precedes Canada above — a
 * display-only guess, never used for routing.
 */
export function countryForE164(e164: string | null | undefined): DiallingCountry | null {
  if (!e164?.startsWith('+')) return null;
  const digits = e164.slice(1);
  const sorted = [...DIALLING_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  return sorted.find((c) => digits.startsWith(c.dial)) ?? null;
}

/**
 * Compose a dialable number from a country and whatever was typed.
 *
 * Handles the three things people actually type: a national number, a national
 * number with the trunk zero (050… in the UAE, 098… in India), and a complete
 * international number that should be taken as-is.
 */
export function composeE164(country: DiallingCountry, typed: string): string {
  const cleaned = typed.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;

  // A trunk prefix is for dialling inside the country and is dropped in E.164.
  const national = cleaned.replace(/^0+/, '');
  if (!national) return '';

  // Someone may paste a number that already carries the country code.
  if (national.startsWith(country.dial) && national.length > country.nationalDigits[1]) {
    return `+${national}`;
  }
  return `+${country.dial}${national}`;
}

/** Whether a composed number is plausible for that country. */
export function isPlausibleNumber(country: DiallingCountry, e164: string): boolean {
  if (!/^\+[1-9]\d{6,14}$/.test(e164)) return false;
  const national = e164.slice(1 + country.dial.length);
  const [min, max] = country.nationalDigits;
  // Only length-check when the number really is in the chosen country; a pasted
  // foreign number is still valid E.164 and should not be blocked.
  if (!e164.startsWith(`+${country.dial}`)) return true;
  return national.length >= min && national.length <= max;
}
