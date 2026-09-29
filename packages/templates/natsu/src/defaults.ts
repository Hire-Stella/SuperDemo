// lib/data.ts
// Single source of truth for all copy/content on the Natsu landing page.
//
// Ported from a literal SSR HTML/CSS mirror of "Ferea" — a free Framer
// coffee-shop template published on the Framer marketplace — already
// rebranded in the source mirror this was ported from to the fictional
// coffee-shop name "Natsucafe". Renamed again here to "Natsu" ("summer" in
// Japanese — the source's own yuzu ade, matcha and peach tea already lean
// that direction) to match this library's own one-word naming convention
// (Aurelia, Brasa, Forno, Tavola, Yokai). Eleven source routes (home, about,
// menu, blog index + 4 posts, contact, license, changelog) are condensed
// into the sections this one-page contract renders — the blog, license and
// changelog routes have no equivalent section in the shared contract and
// are dropped rather than forced into one.

// ---------------------------------------------------------------------------
// Known template fingerprints
// ---------------------------------------------------------------------------

/**
 * The Framer marketplace does not attribute "Ferea" to a named designer on
 * its own listing page, and the live site itself carries no on-page
 * designer byline beyond Framer's own generic "Made in Framer" badge — so,
 * unlike sibling ports that recovered a real name, this one has none to
 * carry over.
 */
export const TEMPLATE_CREDIT = 'Framer';

/**
 * The source's own footer social row links to bare, unconfigured handles —
 * the same situation every other port in this library flagged: placeholders
 * for the fictional Natsu brand, not scraped handles.
 */
export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/',
  facebook: 'https://www.facebook.com/',
  tiktok: 'https://www.tiktok.com/',
};

// ---------------------------------------------------------------------------
// Brand / nav
// ---------------------------------------------------------------------------

export const SITE_NAME = 'Natsu';

/**
 * The source's real main nav has exactly two links — `./about` and
 * `./menu` — recovered from its own `data-framer-name="Nav"` container.
 * `Gallery` and `Contact` are added here only because condensing eleven
 * routes into one scrolling page needs some way to reach the bands that
 * used to be separate pages; nothing is invented beyond that.
 */
export const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Menu', href: '#menu' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Contact', href: '#contact' },
];

/** The source's own literal button text, reused everywhere a CTA points at ordering. */
export const ORDER_LABEL = 'Order Now';

// ---------------------------------------------------------------------------
// Hero — the home page's "Freshly Brewed" band
// ---------------------------------------------------------------------------

export const HERO = {
  eyebrow: 'Our Story',
  titleLines: ['Freshly', 'Brewed'],
  subhead:
    'Specialty coffee, and drinks made to brighten every day. Find your nearest café and enjoy warm hospitality, seasonal drinks.',
  primaryCta: { label: ORDER_LABEL, href: '#menu' },
  secondaryCta: { label: 'About Us', href: '#about' },
  image: '/t/natsu/images/hero.png',
};

// ---------------------------------------------------------------------------
// About — the about page's "The Story Behind Natsucafe"
// ---------------------------------------------------------------------------

export const ABOUT = {
  eyebrow: 'Our Story',
  heading: 'The Story Behind Natsu',
  paragraphs: [
    'Natsu was created around a simple idea: great coffee, thoughtful details, and a welcoming place can make everyday moments feel a little more special.',
  ],
  cta: { label: 'See Our Menu', href: '#menu' },
  image: '/t/natsu/images/about.png',
};

// ---------------------------------------------------------------------------
// Highlights — the home + about pages' "More Than Coffee" feature cards
// ---------------------------------------------------------------------------

/**
 * Three cards, present near-verbatim on both the home and about pages
 * (the about page's own copy differs by a few words — "Brewed with care,
 * always." rather than home's "Brewed with intention" — this port keeps
 * home's phrasing, the version that pairs each card with its own short
 * caption chip).
 */
