// lib/data.ts
// Single source of truth for all copy/content on the Aurelia landing page.
//
// Ported from a literal SSR HTML/CSS mirror of "Restaura" — a free Framer
// restaurant template by Salim of Webestica, published on the Framer
// marketplace — rebranded here from "Restaura" to the fictional restaurant
// name "Aurelia" (from the Latin "aureus", gold — the source's own literal
// button colour). Eight source routes (home, about-us, menu, menu-list,
// gallery, reservation, contact, legal) are condensed into the sections this
// one-page contract renders.

// ---------------------------------------------------------------------------
// Known template fingerprints
// ---------------------------------------------------------------------------

/**
 * Original template credit. The Framer marketplace listing credits "Salim
 * from Webestica"; the source site's own footer reads "Designed by
 * Webestica, Powered by Framer" on every page.
 */
export const TEMPLATE_CREDIT = 'Salim (Webestica)';

/**
 * The source's own footer social row is icon-only with no visible handles
 * for either the template author or the fictional restaurant. Same situation
 * every other port in this library flagged: these are bare, unconfigured
 * placeholders for the fictional Aurelia brand, not scraped handles.
 */
export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/',
  facebook: 'https://www.facebook.com/',
  x: 'https://x.com/',
};

// ---------------------------------------------------------------------------
// Brand / nav
// ---------------------------------------------------------------------------

export const SITE_NAME = 'Aurelia';

