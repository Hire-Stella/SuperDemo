// lib/data.ts
// Single source of truth for all copy/content on the Tavola landing page.
//
// Ported from a literal Framer HTML/CSS mirror of "Qitchen" — a free Framer
// restaurant template by Gola Templates (Pawel Gola) — already rebranded from
// "Qitchen" to the fictional restaurant name "Tavola" in the source mirror.
// Five source routes (home, menu, about, reservation, licensing) are
// condensed here into the sections this one-page contract renders.

// ---------------------------------------------------------------------------
// Known template fingerprints
// ---------------------------------------------------------------------------

/**
 * Original template credit. The source site's footer reads "© Gola
 * Templates" on every page, and the template itself is distributed from
 * gola.supply / the Framer marketplace under the creator handle "pawel-gola".
 */
export const TEMPLATE_CREDIT = 'Gola Templates';

/**
 * The source's own nav "Socials" row links to the *template author's*
 * personal Instagram/X accounts (instagram.com/gola.design,
 * x.com/gola99) — not the fictional restaurant's. Same situation the
 * momentum port flagged: those are intentionally not reused here. These are
 * bare, unconfigured placeholders for the fictional Tavola brand instead.
 */
export const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/',
  instagram: 'https://www.instagram.com/',
  x: 'https://x.com/',
};

// ---------------------------------------------------------------------------
// Brand / nav
// ---------------------------------------------------------------------------

export const SITE_NAME = 'Tavola';

