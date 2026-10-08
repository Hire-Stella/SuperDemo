// lib/data.ts
// Single source of truth for all copy/content on the Yokai landing page.
//
// Yokai is an ORIGINAL template, not a port of any Framer marketplace
// source. A genuine search of Framer's free restaurant/food category
// (Qitchen → tavola, Pepper → forno, Restaura → aurelia, Mexzo → brasa were
// already claimed by this library's other four templates; the remaining
// free listings found — "Bramble", a retro cocktail bar, and "Patty", a
// generic menu page — were either too thin in real content for this
// contract's sections or too close to tavola's own centred/video hero
// grammar to read as a fifth, genuinely distinct template) turned up
// nothing free, sufficiently different, and content-rich enough to mirror
// literally. This is built from scratch instead, per this project's own
// stated fallback: Google Fonts (Yuji Boku + IBM Plex Sans, see theme.css),
// an original palette, and real stock photography — every image in
// /t/yokai/images/ and /t/yokai/fonts/ was downloaded from Unsplash's free
// tier (images.unsplash.com, never plus.unsplash.com's paid tier) and
// fonts.gstatic.com, then saved into this repo; nothing here hotlinks a
// remote src.
//
// Subtype: a late-night Japanese ramen & izakaya counter — distinct from
// tavola's fine-dining sushi room, forno's pizzeria, aurelia's all-day
// bistro and brasa's taqueria. "Yokai" (妖怪) names the spirits of Japanese
// folklore said to appear at dusk, which is the joke of a noodle bar that
// only gets busy after dark.

// ---------------------------------------------------------------------------
// Brand / nav
// ---------------------------------------------------------------------------

export const SITE_NAME = 'Yokai';

export const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Menu', href: '#menu' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Reviews', href: '#testimonials' },
  { label: 'Contact', href: '#contact' },
];

export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/',
  x: 'https://x.com/',
  tiktok: 'https://www.tiktok.com/',
};

/** Reused everywhere a CTA points at the reservation form — a counter bar reserves "stools", not tables. */
export const RESERVE_LABEL = 'Reserve a Stool';

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

/**
 * This template's own layout grammar: neither tavola's centred text over a
 * full-bleed video, nor forno's/aurelia's clean two-column split both
 * contained in one `max-w-6xl`, nor brasa's rotated photo stack — Yokai's
 * hero is an asymmetric split where the text column stays inside the page
 * gutter and the photo column is a plain, unpadded grid cell in a section
 * with no max-width wrapper of its own, which is all it takes for that
 * cell's edge to land on the true viewport edge (see Hero.tsx). A small
 * second photo (`inset`) overlaps the main one in this template's own "tag"
 * frame (see theme.css's `.yokai-frame`), and a static red seal badge sits
 * opposite it with rising steam as the only motion near it — the spin
 * belongs to brasa's badge, not this one.
 */
export const HERO = {
  eyebrow: 'Open Late — Counter Seats Only',
  titleLines: ['Ramen For The', 'Night Owls'],
  subhead:
    "Eighteen-hour tonkotsu, charcoal yakitori, and a counter that doesn't close when everyone else's kitchen does. Pull up a stool and stay a while.",
  primaryCta: { label: RESERVE_LABEL, href: '#contact' },
  secondaryCta: { label: 'See the Menu', href: '#menu' },
  image: '/t/yokai/images/hero-main.jpg',
  inset: { src: '/t/yokai/images/hero-inset.jpg', alt: 'Tonkotsu ramen at Yokai' },
  seal: { text: 'FRESH BROTH DAILY • FRESH BROTH DAILY • ', label: 'Fresh' },
};

// ---------------------------------------------------------------------------
// About
// ---------------------------------------------------------------------------

export const ABOUT = {
  eyebrow: 'Our Story',
  heading: "Named For What You Can't Quite See",
  paragraphs: [
    'Yokai started as a single counter behind an unmarked door — no sign, no booking line, just a pot of tonkotsu that had been going since the night before. Word got around the way it does after midnight: one stool at a time. We kept the counter, kept the long hours, and kept the broth honest.',
  ],
  cta: { label: 'Meet the Kitchen', href: '#contact' },
  image: '/t/yokai/images/about.jpg',
  quote: {
    text: "Good broth can't be rushed and it can't be hidden behind a special sauce. Eighteen hours, bones, and patience — that's the whole recipe. Everything else on the menu is just what we serve while people wait for a bowl.",
    author: 'Sora Tanaka',
    role: 'Founder & Head Chef',
    image: '/t/yokai/images/founder.jpg',
  },
};

// ---------------------------------------------------------------------------
// Highlights
// ---------------------------------------------------------------------------

export const HIGHLIGHTS = {
  eyebrow: 'Why Yokai',
  title: 'A Counter Built For After Dark',
  subhead: 'Four things that stay true every single night, not just on a good one.',
  items: [
    {
      title: '18-Hour Tonkotsu',
      body: 'Simmered from bone since the night before service.',
      icon: 'soup',
    },
    {
      title: 'Charcoal Yakitori',
      body: 'Grilled to order over binchotan, never a heat lamp.',
      icon: 'flame',
    },
    {
      title: 'Counter Seats Only',
      body: '24 stools, no booths, no bad seat in the house.',
      icon: 'chair',
    },
    {
      title: 'Open Past Midnight',
      body: 'Last order 1am Thursday through Saturday.',
      icon: 'moon',
    },
  ],
};

