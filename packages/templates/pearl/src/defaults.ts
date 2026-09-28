// lib/data.ts
// Single source of truth for all copy/content on the Pearl landing page.
//
// Pearl is an ORIGINAL template, not a port of any Framer marketplace
// source. A genuine search of Framer's free bakery-and-cafe marketplace
// category turned up fourteen free listings ("Deux", "Coffee & Cafe Shop",
// "LUNA ROSSA", "Umami", "Beanro", "Sofra", "Common Grounds", "Slice Town",
// "Sushi", "MenuMaison" among them) — but every one of them is a bakery,
// a sit-down restaurant, or a generic coffee shop already close to this
// library's own natsu ("Ferea", warm cream coffee shop) or kiln ("Drip",
// monochrome coffee bar). None is a boba / specialty-drinks bar, and
// nothing free and distinct enough turned up after that search. Built
// instead from scratch, per this project's own stated fallback: Google
// Fonts (Fredoka + Nunito, see theme.css), an original palette, and real
// stock photography — every image in /t/pearl/images/ was downloaded from
// Unsplash's free tier (images.unsplash.com, never plus.unsplash.com's paid
// tier) and every font in /t/pearl/fonts/ from fonts.gstatic.com, then
// saved into this repo; nothing here hotlinks a remote src. A handful of
// candidate photos were rejected after a visual check because they showed
// a real, currently-operating shop's own legible storefront signage
// ("Sunn'Cha", "Merit Coffee") or were off-theme (a diner, plain iced
// coffee) — the six kept show generic drinks, hands, or unbranded retail
// shelving only.
//
// Subtype: a small-batch boba / specialty-drinks bar — distinct from
// natsu's warm cream coffee shop and kiln's monochrome coffee bar (this
// library's other two cafe templates): no espresso anywhere on the menu,
// a shaken-to-order drink instead of a brewed one, and a playful, rounded,
// colour-forward system instead of either sibling's restrained one. "Pearl"
// names the tapioca pearl at the bottom of the cup, plainly.

// ---------------------------------------------------------------------------
// Brand / nav
// ---------------------------------------------------------------------------

export const SITE_NAME = 'Pearl';

export const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Menu', href: '#menu' },
  { label: 'Process', href: '#process' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Contact', href: '#contact' },
];

export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/',
  tiktok: 'https://www.tiktok.com/',
};

/** Reused everywhere a CTA points at ordering. */
export const ORDER_LABEL = 'Order Ahead';

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

/**
 * This template's own hero grammar: a full-bleed photo with a flat, uniform
 * dark-plum scrim (never a gradient weakest behind the headline — the
 * contrast bug an earlier sibling shipped and every template since has
 * checked against), a small round "bubble" inset photo bottom-left instead
 * of yokai's diagonal-tag inset, and a cluster of small filled dots rising
 * and drifting past it — this template's own continuous motion, standing in
 * for tapioca pearls floating up through milk tea, quite unlike yokai's
 * rising steam, brasa's or natsu's spinning badge, or forno's up-down float.
 */
export const HERO = {
  eyebrow: 'Small-Batch Bubble Tea',
  titleLines: ['Milk Tea,', 'Made Slow.'],
  subhead:
    'Loose-leaf tea steeped to order, tapioca pearls cooked fresh every four hours, and sweetness dialed exactly how you like it — from zero to full sugar rush.',
  primaryCta: { label: ORDER_LABEL, href: '#contact' },
  secondaryCta: { label: 'See the Menu', href: '#menu' },
  image: '/t/pearl/images/hero.jpg',
  inset: {
    src: '/t/pearl/images/highlight-pearls.jpg',
    alt: 'A hand holding a fresh-poured milk tea with tapioca pearls',
  },
};

// ---------------------------------------------------------------------------
// About
// ---------------------------------------------------------------------------

export const ABOUT = {
  eyebrow: 'Our Story',
  heading: 'Started With One Shaker And A Brown-Sugar Recipe',
  paragraphs: [
    'Pearl started on a single folding table with one cocktail shaker, a rice cooker for the tapioca, and a brown-sugar syrup recipe that took forty tries to get right. We kept the shaker, kept the small batches, and never swapped the loose-leaf tea for a powdered mix — even on the days a mix would have been faster.',
  ],
  cta: { label: 'See the Menu', href: '#menu' },
  image: '/t/pearl/images/about.jpg',
};

