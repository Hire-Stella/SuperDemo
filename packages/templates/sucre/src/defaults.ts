// lib/data.ts
// Single source of truth for all copy/content on the Sucre landing page.
//
// Ported from a literal SSR HTML/CSS mirror of "Cakelab" — a free Framer
// template by Jitu Raut, published on the Framer marketplace for bakeries,
// cake studios and dessert shops — rebranded here from "Cakelab" to the
// fictional patisserie name "Sucre" (French for "sugar" — a one-word,
// dessert-forward register in the same naming convention as this library's
// other ports: Aurelia, Brasa, Forno, Tavola, Yokai, Natsu, Kiln). One real
// route (the Cakelab home page) is ported in full; its About/Treats/Contact
// pages exist on the live site as separate routes but repeat rather than add
// to the home page's own content, so only the home page is ported.
//
// Source: https://cakelab.framer.website/

// ---------------------------------------------------------------------------
// Known template fingerprints
// ---------------------------------------------------------------------------

/** The Framer marketplace listing credits "Jitu Raut" as the template's author. */
export const TEMPLATE_CREDIT = 'Jitu Raut';

/**
 * The source footer's three social links point to the template author's own
 * personal Instagram/YouTube/X handles (`jitu.ux`, `Jitu_ux`, `jituux`), not
 * to any Cakelab-branded account — scraping a real person's personal social
 * profile into a fictional brand's footer would misattribute it, so this
 * port keeps the same three networks but as bare, unconfigured root links,
 * the same placeholder treatment kiln gives its own footer's social links.
 */
export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/',
  youtube: 'https://www.youtube.com/',
  twitter: 'https://x.com/',
};

// ---------------------------------------------------------------------------
// Brand / nav
// ---------------------------------------------------------------------------

export const SITE_NAME = 'Sucre';

/** The source's own literal home-page nav: Home, About, Treats, Contact. */
export const NAV_LINKS = [
  { label: 'Home', href: '#top' },
  { label: 'About', href: '#about' },
  { label: 'Treats', href: '#treats' },
  { label: 'Contact', href: '#contact' },
];

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

/**
 * The source home page's actual hero, copied verbatim: a two-line headline,
 * one sentence subhead, and two real buttons — a cream pill labelled
 * "Explore treats" (linking to the source's own `/treats` route) and a
 * second, visually identical pill labelled "Plan a party" (linking to
 * `/contact`). No eyebrow: the source's hero has no small label above its
 * headline.
 */
export const HERO = {
  eyebrow: '',
  titleLines: ['Sweet moments,', 'made special'],
  subhead: 'Freshly baked cakes and pastries made to make your day extra special.',
  primaryCta: { label: 'Explore treats', href: '#treats' },
  secondaryCta: { label: 'Plan a party', href: '#contact' },
  image: '/t/sucre/images/hero.png',
};

// ---------------------------------------------------------------------------
// About — the home page's "About us" band
// ---------------------------------------------------------------------------

/**
 * Literal heading and paragraph, copied verbatim — including the source's
 * own real typo ("passsion", three S's) in its heading, the same
 * verbatim-with-a-typo treatment natsu's own about band gives the one it
 * found in its source ("WHETER" for "whether"). The two images are the
 * source's own stacked two-photo collage in this band, not one full-bleed
 * shot.
 */
export const ABOUT = {
  eyebrow: 'About us',
  heading: 'Baked with passsion, served with love',
  paragraphs: [
    'At Cakelab, we craft fresh cakes, pastries, and desserts made to turn every moment into something sweet, elegant, delightful, warm, and truly memorable.',
  ],
  cta: { label: 'Discover our story', href: '#about' },
  image: '/t/sucre/images/about.png',
  detailImage: '/t/sucre/images/about-detail.png',
};

// ---------------------------------------------------------------------------
// Stats — the home page's "Metrics" band
// ---------------------------------------------------------------------------

/**
 * The source's four metrics ("Customer rating", "Years of baking", "Orders
 * delivered", "Happy cake lovers") render through a JS-only Framer code
 * component (`data-code-component-plugin-id`) — an animated number counter
 * with no static end value anywhere in the page's SSR HTML; the markup
 * itself server-renders the counter's starting frame ("0.0", "0+", "0.0K+",
 * "0K+") and animates up to a real number only once the component's own
 * client script runs. Rather than port that literal zero — which would read
 * as a broken build, not a demo — this hand-matches the band's real layout,
 * typography and divider rule with representative figures for the four
 * labels the source itself chose, disclosed here rather than guessed
 * silently.
 */
export const STATS = {
  eyebrow: 'Happy customers',
  items: [
    { value: '4.9★', label: 'Customer rating' },
    { value: '6+', label: 'Years of baking' },
    { value: '18K+', label: 'Orders delivered' },
    { value: '12K+', label: 'Happy cake lovers' },
  ],
};

// ---------------------------------------------------------------------------
// Services — the home page's "Elegant treats for everyone" band
// ---------------------------------------------------------------------------