export const NAV_LINKS = [
  { label: 'Menu', href: '#menu' },
  { label: 'About', href: '#about' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Reservation', href: '#contact' },
];

export const BOOK_LABEL = 'Book a Table';

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

/**
 * The home page's actual hero headline. Rendered in the source as two words,
 * each letter wrapped in its own span for a per-character blur-in reveal
 * ("Sushi" / "Sensation") — recovered by walking that markup rather than a
 * plain text scrape, since a simple text match finds nothing between the
 * per-letter spans. The home page hero carries no separate subhead sentence;
 * the "Sushi Artistry Redefined" tagline lives on the About page instead (see
 * ABOUT below) and is not reused here.
 */
export const HERO = {
  eyebrow: 'Fine Dining',
  titleLines: ['Sushi', 'Sensation'],
  subhead: '',
  primaryCta: { label: BOOK_LABEL, href: '#contact' },
  secondaryCta: { label: 'View Menu', href: '#menu' },
  /** The literal hero background video, self-hosted (2MB — small enough to keep). */
  video: '/t/tavola/video/hero.mp4',
  /**
   * The three quick-link cards laid over/below the hero video on the source
   * home page, each a photo with a circular dark "arrow" badge in its
   * corner — literally `background-color: rgba(24,24,24,.5)`, `border-radius:
   * 500px` (a true pill) and a cream (`rgb(239,231,210)`) icon glyph.
   */
  badges: [
    { label: 'Menu', href: '#menu', image: '/t/tavola/images/hero-badge-menu.webp' },
    {
      label: 'Reservation',
      href: '#contact',
      image: '/t/tavola/images/hero-badge-reservation.webp',
    },
    {
      label: 'Our Restaurant',
      href: '#about',
      image: '/t/tavola/images/hero-badge-restaurant.webp',
    },
  ],
};

// ---------------------------------------------------------------------------
// About / Our Story
// ---------------------------------------------------------------------------

/**
 * The About page's own hero-style card ("Sushi Artistry Redefined" + its
 * subhead) and its "Our Story" paragraph, combined into one About section —
 * both are literal source sentences, just brought together rather than
 * split across a second page. No numeric stats appear anywhere in the
 * source, so none are invented here.
 */
export const ABOUT = {
  eyebrow: 'Our Story',
  heading: 'Sushi Artistry Redefined',
  paragraphs: [
    'Where culinary craftsmanship meets modern elegance. Indulge in the finest sushi, expertly curated to elevate your dining experience.',
    'Founded with a passion for culinary excellence, our journey began in the heart of Prague. Over years, it evolved into a haven for sushi enthusiasts, celebrated for its artful mastery and devotion to redefining gastronomy.',
  ],
  cta: { label: BOOK_LABEL, href: '#contact' },
  image: '/t/tavola/images/about-main.webp',
};

// ---------------------------------------------------------------------------
// Highlights — the three review-platform badges from the About page
// ---------------------------------------------------------------------------

/**
 * Each card in the source is a 5-star row plus two lines of text (platform,
 * then accolade) — "Trip Advisor" / "Best Sushi", and so on. Kept as the
 * literal pairs rather than rewritten into full sentences.
 */
export const HIGHLIGHTS = {
  eyebrow: 'Recognition',
  title: 'Sushi Worth the Trip',
  subhead: '',
  items: [
    { title: 'Trip Advisor', body: 'Best Sushi' },
    { title: 'Michelin Guide', body: 'Quality Food' },
    { title: 'Start Dining', body: 'Cool Vibe' },
  ],
};

// ---------------------------------------------------------------------------
// Menu / Services
// ---------------------------------------------------------------------------

/**
 * The source menu page lists 16 rolls across three categories (Maki $5,
 * Uramaki $12, Special Rolls $16). A curated six — two per category — stand
 * in for the full menu here rather than reproducing all sixteen; names,
 * prices and descriptions below are copied verbatim from the source,
 * including each dish's own literal photo.
 */
export const SERVICES = {
  eyebrow: 'Our Menu',
  title: 'A Taste of the Menu',
  subhead:
    'A curated selection from our maki, uramaki, and special rolls — each plate finished by hand.',
  headerImage: '/t/tavola/images/menu-header.webp',
  items: [
    {
      number: '01',
      name: 'Spicy Tuna Maki',
      price: '$5',
      body: 'A tantalizing blend of spicy tuna, cucumber, and avocado, harmoniously rolled in nori and seasoned rice.',
      image: '/t/tavola/images/dish-spicy-tuna-maki.webp',
    },
    {
      number: '02',
      name: 'Salmon Maki',
      price: '$5',
      body: 'Shiitake mushrooms, avocado, and pickled daikon radish nestle within a roll of seasoned rice, coated with nutty sesame seeds.',
      image: '/t/tavola/images/dish-salmon-maki.webp',
    },
    {
      number: '03',
      name: 'Volcano Delight',
      price: '$12',
      body: 'Creamy crab salad, avocado, and cucumber rolled inside, topped with spicy tuna and drizzled with fiery sriracha sauce.',
      image: '/t/tavola/images/dish-volcano-delight.webp',
    },
    {
      number: '04',
      name: 'Dragon Elegance',
      price: '$12',
      body: 'Grilled eel and avocado nestled within the roll, draped with slices of ripe avocado resembling dragon scales.',
      image: '/t/tavola/images/dish-dragon-elegance.webp',
    },
    {
      number: '05',
      name: 'Truffle Indulgence',
      price: '$16',
      body: 'Decadent slices of black truffle grace a roll of succulent wagyu beef, cucumber, and microgreens, culminating in an exquisite umami symphony.',
      image: '/t/tavola/images/dish-truffle-indulgence.webp',
    },
    {
      number: '06',
      name: 'Eternal Eel',
      price: '$16',
      body: 'An enchanting blend of eel tempura, foie gras, and cucumber, elegantly layered with truffle oil and gold leaf for a touch of opulence.',
      image: '/t/tavola/images/dish-eternal-eel.webp',
    },
  ],
};

// ---------------------------------------------------------------------------
// Gallery — the About page's own photography (hero image + both sliders)
// ---------------------------------------------------------------------------

export const GALLERY = {
  eyebrow: 'Gallery',
  title: 'Inside Tavola',
  subhead: 'A closer look at our kitchen, our plates, and the room where it all comes together.',
  images: [
    { src: '/t/tavola/images/about-main.webp', alt: 'Tavola dining room' },
    { src: '/t/tavola/images/about-gallery-1.webp', alt: 'Tavola plating detail' },
    { src: '/t/tavola/images/about-gallery-2.webp', alt: 'Tavola sushi counter' },
    { src: '/t/tavola/images/about-gallery-3.webp', alt: 'Tavola interior' },
    { src: '/t/tavola/images/about-gallery-4.webp', alt: 'Tavola dish detail' },
    { src: '/t/tavola/images/about-gallery-5.webp', alt: 'Tavola ambience' },
  ],
};

// ---------------------------------------------------------------------------
// Reservation / Contact
// ---------------------------------------------------------------------------

/**
 * Form fields are literal: the source reservation form has exactly Name
 * (text), Email, Phone Number (tel, placeholder "+420 123 456 789" — a
 * Czech-format example, matching the About page's "heart of Prague"),
 * Guests (number, placeholder "1-10"), Date and Time. There is no address,
 * phone number or opening hours stated anywhere in the source — this is a
 * template, not a real restaurant — so those three below are reasonable
 * fictional demo values for the fictional Tavola brand (consistent with
 * how other ported templates give their fictional business a working phone/
 * email), not scraped facts.
 */
export const CONTACT = {
  eyebrow: 'Reservation',
  title: 'Reservation',
  subhead:
    'Secure your spot at our restaurant, where exceptional sushi and a remarkable dining experience await.',
  image: '/t/tavola/images/reservation-hero.webp',
  phone: '+420 222 351 174',
  email: 'reservations@tavola.com',
  address: 'Prague, Czech Republic',
  hours: 'Tuesday – Sunday, 5:00 PM – 11:00 PM',
  /** A reservation-driven business always wants its form on. */
  showForm: true,
  formNote: "We'll confirm your reservation by phone or email shortly after you submit.",
  fields: {
    name: 'Name',
    email: 'Email',
    phone: 'Phone Number',
    phonePlaceholder: '+420 123 456 789',
    guests: 'Guests',
    guestsPlaceholder: '1-10',
    date: 'Date',
    time: 'Time',
    submit: 'Reserve a Table',
  },
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export const FOOTER = {
  tagline:
    'Where culinary craftsmanship meets modern elegance — expertly curated sushi in the heart of Prague.',
  quickLinksTitle: 'Explore',
  quickLinks: NAV_LINKS,
  /** The year is appended at render time (see Footer.tsx), not baked in here. */
  copyright: 'Tavola. All rights reserved.',
};
