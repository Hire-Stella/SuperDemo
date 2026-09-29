// lib/data.ts
// Single source of truth for all copy/content on the Brasa landing page.
//
// Ported from a literal SSR HTML/CSS mirror of "Mexzo" — a free Framer
// Mexican-restaurant template by Zab Themes, published on the Framer
// marketplace — rebranded here from "Mexzo" to the fictional restaurant name
// "Brasa" (Spanish for "embers" — the literal marigold/chili palette below
// reads as a fire, and a taquería built around a grill wants a name that
// says so). Seven source routes (home, about, menu, gallery, reservation
// ["book-a-table"], contact, news) are condensed into the sections this
// one-page contract renders.

// ---------------------------------------------------------------------------
// Known template fingerprints
// ---------------------------------------------------------------------------

/**
 * Original template credit. The Framer marketplace listing
 * (framer.com/marketplace/templates/mexzo/) credits "Zab Themes" as the
 * creator; the live site itself carries no on-page designer byline beyond
 * Framer's own generic "Made in Framer" badge.
 */
export const TEMPLATE_CREDIT = 'Zab Themes';

/**
 * The source's own footer social row links to bare, unconfigured handles —
 * the same situation every other port in this library flagged: placeholders
 * for the fictional Brasa brand, not scraped handles.
 */
export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/',
  facebook: 'https://www.facebook.com/',
  tiktok: 'https://www.tiktok.com/',
};

// ---------------------------------------------------------------------------
// Brand / nav
// ---------------------------------------------------------------------------

export const SITE_NAME = 'Brasa';

export const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Menu', href: '#menu' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Team', href: '#team' },
  { label: 'Contact', href: '#contact' },
];

/** The source's own literal primary-button text, reused everywhere a CTA books a table. */
export const RESERVE_LABEL = 'Make A Reservation';

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

/**
 * The home page's real hero: a literal repeating promo ribbon ("Taco
 * Tuesday — Buy 1 Get 1 Free", recovered verbatim, shown three times across
 * the source's marquee strip), a headline built from the source's own real
 * subheadline sentence ("Discover the heart of Mexico through dishes made
 * with love") rather than its H1 — which in the source is just the bare
 * wordmark "Mexzo" repeated as the page title, not a written headline — and
 * one body sentence that in the source reads "Experience traditional
 * Mexican dishes crafted love spices.", missing a preposition. Ported here
 * with that one word restored (bracketed nowhere — just fixed) rather than
 * reproduced as a typo, the same kind of small, disclosed cleanup tavola's
 * and forno's own ports made where the source's copy was simply broken.
 *
 * `stack` and `badge` are this template's own fields, with no schema
 * equivalent: the source's real hero art is not one photo but a tilted
 * two-photo stack (its own layers are literally transformed with
 * `rotate(-10deg)`) plus a small circular "Rotating Image" layer — a
 * JS-spun badge in the source's compiled bundle, hand-matched here as a
 * plain CSS `@keyframes` spin (see theme.css's `.brasa-spin`) rather than
 * ported as a bespoke component.
 */
export const HERO = {
  eyebrow: 'Taco Tuesday — Buy 1 Get 1 Free',
  titleLines: ['Discover The Heart', 'Of Mexico'],
  subhead:
    'Experience traditional Mexican dishes crafted with love and spice — from sizzling street tacos to family recipes passed down for generations.',
  primaryCta: { label: RESERVE_LABEL, href: '#contact' },
  secondaryCta: { label: 'View Our Menu', href: '#menu' },
  image: '/t/brasa/images/hero.png',
  stack: [
    { src: '/t/brasa/images/dish-tacos-al-pastor.png', alt: 'Tacos al pastor at Brasa' },
    { src: '/t/brasa/images/dish-quesadillas.png', alt: 'Quesadillas at Brasa' },
  ],
  badge: { text: 'FRESH • DAILY • FRESH • DAILY • ' },
};

// ---------------------------------------------------------------------------
// About — "The Heart Behind Mexzo", rebranded, plus its founder quote
// ---------------------------------------------------------------------------

/**
 * Literal heading and merged body from the about page's "Our Journey" and
 * "What We Believe" bands, plus its featured founder quote — attributed in
 * the source to "Claudia Ramirez, Co-Founder" with her own portrait
 * (recovered from the source's own `data-framer-name="Founder Image"`
 * layer).
 */
