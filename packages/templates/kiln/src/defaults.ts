// lib/data.ts
// Single source of truth for all copy/content on the Kiln landing page.
//
// Ported from a literal SSR HTML/CSS mirror of "Drip" — a free Framer
// template by Caglan, published on the Framer marketplace, built for
// third-wave coffee shops and home brewers — rebranded here from "Drip" to
// the fictional specialty coffee bar name "Kiln" (the vessel that roasts the
// bean, not the drip that brews it — the same one-word, monochrome register
// as the source's own name). One real route (the Drip home page) is ported
// in full; a second layout the source calls "Home-v2" and a four-post
// "Ideas" blog exist on the live site but carry no content this contract has
// a section for, so neither is ported.
//
// Source: https://dripcoffe.framer.website/

// ---------------------------------------------------------------------------
// Known template fingerprints
// ---------------------------------------------------------------------------

/** The Framer marketplace listing credits "Caglan" as the template's author. */
export const TEMPLATE_CREDIT = 'Caglan';

/**
 * The source footer links to bare Pinterest and Instagram, with no visible
 * handle for either the template author or the fictional Kiln brand — the
 * same bare, unconfigured placeholder situation every other port in this
 * library flags, not a scraped handle.
 */
export const SOCIAL_LINKS = {
  pinterest: 'https://www.pinterest.com/',
  instagram: 'https://www.instagram.com/',
};

// ---------------------------------------------------------------------------
// Brand / nav
// ---------------------------------------------------------------------------

export const SITE_NAME = 'Kiln';

/**
 * The source's own literal nav — "MENU", "STORY", "BEAN'S" — plus its
 * footer-only "Ideas" blog link, dropped here since this contract has
 * nowhere to put blog posts. "Contact" is added for the address/hours band
 * that the source keeps in its footer rather than its nav.
 */
export const NAV_LINKS = [
  { label: 'Menu', href: '#menu' },
  { label: 'Story', href: '#story' },
  { label: "Bean's", href: '#beans' },
  { label: 'Contact', href: '#contact' },
];

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

/**
 * The source home page's actual hero: one headline, one all-caps prose
 * subhead, one full-bleed photo behind both — and, verbatim from the
 * source's own markup, no button of any kind. Framer stores a layer's
 * original text as its `data-framer-name`; the rendered subhead itself is
 * run through `text-transform: uppercase` and drifts from that name by one
 * typo ("WHETER" for "whether", "YOU ARE" for "you're") — the name is kept
 * here as the real copy, with the same uppercase treatment applied in CSS
 * rather than baked into the string.
 */
export const HERO = {
  eyebrow: '',
  titleLines: ['Where Coffee Meets Craft.'],
  subhead:
    "Our cozy space is designed for connection, creativity, and comfort — whether you're here to savor your favorite brew, meet friends, or simply enjoy a moment of calm.",
  /** Literal: the source hero has no call to action at all. */
  primaryCta: null as { label: string; href: string } | null,
  secondaryCta: null as { label: string; href: string } | null,
  image: '/t/kiln/images/hero.png',
};

// ---------------------------------------------------------------------------
// About — the home page's "Story" band
// ---------------------------------------------------------------------------

/**
 * Literal heading ("Story") and paragraph, copied verbatim, plus the
 * source's own three year markers ('23 / '24 / '25) rendered next to it as a
 * small founding timeline. The source repeats the identical paragraph beside
 * all three years rather than giving each one its own sentence, so this port
 * keeps one paragraph and three bare year chips rather than inventing three
 * distinct milestones the source never wrote.
 */
export const ABOUT = {
  eyebrow: 'Story',
  heading: '',
  paragraphs: [
    'It all started with a passion for coffee and a small corner café. In 2023, we opened our doors with a simple goal: to serve high-quality coffee in a space that felt like home. With just a few tables, a hand-picked espresso machine.',
  ],
  years: ["'23", "'24", "'25"],
  image: '/t/kiln/images/story.png',
};

// ---------------------------------------------------------------------------
// Highlights — the home page's "Bean's" band
// ---------------------------------------------------------------------------

/**
 * The source's single-origin feature — one bean, one tasting note, one
 * photo — kept as a one-item highlight rather than padded out to three, since
 * the source itself only ever names one bean.
 */
export const HIGHLIGHTS = {
  eyebrow: "Bean's",
  title: '',
  subhead: '',
  items: [
    {
      title: 'Ethiopia Yirgacheffe',
      body: 'Bright, floral, and tea-like — Ethiopia Yirgacheffe is known for its delicate notes of jasmine, bergamot, and citrus. Grown at high altitudes in the birthplace of coffee, these beans offer a light and aromatic cup with crisp acidity. Perfect for pour-over or filter lovers who enjoy a refined and elegant profile.',
      icon: 'coffee',
      image: '/t/kiln/images/bean.png',
    },
  ],
};

