// lib/data.ts
// Single source of truth for all copy/content on the Cryptix landing page.
//
// Ported from a literal SSR HTML/CSS mirror of "Cryptix" — a free Framer
// template by Arthur, published on the Framer marketplace for crypto
// exchanges, wallets and Web3 trading products — kept under its own real
// name here, since "Cryptix" already reads as a fictional product name and
// needed no rebrand the way a template with a generic English noun for a
// name would.
//
// Source: https://cryptix.framer.website/
//
// Several bands on the source repeat the brand name mid-sentence ("Cryptix
// offers a secure experience…", "Why Choose Cryptix?", "Trusted by Crypto
// Enthusiasts Worldwide… who choose Cryptix for its seamless experience…",
// "All you need to know about Cryptix", "What is Cryptix?", "Join thousands
// of users who trust Cryptix…", the footer tagline). Every one of those is
// kept here as a function of the brand name rather than a literal string, so
// `content.ts`'s `adapt()` can drop a real tenant's name into the exact spot
// the source itself named its own product — not just the nav and footer.

// ---------------------------------------------------------------------------
// Known template fingerprints
// ---------------------------------------------------------------------------

/** The Framer marketplace listing credits "Arthur" as the template's author. */
export const TEMPLATE_CREDIT = 'Arthur';

/**
 * The source footer links Instagram and LinkedIn to their own bare,
 * unconfigured domains, and Twitter/X to the template author's own personal
 * handle (`x.com/uxui_arthur`) — excluded here per this pipeline's
 * convention (no personal social links belonging to the template author),
 * replaced with the same bare placeholder every other social link gets.
 */
export const SOCIAL_LINKS = {
  twitter: 'https://x.com/',
  instagram: 'https://www.instagram.com/',
  linkedin: 'https://www.linkedin.com/',
};

// ---------------------------------------------------------------------------
// Brand / nav
// ---------------------------------------------------------------------------

export const SITE_NAME = 'Cryptix';

/** The source's own top nav, verbatim, minus its "Use template" marketplace CTA. */
export const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

/**
 * The hero's subhead spells the brand name into its own first word
 * ("Cryptix offers a secure experience…", recovered from the source's own
 * per-character `data-framer-name` letter-reveal spans) — kept as a function
 * of the name so a real tenant's brand reads the same way, not just "Cryptix"
 * frozen in place.
 */
export const heroSubhead = (name: string) =>
  `${name} offers a secure experience for managing your digital assets. Instant transactions, optimized fees.`;

export const HERO = {
  eyebrow: '',
  titleLines: ['Take control of your digital assets'],
  subhead: heroSubhead(SITE_NAME),
  primaryCta: { label: 'Get started now', href: '#pricing' },
  secondaryCta: null as { label: string; href: string } | null,
  image: '/t/cryptix/images/dashboard.png',
  /**
   * The source's own small trust cluster beside the hero CTA: a "4,9" rating,
   * a bare label, and one prose line — not part of the schema's `Hero`, kept
   * here as the template's own fixed chrome the way kiln keeps its founding
   * years beside the Story band.
   */
  rating: '4.9',
  ratingLabel: 'They trust us',
  tagline:
    'Simplicity, performance, and security, empowering you to navigate the digital world with confidence and agility.',
};

// ---------------------------------------------------------------------------
// Live ticker — the "15+ Supported Assets" feature card's own widget
// ---------------------------------------------------------------------------

/**
 * The source's own literal five-row ticker (coin, price, 24h change),
 * recovered verbatim from its static HTML. Product chrome rather than
 * tenant content — no schema field carries live market data, and a real
 * deployment would wire this to a real price feed rather than a tenant's
 * CMS, so it renders unconditionally like kiln's own fixed decorative rows.
 */