export const ABOUT = {
  eyebrow: 'Our Story',
  heading: 'The Heart Behind Brasa',
  paragraphs: [
    "Our journey began with a passion for authentic Mexican flavors and a desire to share them with our community. From day one we've focused on fresh ingredients, traditional recipes, and a warm dining experience — bold, colorful flavors served with real hospitality.",
  ],
  cta: { label: 'Meet Our Chefs', href: '#team' },
  image: '/t/brasa/images/about-hero.png',
  quote: {
    text: 'Our vision has always been to share the authentic flavors of Mexico with the world. From the very beginning we poured our hearts into crafting each dish with tradition, passion, and the finest ingredients.',
    author: 'Claudia Ramirez',
    role: 'Co-Founder',
    image: '/t/brasa/images/founder-claudia.png',
  },
};

// ---------------------------------------------------------------------------
// Highlights — "Discover Bold & Truly Authentic Mexzo"
// ---------------------------------------------------------------------------

export const HIGHLIGHTS = {
  eyebrow: 'Why Brasa',
  title: 'Discover Bold & Truly Authentic Brasa',
  subhead:
    'Every dish is crafted to celebrate the rich heritage and vibrant flavors of Mexico — from sizzling grills to handcrafted salsas.',
  items: [
    {
      title: 'Fresh & Authentic Ingredients',
      body: 'Nothing frozen, nothing shortcut.',
      icon: 'utensils',
    },
    {
      title: 'Family-Friendly Environment',
      body: 'Big tables, bigger portions, everyone welcome.',
      icon: 'users',
    },
    {
      title: 'Cozy Mexican Ambience',
      body: 'Warm colour, low light, a room that feels lived-in.',
      icon: 'home',
    },
    { title: '100% Halal Kitchen', body: 'Every cut, every dish, certified.', icon: 'badge-check' },
  ],
};

// ---------------------------------------------------------------------------
// Services — the home page's "Mexzo Popular Dishes" plus two more from /menu
// ---------------------------------------------------------------------------

/**
 * Six dishes: the home page's own four "Popular Dishes" cards (Quesadillas,
 * Tostadas, Enchiladas, Burritos) plus two more pulled from the fuller
 * /menu page (Tacos al Pastor, Chiles Rellenos) to round out a single-page
 * menu band. Names and photos are the source's own; a few of its literal
 * descriptions were templated copy repeated verbatim across unrelated dishes
 * in the source itself (several /menu items share the exact sentence
 * "wrapped in a warm tortilla with your favorite toppings" regardless of
 * what the dish actually is) — cleaned per-dish here rather than carried
 * over duplicated, the same kind of disclosed fix as HERO's missing
 * preposition above. No prices: the source shows none anywhere.
 */
export const SERVICES = {
  eyebrow: 'Our Menu',
  title: 'Brasa Popular Dishes',
  subhead: 'Street-food staples, cooked the way they are at home.',
  items: [
    {
      number: '01',
      name: 'Quesadillas',
      price: '',
      body: 'Savory tortillas filled with seasoned meats and melted cheese, served with a side.',
      image: '/t/brasa/images/dish-quesadillas.png',
    },
    {
      number: '02',
      name: 'Tostadas',
      price: '',
      body: 'Crispy corn tortillas topped with beans, cheese, and your choice of protein.',
      image: '/t/brasa/images/dish-tostadas.png',
    },
    {
      number: '03',
      name: 'Enchiladas',
      price: '',
      body: 'Corn tortillas filled with savory meats and smothered in a rich chili sauce.',
      image: '/t/brasa/images/dish-enchiladas.png',
    },
    {
      number: '04',
      name: 'Burritos',
      price: '',
      body: 'Marinated steak grilled with bell peppers and onions, wrapped in a warm tortilla.',
      image: '/t/brasa/images/dish-burritos.png',
    },
    {
      number: '05',
      name: 'Tacos al Pastor',
      price: '',
      body: 'Tender spit-grilled pork, pineapple, and cilantro, wrapped in a warm tortilla.',
      image: '/t/brasa/images/dish-tacos-al-pastor.png',
    },
    {
      number: '06',
      name: 'Chiles Rellenos',
      price: '',
      body: 'Stuffed poblano peppers with cheese, served with a bright tomato sauce.',
      image: '/t/brasa/images/dish-chiles-rellenos.png',
    },
  ],
};

// ---------------------------------------------------------------------------
// Steps — the home + about pages' "Experience Our Process"
// ---------------------------------------------------------------------------