/**
 * The source's own three treat categories, copied verbatim: name, one-line
 * description, and a category photo. The source shows no per-item price
 * anywhere in this band (bare digits appear only on the membership plans
 * below) — `price` is left blank rather than inventing one the source never
 * shows. `body` doubles as the CTA label the source gives each card
 * ("Order" for the first two, "Create yours" for the custom one) via the
 * component, not the schema, since the schema's `Service` has no CTA field
 * of its own.
 */
export const SERVICES = {
  eyebrow: 'Signature treats',
  title: 'Elegant treats for everyone',
  subhead: '',
  items: [
    {
      number: '01',
      name: 'Fresh cakes',
      price: '',
      body: 'Soft layered cakes baked fresh with premium ingredients, perfect for birthdays and special moments',
      cta: 'Explore all',
      image: '/t/sucre/images/treat-cakes.png',
    },
    {
      number: '02',
      name: 'Sweet pastries',
      price: '',
      body: 'Delicate pastries, croissants, and more handcrafted daily for a perfect bite each & every time.',
      cta: 'Explore all',
      image: '/t/sucre/images/treat-pastries.png',
    },
    {
      number: '03',
      name: 'Custom cakes',
      price: '',
      body: 'Designed around your vision, handcrafted with premium ingredients and elegant artistry.',
      cta: 'Create yours',
      image: '/t/sucre/images/treat-custom.png',
    },
  ],
};

// ---------------------------------------------------------------------------
// Highlights — the home page's "Why us" band
// ---------------------------------------------------------------------------

/**
 * The source's own four benefit pillars, copied verbatim. Each pairs with a
 * small custom illustration in the source rather than a stock icon set; this
 * port stands in with the closest lucide names (`heart`, `wheat`, `flame`,
 * `smile`) rather than porting four one-off decorative graphics for a single
 * small glyph each.
 */
export const HIGHLIGHTS = {
  eyebrow: 'Why us',
  title: 'More than just',
  titleLine2: 'baked good',
  subhead: '',
  items: [
    {
      title: 'Made with love',
      body: 'Crafted daily with passion, care, and dedication.',
      icon: 'heart',
    },
    {
      title: 'Premium ingredients',
      body: 'Only finest ingredients for every delicious bite.',
      icon: 'wheat',
    },
    {
      title: 'Freshly baked',
      body: 'Baked fresh daily for perfect layer of flavor always.',
      icon: 'flame',
    },
    {
      title: 'Happiness guaranteed',
      body: 'Creating sweet moments with every joyful celebration.',
      icon: 'smile',
    },
  ],
};

// ---------------------------------------------------------------------------
// Pricing — the home page's "Sweet memberships" band
// ---------------------------------------------------------------------------

/**
 * The source's own three membership tiers, copied verbatim — name, bare
 * price digit, billing note and feature list. The middle tier is the
 * source's own visually gold-bordered "Desktop Gold" card variant, kept here
 * as `featured`. The third tier's price is the source's own literal
 * "Starts from $499" open-ended custom quote, not a fixed monthly fee, kept
 * as its own `note` rather than folded into `price`.
 */
export const PRICING = {
  eyebrow: 'Sweet memberships',
  title: 'Where every month',
  titleLine2: 'something special',
  tiers: [
    {
      name: 'Sweet beginnings',
      price: '$99',
      note: '/month',
      features: [
        '5% member savings',
        'Birthday dessert reward',
        '2 cakes complimentary',
        'Member only offers',
      ],
      cta: { label: 'Become a member', href: '#contact' },
      featured: false,
    },
    {
      name: 'Signature delights',
      price: '$249',
      note: '/month',
      features: [
        '10% off every order',
        'Priority order placement',
        'Monthly sweet surprise',
        '4 cakes complimentary',
      ],
      cta: { label: 'Become a member', href: '#contact' },
      featured: true,
    },
    {
      name: 'Make your own',
      price: '$499',
      note: 'Starts from',
      features: [
        'Fully personalized designs',
        'Premium handcrafted details',
        'Custom flavors & fillings',
        'Dedicated design consultation',
      ],
      cta: { label: 'Start designing', href: '#contact' },
      featured: false,
    },
  ],
};

// ---------------------------------------------------------------------------
// Testimonials — the home page's "Loved by every sweet tooth" band
// ---------------------------------------------------------------------------

/**
 * The source's own three reviews, copied verbatim, each with its own real
 * star count (5, 4, 5 — not a flat five across the board) and the specific
 * treat each reviewer names, plus the source's own reviewer photo.
 */
export const TESTIMONIALS = {
  eyebrow: 'Happy customers',
  title: 'Loved by every',
  titleLine2: 'sweet tooth',
  items: [
    {
      quote:
        'The cake looked absolutely stunning and tasted better. Every detail felt thoughtfully crafted and truly special.',
      author: 'Emma Johnson',
      role: 'Black currant pastry',
      stars: 5,
      image: '/t/sucre/images/testimonial-emma.png',
    },
    {
      quote:
        'The cake was absolutely stunning and tasted even better than it looked. Every detail felt thoughtfully crafted.',
      author: 'Olivia Benett',
      role: 'Red velvet cake',
      stars: 4,
      image: '/t/sucre/images/testimonial-olivia.png',
    },
    {
      quote:
        'The Blush Rose cake became the centerpiece of our celebration. It was almost too beautiful to cut.',
      author: 'Charlotte Hayes',
      role: 'Blush rose cake',
      stars: 5,
      image: '/t/sucre/images/testimonial-charlotte.png',
    },
  ],
};