export const TICKER = [
  { symbol: 'DASH', name: 'Dash', price: '$24.68', change: '+1.71%', positive: true },
  { symbol: 'XRP', name: 'XRP', price: '$2.407', change: '+1.66%', positive: true },
  { symbol: 'BTC', name: 'Bitcoin', price: '$94,595.33', change: '+1.71%', positive: true },
  { symbol: 'ETH', name: 'Ethereum', price: '$2,609.21', change: '+1.71%', positive: true },
  { symbol: 'SOL', name: 'Solana', price: '$194.46', change: '-0.65%', positive: false },
];

// ---------------------------------------------------------------------------
// Features — "DESIGNED FOR YOU" three-card grid
// ---------------------------------------------------------------------------

export const FEATURES = {
  eyebrow: 'Designed for you',
  title: 'Everything you need to manage your crypto',
  subhead: 'A secure, elegant platform for managing digital assets with confidence, from day one.',
  cta: { label: 'Get started', href: '#pricing' },
  items: [
    {
      title: 'Non-Custodial Security',
      body: 'Your keys, your crypto. Full control over your assets with no third-party risk.',
      icon: 'key-round',
      image: '/t/cryptix/images/feature-security.png',
    },
    {
      title: '15+ Supported Assets',
      body: 'Bitcoin, Ethereum, Solana and more. All your holdings in one beautiful interface.',
      icon: 'layers',
      /** This card's real visual is the live ticker above, not a photo — see TICKER. */
      image: null as string | null,
    },
    {
      title: 'Instant Transactions',
      body: 'Send and receive crypto in seconds with optimized fees and real-time notifications.',
      icon: 'zap',
      image: '/t/cryptix/images/feature-instant.png',
    },
  ],
};

// ---------------------------------------------------------------------------
// Showcase — three alternating full panels (TOTAL CONTROL / BUILT FOR SPEED /
// SECURITY FIRST), all three reusing the source's one flagship dashboard
// screenshot (confirmed by grepping the SSR HTML: the same image asset id,
// "Dashboard Cryptix 1", recurs across the hero and all three panels rather
// than each panel having its own distinct photo).
// ---------------------------------------------------------------------------

/** The panel schema.about feeds — see content.ts's adapt(). */
export const SHOWCASE_PANELS = [
  {
    eyebrow: 'Total control',
    heading: 'Your portfolio. One place.',
    body: 'Track all your crypto holdings in a single, beautifully designed dashboard. Bitcoin, Ethereum, Solana and 15+ assets, with live prices, performance charts, and more.',
    cta: { label: 'Buy crypto now', href: '#pricing' },
    image: '/t/cryptix/images/dashboard.png',
  },
  {
    eyebrow: 'Built for speed',
    heading: 'Send crypto. Instantly.',
    body: 'Transfer funds to anyone in the world in seconds. Cryptix optimizes gas fees in real time and sends you push notifications at every step of the transaction.',
    cta: { label: 'Get started', href: '#pricing' },
    image: '/t/cryptix/images/dashboard.png',
  },
  {
    eyebrow: 'Security first',
    heading: 'Bank-grade security. Zero compromises.',
    body: 'Your assets are protected by hardware-level encryption, biometric authentication, and a non-custodial architecture. Cryptix never stores your private keys. You stay in full control, always.',
    cta: { label: 'Get started', href: '#pricing' },
    image: '/t/cryptix/images/dashboard.png',
  },
];

// ---------------------------------------------------------------------------
// Steps — "HOW IT WORKS"
// ---------------------------------------------------------------------------

export const STEPS = {
  eyebrow: 'How it works',
  title: 'Three steps to get started',
  subhead: 'A simple, fast, and secure platform to manage your cryptocurrencies in just a few steps.',
  items: [
    {
      number: '1',
      title: 'Create your account',
      body: 'Sign up easily and secure your profile in just a few steps.',
      image: '/t/cryptix/images/step-1.png',
    },
    {
      number: '2',
      title: 'Fund your wallet',
      body: 'Deposit your cryptos or make a transfer to start trading.',
      image: '/t/cryptix/images/step-2.png',
    },
    {
      number: '3',
      title: 'Buy, sell, or convert',
      body: 'Enjoy a platform that makes every transaction seamless in real-time.',
      image: '/t/cryptix/images/step-3.png',
    },
  ],
};