// ---------------------------------------------------------------------------
// Highlights
// ---------------------------------------------------------------------------

export const HIGHLIGHTS = {
  eyebrow: 'Why Pearl',
  title: 'Four Things We Never Skip',
  subhead: 'The same four things, every batch, every day.',
  items: [
    {
      title: 'Pearls Cooked Every 4 Hours',
      body: 'Tapioca simmers in brown-sugar syrup in small batches, never held overnight.',
      icon: 'circle',
    },
    {
      title: 'Loose-Leaf, Never Powdered',
      body: 'Black, jasmine and oolong are steeped fresh per pot, not poured from a mix.',
      icon: 'leaf',
    },
    {
      title: 'Sweetness Your Way',
      body: '0%, 30%, 50%, 70% or full sugar — same price, no upcharge for less.',
      icon: 'sliders',
    },
    {
      title: 'Dairy-Free On Request',
      body: 'Oat or coconut milk swaps into any milk tea at no extra charge.',
      icon: 'droplet',
    },
  ],
};

// ---------------------------------------------------------------------------
// Services — the menu
// ---------------------------------------------------------------------------

/**
 * A text-forward, categorised menu list — closer in spirit to kiln's plain
 * list than to natsu's or yokai's photo-card grid, but genuinely this
 * template's own: each category gets its own coloured tab rather than
 * kiln's unbroken monochrome divider rule (see Services.tsx), and `body`
 * carries a short tasting note rather than kiln's calorie count, since a
 * boba counter's own real menu boards read that way — name, note, price.
 */
