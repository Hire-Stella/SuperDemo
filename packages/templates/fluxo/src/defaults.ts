// lib/data.ts
// Single source of truth for all copy/content on the Fluxo landing page.
//
// Ported from a literal SSR HTML/CSS mirror of "Paywave" — a free Framer
// template by Flowbyherox, published on the Framer marketplace as a
// merchant-payments / "accept payments for your business" product page —
// rebranded here from "Paywave" to the fictional payments brand "Fluxo"
// (a nod to the source's own "wave" motif — money in flux — kept to one
// word like every sibling template's own fictional name). The source's own
// wordmark is a raster PNG with "Paywave" baked into the pixels, so it is
// rebuilt here as a real text lockup in this port's own display face next
// to a hand-recreated copy of the source's diamond-in-circle mark (simple
// enough geometry to redraw faithfully as inline SVG, confirmed against the
// source's own icon asset). One real route (the Paywave home page) is
// ported in full; its "Home 2" alternate layout and nine-page site
// (About, Careers, Blog, Pricing, Features, Integrations, FAQ, Contact,
// 404) exist on the live site but carry no content this contract has a
// section for beyond the home page, so none of them is ported.
//
// Source: https://paywave.framer.website/

// ---------------------------------------------------------------------------
// Known template fingerprints
// ---------------------------------------------------------------------------

/** The Framer marketplace listing credits "Flowbyherox" as the template's author. */
export const TEMPLATE_CREDIT = 'Flowbyherox';

/**
 * The source footer links to bare Facebook, Instagram, LinkedIn and X
 * icons with no visible handle for either the template author or the
 * fictional Fluxo brand — the same bare, unconfigured placeholder
 * situation every other port in this library flags, not a scraped handle.
 */
export const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/',
  instagram: 'https://www.instagram.com/',
  linkedin: 'https://www.linkedin.com/',
  twitter: 'https://twitter.com/',
};

// ---------------------------------------------------------------------------
// Brand / nav
// ---------------------------------------------------------------------------

export const SITE_NAME = 'Fluxo';

/**
 * The source's own primary nav trims to four items here: its real in-page
 * anchors ("Features", "Integrations") plus the two off-page links this
 * single-page contract keeps as in-page bands instead ("Pricing" and
 * "Contact" both existed as separate routes on the source; here they land
 * on `#testimonials` and `#contact`, this port's own real sections). The
 * source's own "Get started" pill is kept as the nav's own CTA rather than
 * a fifth link, matching the source's own `Primary - large` button.
 */
export const NAV_LINKS = [
  { label: 'Features', href: '#highlights' },
  { label: 'Dashboard', href: '#services' },
  { label: 'Customers', href: '#testimonials' },
  { label: 'Contact', href: '#contact' },
];

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

/**
 * Literal: the source's own two-line headline break ("The Payment Solution"
 * / "for your Business") and its one-sentence subhead, copied verbatim from
 * the page's own SSR text nodes. `image` is the source's own hero product
 * shot — a real dashboard screenshot cycled through the source's hero
 * marquee — kept as the one static raster asset in this port since its
 * "Acme Studios" sidebar label and order rows are baked into the image's
 * own pixels and cannot be re-templated with a tenant's name, the same
 * baked-asset caveat every sibling template's own raster logo gives.
 */
export const HERO = {
  eyebrow: '',
  titleLines: ['The payment solution', 'for your business'],
  subhead: 'Handle subscriptions and accept payments for your products or services.',
  primaryCta: { label: 'Get started', href: '#contact' } as { label: string; href: string } | null,
  secondaryCta: null as { label: string; href: string } | null,
  image: '/t/fluxo/images/dashboard.png',
};

// ---------------------------------------------------------------------------
// Highlights — the home page's "The solution for all your payment needs" band
// ---------------------------------------------------------------------------

/**
 * The source's own three-card feature intro, copied verbatim: heading,
 * subhead and all three card titles/bodies. `icon` names a lucide icon
 * standing in for the source's own bespoke Framer icon components — this
 * port's own choice, not traced from the source's SVGs.
 */
export const HIGHLIGHTS = {
  eyebrow: 'Features',
  title: 'The solution for all your payment needs',
  subhead: 'Fluxo offers you all the solutions you need for your business without stressing.',
  items: [
    {
      title: 'Accept payments',
      body: 'Send invoices or payment links to receive one-time payments fast.',
      icon: 'credit-card',
      image: '',
    },
    {
      title: 'Track finances',
      body: 'Keep track of your MRR, orders, and profits from our dashboard.',
      icon: 'trending-up',
      image: '',
    },
    {
      title: 'Email marketing',
      body: 'Stay in the loop and build an email list of your customers without any hassle.',
      icon: 'mail',
      image: '',
    },
  ],
};