// ---------------------------------------------------------------------------
// Services — the menu
// ---------------------------------------------------------------------------

export const SERVICES = {
  eyebrow: 'Our Menu',
  title: 'What We Actually Cook',
  subhead: 'Six things we make every night, in the order most people order them.',
  items: [
    {
      number: '01',
      name: 'Tonkotsu Ramen',
      price: '$16',
      body: 'Pork-bone broth simmered eighteen hours, straight noodles, chashu, soft egg.',
      image: '/t/yokai/images/dish-tonkotsu.jpg',
    },
    {
      number: '02',
      name: 'Spicy Miso Ramen',
      price: '$17',
      body: 'Fermented miso broth, chili oil, sweet corn, soft egg, bok choy.',
      image: '/t/yokai/images/dish-spicymiso.jpg',
    },
    {
      number: '03',
      name: 'Yakitori Skewers',
      price: '$12',
      body: 'Chicken thigh over binchotan charcoal, brushed with sweet tare.',
      image: '/t/yokai/images/dish-yakitori.jpg',
    },
    {
      number: '04',
      name: 'Pan-Seared Gyoza',
      price: '$9',
      body: 'Pork and cabbage dumplings, seared crisp, chili vinegar on the side.',
      image: '/t/yokai/images/dish-gyoza.jpg',
    },
    {
      number: '05',
      name: 'Soy-Ginger Karaage',
      price: '$11',
      body: 'Fried chicken thigh, shredded cabbage, kewpie mayo.',
      image: '/t/yokai/images/dish-karaage.jpg',
    },
    {
      number: '06',
      name: 'Yuzu Highball',
      price: '$9',
      body: 'Japanese whisky, soda, fresh yuzu peel — the only thing on ice in the house.',
      image: '/t/yokai/images/dish-highball.jpg',
    },
  ],
};

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------

export const GALLERY = {
  eyebrow: 'Gallery',
  title: 'The Counter, After Dark',
  subhead: 'The alley outside, the stools inside, and everything cooking in between.',
  images: [
    { src: '/t/yokai/images/gallery-1.jpg', alt: 'Lantern-lit alley near Yokai' },
    { src: '/t/yokai/images/gallery-2.jpg', alt: 'Red paper lanterns at night' },
    { src: '/t/yokai/images/gallery-3.jpg', alt: 'Yokai dining room, wood and lanterns' },
    { src: '/t/yokai/images/gallery-4.jpg', alt: 'Guests eating ramen at the counter' },
    { src: '/t/yokai/images/gallery-5.jpg', alt: 'Kitchen counter stacked with bowls' },
    { src: '/t/yokai/images/gallery-6.jpg', alt: 'Chefs behind the noren curtain' },
    { src: '/t/yokai/images/gallery-7.jpg', alt: 'Regulars at the counter, late' },
    { src: '/t/yokai/images/gallery-8.jpg', alt: 'The alley outside Yokai at night' },
  ],
};

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export const STATS = {
  eyebrow: 'By The Numbers',
  title: "It's A Small Room",
  subhead: '',
  items: [
    { value: '18hrs', label: 'Tonkotsu simmer time' },
    { value: '24', label: 'Counter stools, zero booths' },
    { value: '12', label: 'Skewer varieties, grilled to order' },
    { value: '1am', label: 'Last order, Thu–Sat' },
  ],
};

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

export const TESTIMONIALS = {
  eyebrow: 'Reviews',
  title: 'What Regulars Say',
  subhead: '',
  items: [
    {
      quote:
        "Best bowl of tonkotsu I've had outside actual Japan, and the counter never feels rushed even at midnight on a Friday.",
      author: 'Maya Ito',
      role: 'Regular',
      image: '/t/yokai/images/testimonial-1.jpg',
    },
    {
      quote:
        'Yakitori comes off the grill to order, never sitting under a lamp. Worth waiting for a stool.',
      author: 'Devon Marsh',
      role: 'Regular',
      image: '/t/yokai/images/testimonial-2.jpg',
    },
  ],
};

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

export const CONTACT = {
  eyebrow: 'Reservations',
  title: 'Grab A Stool',
  subhead:
    'We hold a few stools by request — everything else is first-come, first-served after dark.',
  phone: '+1 (415) 555-0182',
  email: 'hello@yokai.restaurant',
  address: '118 Ash Alley, San Francisco, CA',
  hours: 'Daily 6pm–1am · Kitchen closes 30 min before close',
  showForm: true,
  formNote: "We'll text or email to confirm — we can't hold a stool past 15 minutes.",
  backgroundImage: '/t/yokai/images/contact-bg.jpg',
  fields: {
    namePlaceholder: 'Jane Ito',
    guestsPlaceholder: '2',
    messagePlaceholder: 'End of the counter, if you have it',
    emailPlaceholder: 'you@example.com',
    phonePlaceholder: '+1 000 000 0000',
    submit: RESERVE_LABEL,
  },
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export const FOOTER = {
  tagline: 'A late-night ramen & yakitori counter — open when the rest of the block closes.',
  quickLinksTitle: 'Explore',
  quickLinks: NAV_LINKS,
  /** The year is appended at render time (see Footer.tsx), not baked in here. */
  copyright: 'Yokai. All rights reserved.',
};