export const SERVICES = {
  eyebrow: 'Our Menu',
  title: 'The Full Menu',
  subhead: 'Every drink shaken to order, ice and all — ask for any sweetness or milk swap.',
  items: [
    {
      number: '01',
      category: 'Milk Tea',
      name: 'Classic Black Milk Tea',
      price: '$5.25',
      body: 'Steeped 8 hours, lightly sweet, chewy tapioca pearls included.',
    },
    {
      number: '02',
      category: 'Milk Tea',
      name: 'Taro Milk Tea',
      price: '$5.75',
      body: 'Real taro root, not syrup — naturally purple, subtly nutty.',
    },
    {
      number: '03',
      category: 'Milk Tea',
      name: 'Thai Milk Tea',
      price: '$5.75',
      body: 'Spiced black tea, sweetened condensed milk, served over ice.',
    },
    {
      number: '04',
      category: 'Milk Tea',
      name: 'Brown Sugar Boba Milk',
      price: '$6.25',
      body: 'Fresh milk, hand-cooked brown-sugar pearls, no tea at all.',
    },
    {
      number: '05',
      category: 'Fruit Tea',
      name: 'Passionfruit Green Tea',
      price: '$5.50',
      body: 'Jasmine green tea, real passionfruit seeds, lightly tart.',
    },
    {
      number: '06',
      category: 'Fruit Tea',
      name: 'Lychee Oolong',
      price: '$5.50',
      body: 'Roasted oolong over lychee jelly, floral and light.',
    },
    {
      number: '07',
      category: 'Fruit Tea',
      name: 'Strawberry Green Tea',
      price: '$6.00',
      body: 'Muddled strawberry, jasmine green tea, popping boba on request.',
    },
    {
      number: '08',
      category: 'Specialty',
      name: 'Matcha Latte',
      price: '$5.75',
      body: 'Stone-ground matcha whisked fresh, oat milk by default.',
    },
    {
      number: '09',
      category: 'Specialty',
      name: 'Okinawa Brown Sugar Latte',
      price: '$6.50',
      body: 'Black tea, brown-sugar syrup and fresh milk, layered not stirred.',
    },
    {
      number: '10',
      category: 'Specialty',
      name: 'Honeydew Cream Frappe',
      price: '$6.75',
      body: 'Blended honeydew, a cold-foam cap, no tea base at all.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Steps — how a cup gets made
// ---------------------------------------------------------------------------

export const STEPS = {
  eyebrow: 'Our Process',
  title: 'From Leaf To Cup',
  subhead: '',
  items: [
    {
      number: '01',
      title: 'Brew',
      body: 'Loose-leaf black, oolong and jasmine tea steeped fresh every morning, never a concentrate.',
    },
    {
      number: '02',
      title: 'Cook',
      body: 'Tapioca pearls simmer in brown-sugar syrup in small batches, every four hours.',
    },
    {
      number: '03',
      title: 'Shake',
      body: 'Each drink is built and shaken to order in a cocktail shaker, ice and all.',
    },
    {
      number: '04',
      title: 'Seal',
      body: 'Sealed fresh at the counter so the pearls stay put until the very first sip.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------

export const GALLERY = {
  eyebrow: 'Gallery',
  title: 'A Few Moments From The Counter',
  subhead: '',
  images: [
    { src: '/t/pearl/images/gallery-1.jpg', alt: 'Fresh milk being poured into steeped tea' },
    { src: '/t/pearl/images/gallery-2.jpg', alt: 'Shelves of loose-leaf tea at the counter' },
    { src: '/t/pearl/images/gallery-3.jpg', alt: 'Two fruit-topped specialty drinks side by side' },
  ],
};

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export const STATS = {
  eyebrow: 'By The Numbers',
  title: 'A Small Counter, Run On Habit',
  subhead: '',
  items: [
    { value: '4hrs', label: 'Between every fresh batch of pearls' },
    { value: '0–100%', label: 'Sugar levels, your call every time' },
    { value: '12', label: 'Teas, milks and toppings on the counter' },
    { value: '2min', label: 'From order to shaken and sealed' },
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
        "The brown sugar boba actually tastes like brown sugar, not syrup from a pump. It's the only one in town I'd say that about.",
      author: 'Priya Nair',
      role: 'Regular',
    },
    {
      quote:
        'Asked for 30% sugar and oat milk and nobody blinked. Same price, no attitude, and it still tasted great.',
      author: 'Marcus Webb',
      role: 'Regular',
    },
    {
      quote:
        "Pearls still have that fresh chew even at the bottom of the cup. You can tell they're not sitting around all day.",
      author: 'Sofia Lindqvist',
      role: 'Regular',
    },
  ],
};

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

export const FAQ = {
  eyebrow: 'Questions',
  title: 'Good To Know',
  subhead: '',
  items: [
    {
      q: 'Can I change the sugar and ice level?',
      a: 'Yes — every drink comes at 0%, 30%, 50%, 70% or full sugar, and light, regular or no ice, at no extra charge either way.',
    },
    {
      q: 'Do you have dairy-free options?',
      a: 'Any milk tea can be made with oat or coconut milk on request, and our matcha latte defaults to oat milk already.',
    },
    {
      q: 'How long do the tapioca pearls stay chewy?',
      a: "We cook a fresh batch every four hours and don't hold pearls past that window, so a drink ordered near the end of a batch still gets a fresh scoop.",
    },
    {
      q: 'Can I order ahead for pickup?',
      a: "Yes — use the form below with a pickup time and we'll have it shaken and sealed when you arrive.",
    },
  ],
};

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

export const CONTACT = {
  eyebrow: 'Order Ahead',
  title: 'Skip The Line',
  subhead: "Tell us what you want and when you'll be by — we'll have it ready at the counter.",
  phone: '+1 (415) 555-0148',
  email: 'hello@pearl.drinks',
  address: '212 Bloom Street, San Francisco, CA',
  hours: 'Daily 10am–9pm',
  showForm: true,
  formNote: "We'll text or email to confirm — orders are held for 15 minutes past pickup time.",
  fields: {
    namePlaceholder: 'Jamie Lin',
    pickupPlaceholder: '4:30pm',
    messagePlaceholder: '2 taro milk teas, 50% sugar, oat milk',
    emailPlaceholder: 'you@example.com',
    submit: ORDER_LABEL,
  },
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export const FOOTER = {
  tagline: 'A small-batch bubble tea and specialty-drinks counter — shaken to order, every time.',
  quickLinksTitle: 'Explore',
  quickLinks: NAV_LINKS,
  /** The year is appended at render time (see Footer.tsx), not baked in here. */
  copyright: 'Pearl. All rights reserved.',
};