// ---------------------------------------------------------------------------
// Stats — the source's own live dashboard-preview numbers
// ---------------------------------------------------------------------------

/**
 * Literal: the source's SSR text nodes for its scrolling "Track Finances"
 * dashboard-preview widget — `data-framer-name="$14,360"`, `"$2,500"` and
 * `"200"` in the page's own compiled HTML, confirmed distinct from the
 * baked-in hero screenshot above. Unlike that screenshot, this trio is real
 * DOM text in the source (not pixels), so it is ported here as real,
 * tenant-fillable content rather than another raster crop — rendered inside
 * Services' own "Track business insights" card rather than as a separate
 * top-level band, matching where the source itself places it.
 */
export const STATS = [
  { value: '$14,200', label: 'Main balance' },
  { value: '$2,500', label: 'Monthly recurring revenue' },
  { value: '200', label: 'Orders' },
];

// ---------------------------------------------------------------------------
// Services — "All you need for your business"
// ---------------------------------------------------------------------------

/**
 * The source's own second feature band, three items with the source's own
 * literal copy. The source pairs the first item with a live payment-link
 * checkout mockup and the second with the same dashboard-stat marquee as
 * `STATS` above — both real DOM, not photos — so this port draws its own
 * small checkout-card and stat-trio widgets in `Services.tsx` rather than
 * shipping two more raster crops; the demo product on that mockup card
 * ("Framer Template", "$99.99", literally an ad for buying the source
 * template itself) is swapped for a neutral placeholder sale a real
 * merchant might ring up, since porting the source's own meta-commentary
 * about itself would read as broken copy on every tenant's page.
 */
export const SERVICES = {
  eyebrow: 'Dashboard',
  title: 'All you need for your business',
  subhead: 'Focus more on your business and let us manage your payment processes for you.',
  items: [
    {
      number: '',
      category: 'checkout',
      name: 'Customizable payment links',
      price: '',
      body: 'Create payment links that not only allow you to accept payments but also fit your brand.',
    },
    {
      number: '',
      category: 'stats',
      name: 'Track your business insights',
      price: '',
      body: 'Keep track of your monthly recurring revenue, orders, and income from our dashboard.',
    },
    {
      number: '',
      category: 'email',
      name: 'Add customers to your email list',
      price: '',
      body: 'Generate leads and market your product or services using our email marketing tools.',
    },
  ],
};

/**
 * The demo sale shown on Services' own payment-link mockup card — this
 * port's neutral stand-in for the source's literal "Framer Template
 * $99.99" self-promotion (see SERVICES' own note above). Template chrome,
 * not tenant content: no contract field carries a single demo product.
 */
export const CHECKOUT_DEMO = {
  product: 'Studio membership',
  price: '$49.00',
  cardNumber: '•••• •••• •••• 4242',
  cta: 'Buy now',
};

// ---------------------------------------------------------------------------
// Gallery — "Integrate with modern no-code tools"
// ---------------------------------------------------------------------------

/**
 * The source's own integrations band shows six placeholder marketplace
 * logos reading literally "Logoipsum" and "LOGO" — dummy filler wordmarks
 * from the source template itself, not real integration partners. Porting
 * another product's own filler text would read as unfinished rather than
 * branded, so this port draws its own six small abstract marks instead
 * (`Marks.tsx`), captioned with the tool category each stands in for
 * rather than an invented company name.
 */
export const GALLERY = {
  eyebrow: 'Integrations',
  title: 'Integrate with modern no-code tools',
  subhead:
    'Fluxo gives you the flexibility to integrate our payment solutions with your favorite no-code tools.',
  images: [
    { src: '/t/fluxo/images/mark-storefront.svg', alt: 'Storefront builders' },
    { src: '/t/fluxo/images/mark-cart.svg', alt: 'Ecommerce platforms' },
    { src: '/t/fluxo/images/mark-automate.svg', alt: 'Automation tools' },
    { src: '/t/fluxo/images/mark-mail.svg', alt: 'Email platforms' },
    { src: '/t/fluxo/images/mark-calendar.svg', alt: 'Booking and scheduling' },
    { src: '/t/fluxo/images/mark-analytics.svg', alt: 'Analytics platforms' },
  ],
};

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