// ---------------------------------------------------------------------------
// Benefits — "BENEFITS / Why Choose Cryptix?"
// ---------------------------------------------------------------------------

export const whyChooseHeading = (name: string) => `Why Choose ${name}?`;

export const BENEFITS = {
  eyebrow: 'Benefits',
  title: whyChooseHeading(SITE_NAME),
  subhead: 'Benefits designed to provide a seamless, secure, and accessible experience for all users.',
  items: [
    {
      title: 'Maximum Security',
      body: 'Your assets are protected with cutting-edge security protocols.',
      icon: 'shield-check',
    },
    {
      title: 'Instant Transactions',
      body: 'Execute your transactions in real-time, without delays.',
      icon: 'zap',
    },
    {
      title: 'Optimized Fees',
      body: 'Benefit from some of the lowest fees on the market.',
      icon: 'percent',
    },
    {
      title: 'Premium Interface',
      body: 'An intuitive design that’s easy to use, even for beginners.',
      icon: 'sparkles',
    },
  ],
};

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

/**
 * The source's carousel shows a "1/3" page indicator but only ever renders
 * one populated slide in its static markup — the other two slides' quotes
 * were never captured (client-side pagination state, same class of gap as
 * the FAQ's collapsed accordion answers below). Rather than inventing two
 * more testimonials this port keeps the one real quote, undecorated by a
 * fake multi-slide carousel.
 */
export const testimonialsSubhead = (name: string) =>
  `Join a growing community of investors who choose ${name} for its seamless experience, security, and premium design.`;

export const TESTIMONIALS = {
  eyebrow: 'Testimonials',
  title: 'Trusted by Crypto Enthusiasts Worldwide',
  subhead: testimonialsSubhead(SITE_NAME),
  items: [
    {
      quote:
        'Cryptix makes crypto trading effortless. Fast transactions, low fees, and a sleek interface—exactly what I needed.',
      author: 'Alex M.',
      role: 'Blockchain Analyst at NovaChain',
    },
  ],
};

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

/**
 * The source's own literal monthly prices (€0 / €12 / €39) plus its "20%
 * OFF" yearly-billing badge, with no yearly figure ever rendered in the
 * static crawl (that swap happens client-side after the Monthly/Yearly
 * toggle fires). `yearly` below is this port's own arithmetic — monthly ×
 * 0.8, rounded to the nearest euro — applying the source's own disclosed
 * discount rather than inventing an unrelated number.
 */
export const PRICING = {
  eyebrow: 'Pricing',
  title: 'Choose Your Plan. Start Trading Today.',
  subhead: 'Transparent pricing for every investor. Scale as you grow with no hidden fees or surprise charges.',
  yearlyDiscountLabel: '20% OFF',
  tiers: [
    {
      name: 'Free',
      badge: '',
      priceMonthly: '€0',
      priceYearly: '€0',
      period: '/month',
      note: 'Perfect for beginners exploring crypto trading',
      features: [
        'Trade 50+ cryptocurrencies',
        'Standard trading fees (0.8%)',
        'Basic wallet security',
        'Email support',
      ],
      includedLabel: 'Included',
      cta: { label: 'Get started', href: '#faq' },
      featured: false,
    },
    {
      name: 'Pro',
      badge: 'Popular',
      priceMonthly: '€12',
      priceYearly: '€10',
      period: '/month',
      note: 'Advanced tools for serious traders',
      features: [
        'Reduced fees (0.4% per trade)',
        'Priority transaction processing',
        'Advanced charting & indicators',
        'Portfolio analytics dashboard',
        'Staking rewards (up to 12% APY)',
        'API access for automation',
      ],
      includedLabel: 'Everything in Free, plus:',
      cta: { label: 'Get started', href: '#faq' },
      featured: true,
    },
    {
      name: 'Business',
      badge: '',
      priceMonthly: '€39',
      priceYearly: '€31',
      period: '/month',
      note: 'Built for institutions and high-volume traders',
      features: [
        'Ultra-low fees (0.1% per trade)',
        'Dedicated account manager',
        'OTC desk for large orders',
        'White-label solutions',
        'Custom API limits',
        'Multi-user team accounts',
      ],
      includedLabel: 'Everything in Pro, plus:',
      cta: { label: 'Get started', href: '#faq' },
      featured: false,
    },
  ],
};

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