// ---------------------------------------------------------------------------
// Gallery — the home page's "From our kitchen to your feed" band
// ---------------------------------------------------------------------------

/**
 * The schema has no dedicated "social feed" section, so the source's own
 * Instagram strip — one cupcake photo, one macaron photo, and three
 * portrait-format Instagram Stories frames — is ported here as this
 * contract's `gallery`, the same real-photos-standing-in-for-a-band-the-
 * schema-has-no-slot-for move kiln's own gallery makes for its source's
 * "Ideas" blog thumbnails.
 */
export const GALLERY = {
  eyebrow: 'Sweet moments',
  title: 'From our kitchen to your feed',
  subhead:
    'Follow us for fresh creations, exclusive offers, behind the scenes moments and daily dessert inspiration.',
  images: [
    {
      src: '/t/sucre/images/gallery-cupcake.png',
      alt: 'A single frosted cupcake with a cherry on top',
    },
    {
      src: '/t/sucre/images/gallery-macarons.png',
      alt: 'A row of pastel macarons on a marble counter',
    },
    {
      src: '/t/sucre/images/gallery-story-1.png',
      alt: 'An Instagram story frame of a layered celebration cake',
    },
    {
      src: '/t/sucre/images/gallery-story-2.png',
      alt: 'An Instagram story frame of a pastry chef piping frosting',
    },
    {
      src: '/t/sucre/images/gallery-story-3.png',
      alt: 'An Instagram story frame of a box of custom cupcakes',
    },
  ],
};

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

/** The source's own five accordion questions, copied verbatim. */
export const FAQ = {
  eyebrow: 'Loved by every sweet tooth',
  items: [
    {
      q: 'How far in advance should I place my order?',
      a: 'We recommend placing custom cake orders at least 2–3 days in advance to ensure availability and perfect preparation.',
    },
    {
      q: 'Do you create custom cakes for special occasions?',
      a: 'Yes, we craft personalized cakes for birthdays, weddings, anniversaries, baby showers, and other special celebrations.',
    },
    {
      q: 'Are your cakes and desserts baked fresh?',
      a: 'Absolutely. Every cake, pastry, and dessert is freshly prepared using premium ingredients for the best taste and quality.',
    },
    {
      q: 'Do you offer delivery for cakes and desserts?',
      a: 'Yes, we provide convenient delivery options to ensure your treats arrive fresh and ready to enjoy.',
    },
    {
      q: 'What ingredients do you use in your baked goods?',
      a: 'We use carefully selected premium ingredients to create desserts that are rich in flavor, freshness, and quality.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Contact — the source's closing "Let's create something sweet" CTA + footer
// contact block
// ---------------------------------------------------------------------------

/**
 * The source's closing full-width CTA band ("Let's create something sweet")
 * doubles here as this contract's contact-section copy, with its own photo
 * of a finished cake standing in as the band's image; the phone, email and
 * address below are the source footer's own literal (and obviously
 * placeholder) values.
 *
 * The source's actual enquiry form lives on its separate `/contact` route,
 * out of scope for this port (only the home page was fetched). `fields`
 * gives a plain Name/Email/Phone/Message enquiry form in the source's own
 * field-label convention — the same shape forno's and tavola's own
 * `ContactForm` give their sources' equivalent forms — rather than inventing
 * copy for a form layout never actually seen.
 */
export const CONTACT = {
  eyebrow: 'Contact',
  title: "Let's create something sweet",
  subhead: "Handcrafted with love for life's most beautiful moments",
  phone: '+91 12345 67890',
  email: 'hello@sucre.bakery',
  address: 'Main Street, USA',
  hours: '',
  showForm: true,
  formNote: '',
  image: '/t/sucre/images/contact-cake.png',
  fields: {
    name: 'Name',
    namePlaceholder: 'Your name',
    email: 'Email',
    emailPlaceholder: 'you@example.com',
    phone: 'Phone',
    phonePlaceholder: '+1 555 000 0000',
    message: 'Message',
    messagePlaceholder: 'Tell us about the occasion',
    submit: 'Create your moment',
  },
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export const FOOTER = {
  tagline: 'Crafted with perfection, baked to perfection.',
  quickLinksTitle: 'Quicks',
  quickLinks: NAV_LINKS,
  legalLinksTitle: 'Others',
  legalLinks: [
    { label: 'Privacy policy', href: '#privacy' },
    { label: 'Terms of use', href: '#terms' },
  ],
  /** The year is appended at render time (see Footer.tsx), not baked in here. */
  copyright: 'Sucre. All rights reserved.',
};