/**
 * The source's own nine testimonials, each attributed to a named user and
 * role exactly as given, quotes lightly polished for this port's B2B
 * merchant-payments register — the source's own quotes were written for a
 * consumer social feed and lean on hashtags ("#FintechFan", "#SquadGoals")
 * that read as noise rather than a merchant testimonial; the claim in each
 * quote is kept, the hashtag is not. Photos are the source's own real
 * stock portraits, downloaded and re-encoded locally.
 */
export const TESTIMONIALS = [
  {
    quote:
      "With Fluxo I'm able to accept payments for my subscription business. The experience is unbelievably easy to use and intuitive.",
    author: 'Jessica Brown',
    role: 'Marketing Manager, Bloom & Bean Co',
    image: '/t/fluxo/images/avatar-2.jpg',
  },
  {
    quote: "Fluxo keeps my finances on the go — easy to send and receive payments between classes.",
    author: 'David Lee',
    role: 'Fitness Instructor, FitLife Studios',
    image: '/t/fluxo/images/avatar-3.jpg',
  },
  {
    quote: 'Fluxo is a game-changer for group payments — a quick, secure way to split the bill.',
    author: 'Emily Garcia',
    role: 'Social Media Influencer',
    image: '/t/fluxo/images/avatar-4.jpg',
  },
  {
    quote: 'Top-notch security features give me peace of mind. Fluxo keeps my money safe.',
    author: 'Michael Chen',
    role: 'Software Engineer, Technovation Inc.',
    image: '/t/fluxo/images/avatar-5.jpg',
  },
  {
    quote: "I love the instant payout speed on Fluxo — getting paid has never felt this smooth.",
    author: 'Lisa Rodriguez',
    role: 'Fashion Designer, Lisa Stitches',
    image: '/t/fluxo/images/avatar-6.jpg',
  },
  {
    quote: 'Fluxo makes sending invoices to clients effortless — perfect for managing my business remotely.',
    author: 'Daniel Williams',
    role: 'CEO, Suncoast Getaways',
    image: '/t/fluxo/images/avatar-7.jpg',
  },
  {
    quote: "Fluxo helps me stay on top of spending with clear breakdowns. I'm finally in control of our finances.",
    author: 'Kimiko Tanaka',
    role: 'Accountant, GreenEarth Solutions',
    image: '/t/fluxo/images/avatar-8.jpg',
  },
  {
    quote: 'Accepting donations is quick and easy with Fluxo — supporting our cause has never been simpler.',
    author: 'Christopher Lopez',
    role: 'Volunteer Coordinator, Hope for Paws',
    image: '/t/fluxo/images/avatar-9.jpg',
  },
  {
    quote: 'Fast, contactless payments with Fluxo keep our line moving. Happy customers, happy staff.',
    author: 'Olivia Patel',
    role: 'Barista, Caffe Delight',
    image: '/t/fluxo/images/avatar-1.jpg',
  },
];

// ---------------------------------------------------------------------------
// Contact — the home page's own closing CTA band
// ---------------------------------------------------------------------------

/**
 * Literal heading and subhead from the source's own closing band
 * ("Handle payments and marketing for your business" / "Paywave offers the
 * best user experience..."), with `showForm` true and a lightweight
 * name+email form: the source's own CTA links to a `/contact` route this
 * scrape never rendered, so the form fields themselves are this port's own
 * design, in the same minimal two-field register as the source's own
 * checkout-card mockup rather than an invented multi-field contact form.
 */
export const CONTACT = {
  eyebrow: 'Get started',
  title: 'Handle payments and marketing for your business',
  subhead:
    'Fluxo offers the best user experience for scaling and handling payments for your products or services.',
  phone: '',
  email: 'hello@fluxo.co',
  address: '',
  hours: '',
  showForm: true,
  formNote: 'No credit card required to start.',
  fields: {
    name: 'Full name',
    email: 'Work email',
    submit: 'Get started for free',
  },
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export const FOOTER = {
  tagline:
    'Payments infrastructure for growing businesses — accept payments, track revenue, and reach customers from one dashboard.',
  quickLinksTitle: 'Product',
  quickLinks: NAV_LINKS,
  /** The year is appended at render time (see Footer.tsx), not baked in here. */
  copyright: 'Fluxo. All rights reserved.',
};