/**
 * The source's accordion state was collapsed at crawl time, so only the six
 * questions were recovered verbatim — no answer text exists in the static
 * HTML for any of them. Every answer below is ORIGINAL copy written for
 * this port, sized and toned to match the rest of the page and the real
 * product facts established elsewhere on it (the 15+ assets count, the
 * non-custodial security model, the Free-plan terms) — not scraped, and
 * flagged here per this pipeline's convention for exactly this gap.
 */
export const faqHeading = (name: string) => `All you need to know about ${name}`;
export const faqQ1 = (name: string) => `What is ${name}?`;
export const faqA1 = (name: string) =>
  `${name} is a non-custodial platform for buying, selling, and managing cryptocurrency — built around one idea: your keys, your crypto, always in your control.`;
export const faqQ5 = (name: string) => `How does ${name} keep my assets safe?`;
export const faqA5 = (name: string) =>
  `${name} is non-custodial by design, so your private keys never leave your device. Hardware-level encryption and biometric authentication add another layer on top.`;

export const FAQ = {
  eyebrow: 'Common questions',
  title: faqHeading(SITE_NAME),
  subhead: "Still can't find what you're looking for?",
  items: [
    { q: faqQ1(SITE_NAME), a: faqA1(SITE_NAME) },
    {
      q: 'Which cryptocurrencies are supported?',
      a: 'Over 15 major assets today, including Bitcoin, Ethereum, Solana, XRP, and Dash — with new listings added regularly as demand grows.',
    },
    {
      q: 'How do I get started?',
      a: 'Create an account, verify your identity, and fund your wallet. Most people are trading within minutes of signing up.',
    },
    {
      q: 'Is there a free plan?',
      a: 'Yes. The Free plan lets you trade 50+ cryptocurrencies at standard fees with no monthly cost — upgrade any time as your needs grow.',
    },
    { q: faqQ5(SITE_NAME), a: faqA5(SITE_NAME) },
    {
      q: 'Can I change my plan at any time?',
      a: 'Yes — upgrade, downgrade, or cancel whenever you like. Changes take effect on your next billing cycle, with no cancellation fees.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Contact — the source's final "Ready to take control of your crypto?" CTA
// band. The source has no address, phone, or enquiry form anywhere on the
// page (a crypto exchange product, not a storefront with a location) — kept
// literal here the same way kiln's Contact band keeps only what its own
// source actually had.
// ---------------------------------------------------------------------------

export const finalCtaBody = (name: string) =>
  `Join thousands of users who trust ${name} for secure, seamless, and efficient cryptocurrency transactions.`;

export const CONTACT = {
  eyebrow: '',
  title: 'Ready to take control of your crypto?',
  subhead: finalCtaBody(SITE_NAME),
  cta: { label: 'Get started now', href: '#pricing' },
  phone: '',
  email: '',
  address: '',
  hours: '',
  showForm: false,
  formNote: '',
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export const footerTagline = (name: string) =>
  `Secure, fast, and seamless crypto trading. ${name} makes digital assets effortless.`;

export const FOOTER = {
  tagline: footerTagline(SITE_NAME),
  navTitle: 'Navigation',
  navLinks: [
    { label: `Why ${SITE_NAME}?`, href: '#features' },
    { label: 'Cryptos', href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'FAQ', href: '#faq' },
  ],
  socialsTitle: 'Socials',
  /** The year is appended at render time (see Footer.tsx), not baked in here. */
  copyright: `${SITE_NAME}. All rights reserved.`,
};
