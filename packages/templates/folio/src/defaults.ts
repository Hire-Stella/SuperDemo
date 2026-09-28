// lib/data.ts
// Single source of truth for all copy/content on the Folio landing page.
//
// Ported from a literal SSR HTML/CSS mirror of "TwoFive" — a free Framer
// template published on the Framer marketplace, described by its own
// listing as "a print poster turned website" for cafés, coffee shops,
// bakeries, brunch spots, bars and food trucks — rebranded here from
// "TwoFive" to the fictional neighborhood café name "Folio". One real
// route (the TwoFive home page) is ported in full; the source's own
// generated 404, Terms and Privacy pages carry no content this contract
// has a section for, so none of them is ported.
//
// Source: https://noble-recipient-269518.framer.app/ (published Framer
// marketplace listing "TWOFIVE - CAFE")

// ---------------------------------------------------------------------------
// Known template fingerprints
// ---------------------------------------------------------------------------

/**
 * The Framer marketplace listing gives no named author for this template —
 * confirmed against the listing page itself, which credits no designer by
 * name the way "Caglan" (kiln's source) or "Flowgen Studio" do elsewhere in
 * the marketplace. Left as the bare template name rather than inventing a
 * credit the listing never gave.
 */
export const TEMPLATE_CREDIT = 'TwoFive (Framer marketplace)';

/**
 * The source footer links to a bare Instagram icon with no visible handle
 * for either the template or the fictional Folio brand — the same
 * unconfigured placeholder situation every other port in this library
 * flags, not a scraped handle.
 */
export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/',
};

// ---------------------------------------------------------------------------
// Brand / nav
// ---------------------------------------------------------------------------

export const SITE_NAME = 'Folio';

/**
 * The source's own literal top nav: two links ("MENU", "DIRECTIONS") plus a
 * bare Instagram glyph, no third link and no CTA button of any kind —
 * confirmed against the source's own SSR HTML, which renders nothing else
 * inside the fixed white header bar.
 */
export const NAV_LINKS = [
  { label: 'Menu', href: '#menu' },
  { label: 'Directions', href: '#contact' },
];

// ---------------------------------------------------------------------------
// Hero — the source's split "Hero" + "Hours Preview White" panel
// ---------------------------------------------------------------------------

/**
 * The source hero is a full-bleed photo (an espresso and a croissant on a
 * sunlit cobalt-blue table, confirmed as the page's one real photographic
 * asset) with one centred two-line headline set directly over it in white —
 * literal copy, kept verbatim. The source draws no button over the photo
 * at all, the same "no CTA in the hero" choice kiln's source made.
 */
export const HERO = {
  eyebrow: '',
  titleLines: ['Your Morning', 'Well Spent'],
  subhead: '',
  primaryCta: null as { label: string; href: string } | null,
  secondaryCta: null as { label: string; href: string } | null,
  image: '/t/folio/images/hero.png',
};

// ---------------------------------------------------------------------------
// About — the source's "Hours Preview White" panel, ported as its own band
// ---------------------------------------------------------------------------

/**
 * In the source, this is a narrow white panel running beside the hero photo
 * rather than a band of its own: a blue "VISIT US" eyebrow, a giant
 * auto-fit "OPENING TIMES" headline (rendered at a literal 212px in the
 * source's own SSR HTML), the full seven-day hours table, and a small
 * two-line caption row underneath it — all recovered verbatim from the
 * source's own markup. Ported here as its own full-width band (this
 * contract renders `about` and `hero` as separate stacked sections, not a
 * split two-column hero) rather than dropped, since it is real, load-bearing
 * content and not decoration.
 *
 * `stats` carries the seven day/hours rows — a legitimate reuse of the
 * schema's value/label pair for a literal hours table rather than a counter,
 * the same way every other value in this file is real ported copy and not a
 * guess.
 */
export const ABOUT = {
  eyebrow: 'Visit Us',
  heading: 'Opening Times',
  paragraphs: [] as string[],
  hours: [
    { label: 'Monday', value: '7:00 — 17:00' },
    { label: 'Tuesday', value: '7:00 — 17:00' },
    { label: 'Wednesday', value: '7:00 — 17:00' },
    { label: 'Thursday', value: '7:00 — 17:00' },
    { label: 'Friday', value: '7:00 — 18:00' },
    { label: 'Saturday', value: '8:00 — 18:00' },
    { label: 'Sunday', value: '8:00 — 15:00' },
  ],
  captions: ['Fresh Roasts Daily', 'Walk-Ins Welcome'],
};

// ---------------------------------------------------------------------------
// Services — "The Menu"
// ---------------------------------------------------------------------------

/**
 * The home page's own two-group menu, copied verbatim: item name and a
 * plain dollar price, no per-item description anywhere in the source's
 * markup — `body` is therefore left blank rather than inventing tasting
 * notes the source never wrote. Groups render stacked (the source's own
 * "Groups" wrapper is a column flex, not a side-by-side grid), each row
 * ruled with the source's own literal row divider.
 */
export const SERVICES = {
  eyebrow: 'Eat & Drink',
  title: 'The Menu',
  subhead: '',
  items: [
    { number: '01', category: 'Coffee', name: 'Espresso', price: '$3.00', body: '' },
    { number: '02', category: 'Coffee', name: 'Cappuccino', price: '$4.00', body: '' },
    { number: '03', category: 'Coffee', name: 'Flat White', price: '$4.50', body: '' },
    { number: '04', category: 'Coffee', name: 'Filter', price: '$3.50', body: '' },
    { number: '05', category: 'Coffee', name: 'Iced Latte', price: '$5.00', body: '' },
    { number: '06', category: 'Pastries', name: 'Croissant', price: '$3.50', body: '' },
    { number: '07', category: 'Pastries', name: 'Banana Bread', price: '$4.00', body: '' },
    { number: '08', category: 'Pastries', name: 'Cinnamon Bun', price: '$4.50', body: '' },
    { number: '09', category: 'Pastries', name: 'Seasonal Cake', price: '$5.00', body: '' },
  ],
};

// ---------------------------------------------------------------------------
// Contact — the source's "Find Us" / "Directions" band
// ---------------------------------------------------------------------------

/**
 * The source has no enquiry form anywhere on the site — its "Find Us" band
 * carries only an address, one transit note, and a "Get Directions" button
 * that opens a Google Maps search for that address. `showForm` is false for
 * the same reason kiln's is: rendering a form would invent one the source
 * never had. The address and transit line below are this port's own
 * fictional stand-ins for the source's real (and specifically real-world)
 * Berlin street address, kept in the source's own two-line address/transit
 * shape rather than its literal text.
 */
export const CONTACT = {
  eyebrow: 'Find Us',
  title: 'Directions',
  subhead: '',
  phone: '',
  email: '',
  address: 'Orchard Row 12 — 4021 Northfield',
  transit: 'Northfield Line · 4 Min Walk',
  hours: '',
  showForm: false,
  formNote: '',
  mapQuery: 'Orchard Row 12, 4021 Northfield',
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

/**
 * The source footer: a giant auto-fit wordmark, a copyright line, a status
 * line ("OPEN EVERY DAY"), and two legal links (Terms, Privacy) that point
 * at the source's own near-empty generated pages — kept here as inert
 * anchors rather than routes, since this contract has nowhere to render a
 * second page.
 */
export const FOOTER = {
  tagline: 'Open Every Day',
  legalLinks: [
    { label: 'Terms', href: '#' },
    { label: 'Privacy', href: '#' },
  ],
  /** The year is appended at render time (see Footer.tsx), not baked in here. */
  copyright: 'Folio. All rights reserved.',
};