export const STEPS = {
  eyebrow: 'How It Works',
  title: 'Experience Our Process',
  subhead: '',
  items: [
    {
      number: '01',
      title: 'Your Favorite Dish',
      body: 'Browse our menu and pick from a variety of freshly prepared dishes made with quality ingredients.',
    },
    {
      number: '02',
      title: 'Place Your Order',
      body: 'Order directly through our website with a smooth, hassle-free checkout.',
    },
    {
      number: '03',
      title: 'Enjoy Your Meal',
      body: 'Sit back and relax while we bring delicious food straight to your table, hot and ready.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------

export const GALLERY = {
  eyebrow: 'Gallery',
  title: 'A Look Inside Brasa',
  subhead: 'The grill, the tables, and the plates in between.',
  images: [
    { src: '/t/brasa/images/gallery-1.png', alt: 'Brasa dining room' },
    { src: '/t/brasa/images/gallery-2.png', alt: 'Brasa plated dish' },
    { src: '/t/brasa/images/gallery-3.png', alt: 'Brasa kitchen at work' },
    { src: '/t/brasa/images/gallery-4.png', alt: 'Guests at Brasa' },
    { src: '/t/brasa/images/gallery-5.png', alt: 'Brasa table setting' },
    { src: '/t/brasa/images/gallery-6.png', alt: 'Brasa bar' },
    { src: '/t/brasa/images/gallery-7.png', alt: 'Brasa plating detail' },
    { src: '/t/brasa/images/gallery-8.png', alt: 'Brasa dining room' },
  ],
};

// ---------------------------------------------------------------------------
// Team — the about page's "Meet Our Master Chef"
// ---------------------------------------------------------------------------

/**
 * Four names and four portraits, both literal — recovered from the about
 * page's own `data-framer-name="Our Chef"` layers. The source's section
 * heading is singular ("Meet Our Master Chef") over four names with no
 * per-person title text underneath any of them, so none is invented here;
 * every chef keeps the same plain "Chef" role instead of four guessed ones.
 */
export const TEAM = {
  eyebrow: 'Our Team',
  title: 'Meet Our Master Chefs',
  subhead: '',
  items: [
    { name: 'Luis Santiago', role: 'Chef', bio: '', image: '/t/brasa/images/team-luis.png' },
    { name: 'Javier Castillo', role: 'Chef', bio: '', image: '/t/brasa/images/team-javier.png' },
    { name: 'Hugo Diaz', role: 'Chef', bio: '', image: '/t/brasa/images/team-hugo.png' },
    { name: 'Remi Solis', role: 'Chef', bio: '', image: '/t/brasa/images/team-remi.png' },
  ],
};

// ---------------------------------------------------------------------------
// Testimonials — the home page's single attributed guest quote
// ---------------------------------------------------------------------------

/**
 * The source carries exactly one named customer quote on its home page
 * (Ethan Miller's); no second or third appears on any of its other routes.
 * Rather than pad the band with invented voices, this port keeps the one
 * the source actually has.
 */
export const TESTIMONIALS = {
  eyebrow: 'Reviews',
  title: 'What Our Guests Say',
  subhead: '',
  items: [
    {
      quote:
        'Dining at this restaurant was an unforgettable experience. Every dish tasted incredibly fresh, full of authentic Mexican flavors and clearly made with genuine care.',
      author: 'Ethan Miller',
      role: '',
    },
  ],
};

// ---------------------------------------------------------------------------
// Contact — the contact page's real details + the "Book Your Table" form
// ---------------------------------------------------------------------------

export const CONTACT = {
  eyebrow: 'Reservations',
  title: 'Book Your Table',
  subhead:
    'Tell us when you are coming and how many chairs to pull up — we will confirm within the hour.',
  phone: '+1 (800) 456-7890',
  email: 'hello@brasa.restaurant',
  address: '123 Fiesta Ave, Los Angeles, CA',
  hours: 'Mon: Closed · Tue–Fri: 11am–10pm · Sat–Sun: 12pm–7pm',
  showForm: true,
  formNote: "We'll confirm your table by phone or email within the hour.",
  backgroundImage: '/t/brasa/images/contact-bg.jpg',
  fields: {
    namePlaceholder: 'Jane Ramirez',
    guestsPlaceholder: '2',
    messagePlaceholder: 'A booth by the window, if you have one',
    emailPlaceholder: 'you@example.com',
    phonePlaceholder: '+1 000 000 0000',
    submit: RESERVE_LABEL,
  },
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export const FOOTER = {
  tagline: 'Fire-grilled Mexican street food, served with real hospitality.',
  quickLinksTitle: 'Explore',
  quickLinks: NAV_LINKS,
  /** The year is appended at render time (see Footer.tsx), not baked in here. */
  copyright: 'Brasa. All rights reserved.',
};