export const HIGHLIGHTS = {
  eyebrow: 'Why Choose Us',
  title: 'More Than Coffee Is A Daily Ritual',
  subhead: '',
  items: [
    {
      title: 'Freshness In Every Bite',
      body: 'From seasonal drinks to freshly baked treats, everything is prepared with fresh ingredients to make taste better.',
      icon: 'sparkles',
    },
    {
      title: 'Brewed With Intention',
      body: 'We carefully select quality beans and craft each cup to bring out its unique character, flavor, and aroma.',
      icon: 'coffee',
    },
    {
      title: 'More Than A Coffee Stop',
      body: "A warm space, thoughtful service, and good coffee come together to create a place you'll always want to return to.",
      icon: 'heart',
    },
  ],
};

// ---------------------------------------------------------------------------
// Services — the menu page's full drink & pastry list
// ---------------------------------------------------------------------------

/**
 * Fourteen items across the menu page's own six categories (Espresso,
 * Brewed Coffee, Matcha, Non-Cafein, Pastries), names and both real prices
 * (small size / large size) recovered verbatim from its price cards. Each
 * item's `body` is a short, plain description of the drink itself — the
 * source's menu cards carry a name and two prices only, no description
 * text anywhere, so these are written here rather than scraped (disclosed,
 * not invented brand claims). One item's own name in the source is the
 * single bare word "COFFEE" with no product name filled in behind it — a
 * genuine content gap in the source template itself, not a scraping miss —
 * named "Macchiato" here to fill an Espresso-category slot no other item
 * already covers.
 */
export const SERVICES = {
  eyebrow: 'Our Menu',
  title: 'The Taste Of Drinks',
  subhead:
    'A cup for every kind of coffee mood, from a bright espresso to a slow afternoon matcha.',
  items: [
    {
      number: '01',
      name: 'Flat White',
      price: '$4.50 / $5.50',
      body: 'Espresso rounded out with steamed milk and a thin layer of velvety microfoam.',
      image: '/t/natsu/images/menu-flat-white.png',
    },
    {
      number: '02',
      name: 'Mocha',
      price: '$5.00 / $6.50',
      body: 'Espresso and steamed milk with rich chocolate, finished with a dusting of cocoa.',
      image: '/t/natsu/images/menu-mocha.png',
    },
    {
      number: '03',
      name: 'Latte',
      price: '$5.25 / $7.25',
      body: 'A classic pour of espresso and silky steamed milk, light on foam.',
      image: '/t/natsu/images/menu-latte.png',
    },
    {
      number: '04',
      name: 'Cappuccino',
      price: '$5.75 / $8.25',
      body: 'Equal parts espresso, steamed milk, and airy foam for a lighter, bolder cup.',
      image: '/t/natsu/images/menu-cappuccino.png',
    },
    {
      number: '05',
      name: 'Americano',
      price: '$4.25 / $6.25',
      body: 'Espresso lengthened with hot water for a lighter body and a cleaner finish.',
      image: '/t/natsu/images/menu-americano.png',
    },
    {
      number: '06',
      name: 'Macchiato',
      price: '$4.75 / $7.00',
      body: 'A short shot of espresso "stained" with just a spoon of foamed milk.',
      image: '/t/natsu/images/menu-macchiato.png',
    },
    {
      number: '07',
      name: 'Affogato',
      price: '$5.25 / $7.25',
      body: 'A scoop of vanilla drowned in a hot shot of espresso, coffee and dessert in one.',
      image: '/t/natsu/images/menu-affogato.png',
    },
    {
      number: '08',
      name: 'Cold Brew',
      price: '$5.00 / $8.00',
      body: 'Steeped slow and cold for hours, smoother and less acidic than a hot brew.',
      image: '/t/natsu/images/menu-cold-brew.png',
    },
    {
      number: '09',
      name: 'Iced Coffee',
      price: '$5.50 / $7.00',
      body: 'Freshly brewed coffee chilled and poured straight over ice.',
      image: '/t/natsu/images/menu-iced-coffee.png',
    },
    {
      number: '10',
      name: 'Matcha Latte',
      price: '$4.75 / $6.75',
      body: 'Stone-ground green tea whisked with steamed milk for a smooth, earthy cup.',
      image: '/t/natsu/images/menu-matcha-latte.png',
    },
    {
      number: '11',
      name: 'Yuzu Ade',
      price: '$5.50 / $7.50',
      body: 'A bright, citrusy yuzu cooler over ice — tart, sweet, and refreshing.',
      image: '/t/natsu/images/menu-yuzu-ade.png',
    },
    {
      number: '12',
      name: 'Peach Tea',
      price: '$5.75 / $7.75',
      body: 'Black tea steeped with real peach for a fragrant, lightly sweet iced tea.',
      image: '/t/natsu/images/menu-peach-tea.png',
    },
    {
      number: '13',
      name: 'Chocolate Croissant',
      price: '$5.00 / $6.50',
      body: 'A buttery, flaky croissant laminated around a rich dark chocolate core.',
      image: '/t/natsu/images/menu-chocolate-croissant.png',
    },
    {
      number: '14',
      name: 'Berries Croissant',
      price: '$4.50 / $6.00',
      body: 'A buttery croissant filled with a bright, not-too-sweet mixed berry compote.',
      image: '/t/natsu/images/menu-berries-croissant.png',
    },
  ],
};