// ---------------------------------------------------------------------------
// Services — "Menu"
// ---------------------------------------------------------------------------

/**
 * The home page's own three-category menu, copied verbatim: item, calorie
 * count, and a bare number for the price. The source renders every price as
 * a plain digit with no currency symbol anywhere in the markup (confirmed
 * against the page's own SSR HTML) — kept bare here rather than adding a
 * "$" the source never draws. `body` carries the source's own kcal count in
 * its place, since the source gives no per-item description beyond that.
 */
export const SERVICES = {
  eyebrow: 'Menu',
  title: 'Menu',
  subhead: '',
  items: [
    { number: '01', category: 'Coffee', name: 'Flat White', price: '11', body: '104 kcal' },
    { number: '02', category: 'Coffee', name: 'Cold Brew', price: '8', body: '16 kcal' },
    { number: '03', category: 'Coffee', name: 'Long Black', price: '8', body: '12 kcal' },
    { number: '04', category: 'Coffee', name: 'Red Eye', price: '8', body: '8 kcal' },
    { number: '05', category: 'Coffee', name: 'Chai Latte', price: '13', body: '77 kcal' },
    { number: '06', category: 'Brew Lab', name: 'Turmeric', price: '16', body: '34 kcal' },
    { number: '07', category: 'Brew Lab', name: 'Affogato', price: '11', body: '10 kcal' },
    { number: '08', category: 'Brew Lab', name: 'Cortado', price: '11', body: '121 kcal' },
    { number: '09', category: 'Ice Tea', name: 'Lemon', price: '13', body: '44 kcal' },
    { number: '10', category: 'Ice Tea', name: 'Mango', price: '13', body: '32 kcal' },
    { number: '11', category: 'Ice Tea', name: 'Peach', price: '13', body: '41 kcal' },
  ],
};

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------

/**
 * The source's own "Ideas" blog exists purely as four linked article
 * thumbnails with no gallery band of its own on the home page. Rather than
 * porting a blog this contract has no section for, its four photos — plus
 * six more of the source's own real editorial coffee-culture photography
 * used elsewhere across the site's pages — are ported here as a straight
 * photo grid, this port's real, undistorted stand-in for a band the source
 * has no direct equivalent for.
 */
export const GALLERY = {
  eyebrow: 'Gallery',
  title: 'Gallery',
  subhead: '',
  images: [
    { src: '/t/kiln/images/gallery-1.png', alt: 'Coffee and phone in hand on a sunlit street' },
    { src: '/t/kiln/images/gallery-2.png', alt: 'A crowded café terrace at golden hour' },
    { src: '/t/kiln/images/gallery-3.png', alt: 'A sunlit breakfast spread of eggs and toast' },
    { src: '/t/kiln/images/gallery-4.png', alt: 'Croissants and espresso on a marble café table' },
    { src: '/t/kiln/images/gallery-5.png', alt: 'A café storefront with citrus trees at the door' },
    { src: '/t/kiln/images/gallery-6.png', alt: 'An outdoor terrace beneath palm trees at dusk' },
    { src: '/t/kiln/images/gallery-7.png', alt: 'Friends laughing over drinks at a café booth' },
    { src: '/t/kiln/images/gallery-8.png', alt: 'A café terrace lit by string lights' },
    { src: '/t/kiln/images/gallery-9.png', alt: 'A seaside café terrace beneath palm trees' },
    { src: '/t/kiln/images/gallery-10.png', alt: 'A bakery storefront window at street level' },
  ],
};

// ---------------------------------------------------------------------------
// Contact — the source's footer address/hours band
// ---------------------------------------------------------------------------

/**
 * The source has no contact or reservation form anywhere on the site — its
 * footer carries only an address, one set of hours, and the two bare social
 * links kept above. `showForm` is false for the same reason: rendering one
 * would invent a form the source never had.
 */
export const CONTACT = {
  eyebrow: 'Contact',
  title: 'Visit Kiln',
  subhead: '',
  phone: '',
  email: '',
  address: 'Berenstraat 0, 107 GH Berlin',
  hours: 'Everyday · 10:00 – 19:00',
  showForm: false,
  formNote: '',
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export const FOOTER = {
  tagline: 'A Swiss-minimal specialty coffee bar for connection, creativity, and comfort.',
  quickLinksTitle: 'Explore',
  quickLinks: NAV_LINKS,
  /** The year is appended at render time (see Footer.tsx), not baked in here. */
  copyright: 'Kiln. All rights reserved.',
};