export const NAV_LINKS = [
  { label: 'Menu', href: '#menu' },
  { label: 'About', href: '#about' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Reviews', href: '#testimonials' },
  { label: 'Contact', href: '#contact' },
];

/** The source's own literal nav CTA text, reused everywhere a CTA points at the reservation form. */
export const RESERVE_LABEL = 'Reserve My Table';

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

/**
 * The home page's actual hero: no prose subhead at all — a two-line
 * headline ("Where taste feels like home"), a real 5-star rating badge
 * ("4.7/5.0 Based on 3,576 reviews"), a literal "Scan for menu" chip over
 * the hero photo (the source's QR badge really is a rendered QR-code image,
 * not an icon), and one photo — recovered from the source's own
 * `data-framer-name="Scanner"` / `"BG Image"` layer names. The sentence
 * that reads like a subhead ("At Aurelia, every meal is crafted with
 * care...") is not the hero's — it belongs to the About band directly below
 * it — so it is not duplicated here.
 */
export const HERO = {
  eyebrow: '',
  titleLines: ['Where Taste Feels', 'Like Home'],
  subhead: '',
  primaryCta: { label: RESERVE_LABEL, href: '#contact' },
  secondaryCta: { label: 'View Our Menu', href: '#menu' },
  image: '/t/aurelia/images/hero.jpg',
  /** Literal: `4.7/5.0` / `Based on 3,576 reviews`, from the source's own trust badge. */
  rating: { value: '4.7/5.0', label: 'Based on 3,576 reviews' },
  /** Literal: the source's "Scan for menu" chip really renders a QR-code photo. */
  scan: { label: 'Scan for menu', image: '/t/aurelia/images/hero-scan.jpg' },
};

// ---------------------------------------------------------------------------
// About — the home page's "Where every meal brings people together" band
// ---------------------------------------------------------------------------

/**
 * Literal heading and paragraph from the home page's About band, plus its
 * three inline fact chips ("Menu for every taste" / "Fresh ingredients" /
 * "Experienced chefs") — each a short icon+label pair in the source with no
 * body sentence, kept as such rather than inventing one. The about-us page's
 * own richer "What We Offer You!" triad is kept separate below as
 * `HIGHLIGHTS`, since a single one-page contract has no room to repeat two
 * different three-item bands under the same heading.
 */
export const ABOUT = {
  eyebrow: 'Welcome to Aurelia',
  heading: 'Where Every Meal Brings People Together',
  paragraphs: [
    'At Aurelia, every meal is crafted with care. Inspired by tradition and backed by 11 years of experience, we bring people together through great food and warm hospitality.',
  ],
  cta: { label: 'More About Us', href: '#team' },
  image: '/t/aurelia/images/about-hero.jpg',
  chips: [
    { label: 'Menu for every taste', icon: 'utensils' },
    { label: 'Fresh ingredients', icon: 'leaf' },
    { label: 'Experienced chefs', icon: 'chef-hat' },
  ],
};

// ---------------------------------------------------------------------------
// Highlights — the about-us page's "What We Offer You!" triad
// ---------------------------------------------------------------------------

export const HIGHLIGHTS = {
  eyebrow: 'What We Offer You',
  title: 'A Kitchen Worth Gathering Around',
  subhead: '',
  items: [
    {
      title: "Chef's Special Creations",
      body: 'Experience harmonious flavors that leave a lasting impression on every palate.',
      icon: 'chef-hat',
    },
    {
      title: 'Fresh Juice',
      body: 'Revitalize with our refreshing fresh juices, crafted with pure, vibrant flavors.',
      icon: 'cup-soda',
    },
    {
      title: 'Artisanal Desserts',
      body: 'End on a sweet note with our artisanal desserts — each a masterpiece.',
      icon: 'cake-slice',
    },
  ],
};

// ---------------------------------------------------------------------------
// Services — "Our Signature Delights"
// ---------------------------------------------------------------------------

/**
 * The home page's own six-category menu preview (Breakfast, Beverage, Lunch,
 * Dessert, Dinner, Brunch — one dish each), the literal all-day span that
 * makes this an all-day bistro rather than a single-service restaurant.
 * Names, categories, descriptions and prices are copied verbatim, including
 * each dish's own literal photo. Several items carry the source's own literal
 * "compare at" price (a crossed-out higher figure beside the real one) —
 * kept as `comparePrice`, a field tavola's and forno's sources had no
 * equivalent for.
 */
export const SERVICES = {
  eyebrow: 'Our Signature Delights',
  title: 'A Menu for Every Hour',
  subhead: 'From the first coffee to the last course — every dish crafted with care.',
  items: [
    {
      number: '01',
      category: 'Breakfast',
      name: 'Eggs Benedict',
      price: '$45.00',
      comparePrice: '$85.00',
      body: 'Poached eggs, Canadian bacon, English muffin, and hollandaise sauce.',
      image: '/t/aurelia/images/dish-eggs-benedict.jpg',
    },
    {
      number: '02',
      category: 'Beverage',
      name: 'Brewed Coffee',
      price: '$125.00',
      comparePrice: '',
      body: 'Coffee beans, filtered water, fresh milk or cream, and a touch of sugar.',
      image: '/t/aurelia/images/dish-brewed-coffee.jpg',
    },
    {
      number: '03',
      category: 'Lunch',
      name: 'Fish Tacos',
      price: '$67.39',
      comparePrice: '',
      body: 'White fish fillets, corn or flour tortillas, cabbage slaw, avocado, lime, and cilantro.',
      image: '/t/aurelia/images/dish-fish-tacos.jpg',
    },
    {
      number: '04',
      category: 'Dessert',
      name: 'Lemon Tart',
      price: '$98.50',
      comparePrice: '',
      body: 'Lemon juice and zest, sugar, eggs, heavy cream, all-purpose flour, and unsalted butter.',
      image: '/t/aurelia/images/dish-lemon-tart.jpg',
    },
    {
      number: '05',
      category: 'Dinner',
      name: 'Shrimp Scampi',
      price: '$79.00',
      comparePrice: '',
      body: 'Shrimp, olive oil, butter, garlic, lemon juice, parsley, red pepper flakes, spaghetti.',
      image: '/t/aurelia/images/dish-shrimp-scampi.jpg',
    },
    {
      number: '06',
      category: 'Brunch',
      name: 'Salmon Bagels',
      price: '$59.99',
      comparePrice: '$80.55',
      body: 'Bagels, cream cheese, smoked salmon, capers, red onion, fresh dill, lemon wedges.',
      image: '/t/aurelia/images/dish-salmon-bagels.jpg',
    },
  ],
};

// ---------------------------------------------------------------------------
// Gallery — "The Flavor Gallery"
// ---------------------------------------------------------------------------

export const GALLERY = {
  eyebrow: 'Gallery',
  title: 'The Flavor Gallery',
  subhead: 'A closer look at our tables, our plates, and the nights in between.',
  images: [
    { src: '/t/aurelia/images/gallery-1.jpg', alt: 'Aurelia table setting by candlelight' },
    { src: '/t/aurelia/images/gallery-2.jpg', alt: 'Aurelia shared plate' },
    { src: '/t/aurelia/images/gallery-3.jpg', alt: 'Aurelia dining room' },
    { src: '/t/aurelia/images/gallery-4.jpg', alt: 'Guests at Aurelia' },
    { src: '/t/aurelia/images/gallery-5.jpg', alt: 'Aurelia plating detail' },
    { src: '/t/aurelia/images/gallery-6.jpg', alt: 'Aurelia dining room' },
    { src: '/t/aurelia/images/gallery-7.jpg', alt: 'Aurelia table detail' },
    { src: '/t/aurelia/images/gallery-8.jpg', alt: 'Guests at Aurelia' },
  ],
};

// ---------------------------------------------------------------------------
// Stats — the about-us page's animated counter band
// ---------------------------------------------------------------------------

/**
 * The about-us page's four-counter band literally exists in the source, but
 * as a JS-only odometer: the server-rendered HTML starts every digit at `0`
 * and a code component animates it up to its real target client-side, so
 * the target number itself is never present in the static markup — the
 * exact situation this library's "hand-match a JS-only component" allowance
 * is for. The four labels below ("Visitors daily", "Positive feedback",
 * "Awards & Honors", "Year of Experience") are copied verbatim; only
 * "Years of experience" has a literal figure behind it (the page's own
 * prose repeats "11 years of experience" twice), so it reads `11+`. The
 * other three digits are reasonable round numbers for a bistro this size,
 * not a recovered scrape.
 */
export const STATS = {
  eyebrow: 'By the Numbers',
  title: 'Eleven Years at the Table',
  subhead: '',
  image: '/t/aurelia/images/stats-bg.jpg',
  items: [
    { value: '11+', label: 'Years of experience' },
    { value: '250+', label: 'Visitors daily' },
    { value: '98%', label: 'Positive feedback' },
    { value: '24', label: 'Awards & honors' },
  ],
};

// ---------------------------------------------------------------------------
// Team — "Our Chefs"
// ---------------------------------------------------------------------------

export const TEAM = {
  eyebrow: 'Our Team',
  title: 'The People Behind the Table',
  subhead: '',
  items: [
    {
      name: 'Miguel Torres',
      role: 'Rising Star Chef',
      bio: '',
      image: '/t/aurelia/images/team-miguel.jpg',
    },
    {
      name: 'Sophia Reyes',
      role: 'CEO of Aurelia',
      bio: '',
      image: '/t/aurelia/images/team-sophia.jpg',
    },
    {
      name: 'Jackson Carter',
      role: 'Pantry Chef',
      bio: '',
      image: '/t/aurelia/images/team-jackson.jpg',
    },
  ],
};

// ---------------------------------------------------------------------------
// Testimonials — "Pizza Perfection..." equivalent: three attributed quotes
// ---------------------------------------------------------------------------

/**
 * The source's own quote band is a JS slideshow (`framer-slideshow-component`
 * in its compiled bundle, the same code component forno's testimonials
 * found), with no per-quote photo in the static markup — hand-matched here
 * as a plain stacked list rather than porting a bespoke carousel.
 */
export const TESTIMONIALS = {
  eyebrow: 'Reviews',
  title: 'What Our Guests Say',
  subhead: '',
  items: [
    {
      quote:
        'Every staff member made us feel like royalty, attending to our every need with a smile.',
      author: 'Jacqueline Miller',
      role: 'Local foodie',
    },
    {
      quote:
        'Impeccable service, sophisticated ambiance, and a menu crafted with the finest ingredients await to elevate your dining experience.',
      author: 'Joan Wallace',
      role: 'Fine-dining regular',
    },
    {
      quote:
        "From breakfast classics to hearty dinners, our diverse menu ensures there's something for every member of the family.",
      author: 'Billy Vasquez',
      role: 'Family diner',
    },
  ],
};

// ---------------------------------------------------------------------------
// Contact — the "Hello Aurelia, my name is..." sentence-style reservation form
// ---------------------------------------------------------------------------

/**
 * The source's home-page reservation band is not a plain labelled form —
 * it is one flowing sentence with inline blanks, recovered verbatim from
 * the page's own text nodes: "Hello Restaura, my name is ___. I would like
 * to reserve a table for ___ on ___ & ___. Here's my brief: ___. Please
 * confirm my reservation at ___ or at ___." Neither tavola's plain
 * multi-field form nor forno's plain enquiry form has an equivalent — this
 * is the first template in the library built around it, and it is worth
 * keeping exactly as odd and specific as the source made it.
 */
export const CONTACT = {
  eyebrow: 'Reservation',
  title: 'Reserve Your Table',
  subhead:
    'Book your table in advance and enjoy a relaxed dining experience with fresh flavors, warm service, and a welcoming atmosphere.',
  phone: '+1 (202) 555 0147',
  email: 'hello@aurelia.restaurant',
  address: '1238 Echo Ridge Blvd, San Francisco, CA 94103',
  hours: 'Mon–Sat 11:00am–10:00pm · Sun 10:00am–12:00pm',
  showForm: true,
  formNote: 'A confirmation message will be sent once your table is secured.',
  sentence: {
    hello: 'Hello Aurelia, my name is',
    reserve: 'I would like to reserve a table for',
    guestsUnit: 'guests on',
    and: '&',
    brief: "Here's my brief:",
    confirm: 'Please confirm my reservation at',
    or: 'or at',
  },
  fields: {
    namePlaceholder: 'Jane Smith',
    guestsPlaceholder: '2',
    messagePlaceholder: 'a window table, if you have one',
    emailPlaceholder: 'you@example.com',
    phonePlaceholder: '+1 000 000 0000',
    submit: RESERVE_LABEL,
  },
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export const FOOTER = {
  tagline:
    'A warm, jewel-toned bistro serving breakfast through dinner — crafted with care, served with hospitality.',
  quickLinksTitle: 'Explore',
  quickLinks: NAV_LINKS,
  /** The year is appended at render time (see Footer.tsx), not baked in here. */
  copyright: 'Aurelia. All rights reserved.',
};