// ---------------------------------------------------------------------------
// Steps — the about page's "How It Started" timeline
// ---------------------------------------------------------------------------

/**
 * The about page's own three-point founding timeline, recovered verbatim
 * and reordered chronologically (2016, 2022, 2026 — the source's own DOM
 * order is not chronological). No sibling template's source had an
 * equivalent, which is why `steps` is new to this template's own
 * `SUPPORTS`.
 */
export const STEPS = {
  eyebrow: 'Our Story',
  title: 'How It Started',
  subhead: '',
  items: [
    {
      number: '2016',
      title: 'Natsu Was Founded',
      body: 'We started with a simple belief: great coffee could make ordinary moments feel a little more special.',
    },
    {
      number: '2022',
      title: 'A Place To Gather',
      body: 'Natsu grew into a welcoming space where quality coffee, fresh flavors, and good company come together every day.',
    },
    {
      number: '2026',
      title: 'Still Growing',
      body: 'Today, Natsu continues to create thoughtful coffee experiences, bringing people together.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Stats — the about page's "Numbers Behind The Cup" counter band
// ---------------------------------------------------------------------------

/**
 * The source's own counter band animates each number up from 0 with pure
 * JS (a Framer code component) — its compiled markup carries the four
 * captions below but never the target number itself anywhere in static
 * HTML, only the `0` a counter starts from. The four values here are
 * hand-matched to real counts elsewhere on this same site (14 menu items,
 * 6 menu categories) or a plain, modest round number — not scraped, since
 * nothing to scrape survives in the static markup.
 */
export const STATS = {
  eyebrow: 'Numbers',
  title: 'Behind The Cup',
  subhead: '',
  items: [
    { value: '12+', label: 'Carefully selected beans, thoughtfully brewed for every cup.' },
    {
      value: '6',
      label: 'Fresh drinks thoughtfully crafted to keep every season feeling exciting.',
    },
    { value: '14+', label: 'Coffee creations crafted for every kind of coffee mood and moment.' },
    { value: '10K+', label: 'Little moments worth making better with a warm cup of coffee.' },
  ],
};

// ---------------------------------------------------------------------------
// Gallery — the home page's six-photo collage
// ---------------------------------------------------------------------------

export const GALLERY = {
  eyebrow: 'Our Place',
  title: 'Every Cup Tells A Story',
  subhead: 'Of care, craft, and good coffee.',
  images: [
    { src: '/t/natsu/images/gallery-1.png', alt: 'Natsu coffee and pastry' },
    { src: '/t/natsu/images/gallery-2.png', alt: 'Natsu drink close-up' },
    { src: '/t/natsu/images/gallery-3.png', alt: 'Natsu café interior' },
    { src: '/t/natsu/images/gallery-4.png', alt: 'Natsu coffee being poured' },
    { src: '/t/natsu/images/gallery-5.png', alt: 'Natsu seasonal drink' },
    { src: '/t/natsu/images/gallery-6.png', alt: 'Natsu counter and beans' },
  ],
};

// ---------------------------------------------------------------------------
// Team — the about page's "The Crew Behind The Coffee"
// ---------------------------------------------------------------------------

/**
 * The source names exactly one person across the whole site — recovered
 * from the about page's own `data-framer-name` layers next to its "Head
 * Barista" title and portrait. Rather than pad a roster out to match a
 * sibling template's larger cast, this port keeps the one credit the
 * source actually gives.
 */
export const TEAM = {
  eyebrow: 'Our Team',
  title: 'The Crew Behind The Coffee',
  subhead: '',
  items: [
    { name: 'Noah Bennett', role: 'Head Barista', bio: '', image: '/t/natsu/images/team-noah.png' },
  ],
};

// ---------------------------------------------------------------------------
// Testimonials — the home page's three attributed guest quotes
// ---------------------------------------------------------------------------

export const TESTIMONIALS = {
  eyebrow: 'Testimonials',
  title: 'Hear From Coffee Lovers',
  subhead:
    'From the first morning coffee to slow afternoons, see why our guests keep coming back for another cup.',
  items: [
    {
      quote:
        'Natsu has become my favorite cafe. The coffee is always excellent, the space feels welcoming, and every visit gives me a reason to stay longer.',
      author: 'Ryan Brooks',
      role: 'New York',
    },
    {
      quote:
        'The kind of place you find yourself coming back to without even thinking about it. Great coffee, beautiful atmosphere, and a warm welcome.',
      author: 'Chen',
      role: 'Austin, Texas',
    },
    {
      quote:
        'Natsu has become my favorite little coffee stop. The drinks are consistently amazing, and there’s something about the space that makes you want to stay a little longer.',
      author: 'Ethan Parker',
      role: 'Brooklyn, New York',
    },
  ],
};

// ---------------------------------------------------------------------------
// FAQ — the home page's single genuinely answered question
// ---------------------------------------------------------------------------

/**
 * The source's FAQ accordion lists five questions, but only the first ships
 * an answer anywhere in its compiled markup — the other four render as a
 * closed accordion row with no answer text behind them at all, in the
 * source itself, not lost to scraping. Rather than invent four answers,
 * this port keeps the one question the source actually answers.
 */
export const FAQ = {
  eyebrow: 'FAQ',
  title: 'Frequently Asked Questions',
  subhead:
    'Everything you need to know about Natsu, from our coffee and menu to ordering, locations, and everyday visits.',
  items: [
    {
      q: 'What kind of coffee does Natsu serve?',
      a: 'We serve specialty coffee alongside classic favorites, seasonal drinks, and thoughtfully crafted signature creations.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Contact — the contact page's real address, hours and enquiry form
// ---------------------------------------------------------------------------

export const CONTACT = {
  eyebrow: 'Contact Us',
  title: 'Come Find Your New Favorite Coffee',
  subhead: 'Fill in the form to get in touch — we read every message.',
  phone: '(+1) 1234 567 910',
  email: 'info@natsucafe.coffee',
  address: 'Natsu / Downtown — 128 Mercer St., New York, NY 10012',
  hours: 'Mon–Fri 07:00–20:00 · Sat–Sun 08:00–21:00',
  showForm: true,
  formNote: "We'll get back to you by email as soon as we can.",
  fields: {
    namePlaceholder: 'Jane Doe',
    emailPlaceholder: 'you@example.com',
    messagePlaceholder: 'Tell us what brings you in',
    submit: 'Submit',
  },
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export const FOOTER = {
  tagline: 'Specialty coffee, and drinks made to brighten every day.',
  quickLinksTitle: 'Pages',
  quickLinks: NAV_LINKS,
  /** The year is appended at render time (see Footer.tsx), not baked in here. */
  copyright: 'Natsu Coffee. All rights reserved.',
};
