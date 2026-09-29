// lib/data.ts
// Single source of truth for all copy/content on the Vantra landing page.
//
// Ported from a literal SSR HTML/CSS+JS mirror of a free Framer template
// ("FintechX", by Webestica, published on the Framer marketplace for AI
// investment/portfolio-tracking products) already rebranded, in the source
// repo this was pulled from, to the fictional neobank-adjacent fintech name
// "Vantra" — kept as this template's own slug and brand, the same one-word
// literal-name convention as natsu, kiln, folio, pearl and sucre. The
// homepage ("/") is the only route with real page content; "/pricing" and
// "/request-demo" are thin single-purpose forms the schema has no section
// for and are not ported.
//
// Source: https://fintechx-wbs.framer.website/ (rendered locally via the
// exported Next.js mirror at Amrita-FintechX-Template, branded "Vantra").
// Two routes the source's own footer links to but which carry no content —
// "Use Cases" and "Integrations" — are Framer "appear" tickers of decorative
// logo/avatar chips with nothing to localize (no headline this port owns,
// no per-tenant field to fill), so neither is ported as a section; see
// Highlights.tsx and Stats.tsx for where their real, useful copy already
// lives instead.

// ---------------------------------------------------------------------------
// Known template fingerprints
// ---------------------------------------------------------------------------

/** The Framer marketplace listing credits "Webestica" as the template's author. */
export const TEMPLATE_CREDIT = 'Webestica';

/**
 * The source footer renders four social glyphs with no visible platform
 * label and no configured handle for any of them — the same bare,
 * unconfigured placeholder situation kiln's own SOCIAL_LINKS flags, not a
 * scraped handle. Kept as '#' rather than guessing a platform.
 */
export const SOCIAL_LINKS = {
  twitter: '#',
  linkedin: '#',
  instagram: '#',
  facebook: '#',
};

// ---------------------------------------------------------------------------
// Brand / nav
// ---------------------------------------------------------------------------

export const SITE_NAME = 'Vantra';

/**
 * The source's own primary nav, minus "Use Cases" (the one entry that
 * pointed at the decorative ticker this port doesn't carry — see the file
 * banner above) and pointed at the sections this port actually renders
 * rather than the source's own anchor ids.
 */
export const NAV_LINKS = [
  { label: 'Products', href: '#top' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQs', href: '#faq' },
];

/** The source's own literal nav CTA — a pill button with an arrow badge. */
export const NAV_CTA = { label: 'Try it free', href: '#pricing' };

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

/**
 * The source's real hero: a two-line headline with a small inline "AI"
 * badge between the words (its own literal image, kept as `badge` rather
 * than redrawn as an icon font glyph), an uppercase-free prose subhead, a
 * filled primary CTA and an outlined secondary CTA, and three small trust
 * chips beneath them. No `eyebrow` — the source hero has no label chip
 * above the headline.
 */
export const HERO = {
  eyebrow: '',
  titleLines: ['Finance', 'Platform'],
  badge: '/t/vantra/icons/hero-badge.png',
  subhead:
    'Optimize your investments with AI-driven analysis, real-time tracking, and intelligent recommendations.',
  primaryCta: { label: 'Get started now', href: '#pricing' },
  secondaryCta: { label: 'View demo', href: '#' },
  trustChips: [
    { icon: '/t/vantra/icons/trust-rating.svg', label: '4.9/5 Rating' },
    { icon: '/t/vantra/icons/comparison-problem.svg', label: 'Bank-level security' },
    { icon: '/t/vantra/icons/trust-bolt.svg', label: 'Real-time AI insights' },
  ],
  image: '/t/vantra/images/hero-dashboard.jpg',
  clouds: [
    '/t/vantra/images/hero-cloud-1.png',
    '/t/vantra/images/hero-cloud-2.png',
    '/t/vantra/images/hero-cloud-3.png',
  ],
  bg: '/t/vantra/images/hero-bg.jpg',
};

// ---------------------------------------------------------------------------
// Trust ticker — the source's "Client" band
// ---------------------------------------------------------------------------

/**
 * The source's logo-cloud trust bar: one line of copy and eleven bare client
 * wordmarks with no visible names in the exported markup (Framer image
 * layers, not text) — real assets, kept as an unlabelled logo strip rather
 * than invented company names.
 */
export const TRUST = {
  label: 'Trusted by investors and financial teams',
  logos: Array.from(
    { length: 11 },
    (_, i) => `/t/vantra/icons/client-${i + 1}.svg`,
  ),
};

// ---------------------------------------------------------------------------
// Comparison — "Smarter decisions start with clear data"
// ---------------------------------------------------------------------------

/**
 * The source renders this as a Before/After toggle (one panel visible at a
 * time, swapped by a JS-only tab with no static href or fragment — nothing
 * a static port can follow). Both panels' real copy is kept, side by side
 * rather than behind a toggle this port has no interaction model for: the
 * problems list on the left, the solved state — checklist plus its two
 * stat chips — on the right. `beforeLabel`/`afterLabel` literally name the
 * brand in the source's own copy ("Before Vantra" / "After Vantra"), so
 * `adapt()` threads `SITE_NAME` through both rather than leaving "Vantra"
 * hard-coded for every tenant.
 */
export const COMPARISON = {
  eyebrow: '',
  heading: 'Smarter decisions start with clear data',
  subhead: '',
  beforeLabel: 'Before Vantra',
  afterLabel: 'After Vantra',
  beforeHeading: 'Challenges of managing investments today',
  before: [
    'Financial data is spread across platforms and is hard to understand',
    'Lack of clear direction for buy, hold, or sell decisions',
    'Tracking investments manually takes time and effort',
    'Decisions based on incomplete or outdated information',
  ],
  beforeStats: [
    { value: '68%', label: 'Financial data confusion' },
    { value: '55%', label: 'Poor data understanding' },
  ],
  beforeIcon: '/t/vantra/icons/comparison-x.svg',
  beforeImage: '/t/vantra/images/comparison-chart.png',
  afterHeading: 'Smarter way to manage your investments',
  after: [
    'Get clear recommendations based on real-time data',
    'Understand risks before making investment decisions',
    'Monitor your portfolio in real time, no manual effort required',
    'Make consistent and informed investment choices',
  ],
  afterStats: [
    { value: '3X Faster', label: 'Smart decisions' },
    { value: '24/7', label: 'Real-time tracking' },
  ],
  /** Reused across Comparison, Security and Pricing's own bullet lists —
   *  the source recolours one chevron glyph per section rather than
   *  shipping a distinct icon for each; this port keeps the one real
   *  chevron asset it exported rather than inventing per-section tints. */
  afterIcon: '/t/vantra/icons/pricing-check.svg',
};

// ---------------------------------------------------------------------------
// Highlights — "Core features"
// ---------------------------------------------------------------------------

/**
 * The source's bento feature grid: five cards, each its own size and fill
 * (light, sky-photo, near-black, sky-photo, light — kept as a per-index
 * treatment in Highlights.tsx rather than a uniform card, since a uniform
 * grid is not what the source drew). `tags` and `image` are literal,
 * per-card extras the schema's `Feature` has no field for, kept the same
 * way kiln keeps ABOUT's year chips.
 */
type HighlightItem = {
  title: string;
  body: string;
  icon: string;
  image: string | null;
  tags: string[];
};

export const HIGHLIGHTS = {
  eyebrow: 'Core features',
  title: 'Everything you need to invest confidently',
  subhead:
    'Professional tools designed for active traders and long-term investors managing diverse portfolios.',
  cta: { label: 'View all features', href: '#pricing' },
  items: [
    {
      title: 'Advanced risk analysis',
      body: '',
      icon: '/t/vantra/images/feature-1.png',
      image: null,
      tags: ['Real-time risk scoring', 'Portfolio volatility tracking', 'Predictive risk alerts'],
    },
    {
      title: 'Market insights',
      body: '',
      icon: '/t/vantra/images/feature-2.svg',
      image: '/t/vantra/images/feature-2-bg.jpg',
      tags: [],
    },
    {
      title: 'AI-powered insights',
      body: 'Real-time market data and predictive analysis.',
      icon: '',
      image: null,
      tags: [],
    },
    {
      title: 'Portfolio tracking',
      body: 'See your entire financial picture in one place with performance attribution and gain/loss analysis.',
      icon: '/t/vantra/images/feature-4.png',
      image: null,
      tags: [],
    },
    {
      title: 'Smart alerts',
      body: '',
      icon: '',
      image: null,
      tags: [],
    },
  ] as HighlightItem[],
};

// ---------------------------------------------------------------------------
// About — "Platform overview"
// ---------------------------------------------------------------------------

export const ABOUT = {
  eyebrow: 'Platform overview',
  heading: 'See your financial intelligence in action',
  body: 'Explore a real-time dashboard that brings your portfolio, insights, and risk analysis together in one clear view.',
  cta: { label: 'Explore features', href: '#features' },
  secondaryCta: { label: 'Try the live demo', href: '#' },
  image: '/t/vantra/images/overview-dashboard.jpg',
  bg: '/t/vantra/images/overview-bg.jpg',
  stats: [
    {
      value: 'All your work in one place',
      label:
        'Bring all your tasks, projects, and updates together in one clear, unified view.',
    },
    {
      value: 'Make progress faster',
      label: 'Access key insights instantly and act without delays or unnecessary steps.',
    },
    {
      value: 'Built for better focus',
      label: 'A clean interface that helps you stay focused and keep everything simple.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Steps — "How it works"
// ---------------------------------------------------------------------------

/**
 * The source renders these three steps behind a click-to-switch tab (only
 * one step's detail panel visible at a time). Ported here as three static
 * cards rather than reproducing the tab state machine — the same call
 * kiln's Reveal note and every sibling's own "hand-matched, not literally
 * ported" comments make for JS-only interaction with no static fallback.
 */
export const STEPS = {
  eyebrow: 'How it works',
  title: 'Start investing in minutes',
  subhead: 'Connect your accounts, let AI analyze your data, and get clear insights to invest with confidence.',
  stats: [
    { value: '100%', label: 'Secure, encrypted data protection' },
    { value: '2 Minutes', label: 'Set up to connect and begin instantly' },
  ],
  items: [
    {
      number: '01',
      title: 'Connect your accounts',
      body: 'Securely link your bank, brokerage, and investment accounts in a few clicks.',
    },
    {
      number: '02',
      title: 'Analyze your data',
      body: 'AI processes your data to generate clear insights.',
    },
    {
      number: '03',
      title: 'Get smart insights',
      body: 'Receive real-time recommendations to optimize your portfolio.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Security & compliance
// ---------------------------------------------------------------------------

/**
 * The source's security band: one illustration, a heading, a CTA, and a
 * four-line checklist. Not part of the shared schema — no tenant field maps
 * to "our compliance posture" — so it stays the source's own literal copy,
 * the same static-band treatment kiln gives its own ABOUT year chips.
 */
export const SECURITY = {
  eyebrow: 'Security & compliance',
  heading: 'Your data is protected at every level',
  cta: { label: 'Get started now', href: '#pricing' },
  items: [
    'End-to-end encryption',
    'Secure data infrastructure',
    'Privacy-first approach',
    'Compliance standards',
  ],
  /** Same reused chevron as Comparison's "after" list — see its own note. */
  icon: '/t/vantra/icons/pricing-check.svg',
  image: '/t/vantra/images/security.png',
};

// ---------------------------------------------------------------------------
// Stats — "Platform stats"
// ---------------------------------------------------------------------------

/**
 * Five bento cards, each its own fill (light / dark / dark / accent / light
 * in the source's own layout) — kept as a per-index treatment in Stats.tsx,
 * the same reasoning as Highlights.
 */
export const STATS = {
  eyebrow: 'Platform stats',
  title: 'Powering smarter investment decisions',
  subhead: 'Real-time insights, advanced analytics, and secure infrastructure working together.',
  items: [
    {
      value: '10,000+',
      label: 'Active investors',
      body: 'Users managing portfolios with AI insights.',
      icon: '/t/vantra/icons/stat-1.svg',
    },
    {
      value: '$250M+',
      label: 'Assets tracked',
      body: 'In investments monitored across the platform.',
      icon: '/t/vantra/icons/stat-4.svg',
    },
    {
      value: '1M+',
      label: 'AI insights generated',
      body: 'Data-driven signals delivered every month.',
      icon: '/t/vantra/icons/stat-5.svg',
    },
    {
      value: '120+',
      label: 'Markets covered',
      body: 'Global financial markets are analyzed in real time.',
      icon: '/t/vantra/icons/stat-3.svg',
    },
    {
      value: '99.9%',
      label: 'Platform uptime',
      body: 'Reliable access to your financial intelligence.',
      icon: '/t/vantra/icons/stat-2.svg',
    },
  ],
};

// ---------------------------------------------------------------------------
// Testimonials — "What investors say about the platform"
// ---------------------------------------------------------------------------

export const TESTIMONIALS = {
  eyebrow: '',
  title: 'What investors say about the platform',
  subhead: '',
  trustChips: [
    { icon: '/t/vantra/icons/comparison-problem.svg', label: '4.9/5 Rating' },
    { icon: '/t/vantra/icons/security-1.svg', label: '75+ Testimonials' },
    { icon: '/t/vantra/icons/security-2.svg', label: '10K+ Growth community' },
  ],
  cta: { label: 'Get started today', href: '#pricing' },
  bg: '/t/vantra/images/testimonial-bg.jpg',
  items: [
    {
      quote:
        "This platform helped me understand my portfolio in ways I couldn't before. The insights are clear and actually useful.",
      author: 'David Miller',
      role: 'Individual Investor',
      image: '/t/vantra/images/avatar-1.jpg',
    },
    {
      quote:
        'Managing multiple portfolios is much easier now. The risk analysis tools save us hours every week.',
      author: 'Sarah Thompson',
      role: 'Wealth Manager',
      image: '/t/vantra/images/avatar-3.jpg',
    },
    {
      quote:
        "The real-time insights and alerts help me react faster to market changes. It's become part of my daily workflow.",
      author: 'Michael Chen',
      role: 'Active Trader',
      image: '/t/vantra/images/avatar-4.jpg',
    },
    {
      quote:
        'The data visualization and analytics tools make complex financial information far easier to interpret.',
      author: 'Emily Rodriguez',
      role: 'Financial Analyst',
      image: '/t/vantra/images/avatar-2.jpg',
    },
    {
      quote:
        'The insights are clear and actionable. It helps me track performance and make better investment decisions every day.',
      author: 'Daniel Carter',
      role: 'Portfolio Manager',
      image: '/t/vantra/images/avatar-6.jpg',
    },
  ],
};

// ---------------------------------------------------------------------------
// Pricing — "Transparent pricing without hidden fees"
// ---------------------------------------------------------------------------

/**
 * The source's own two published tiers plus its "talk to sales" enterprise
 * banner. `note` carries the literal "/month" unit the source renders next
 * to the bare digit price rather than folding it into `price` itself, so a
 * tenant's own numeral still reads correctly next to it.
 */
export const PRICING = {
  eyebrow: 'Subscription plans',
  title: 'Transparent pricing without hidden fees',
  subhead: '',
  billingNote: '7-day free trial available · No credit card required · Cancel anytime',
  tiers: [
    {
      name: 'Starter plan',
      note: 'Best for individual investors',
      price: '$19',
      priceSuffix: '/month',
      cta: { label: 'Get started', href: '#' },
      featured: false,
      features: [
        'Connect up to 5 investment accounts',
        'Portfolio performance tracking',
        'Basic AI insights',
        'Market updates & alerts',
        'Real-time price alerts',
        'Email support',
      ],
    },
    {
      name: 'Pro plan',
      note: 'Best for active investors',
      price: '$39',
      priceSuffix: '/month',
      badge: 'Popular',
      cta: { label: 'Get started', href: '#' },
      featured: true,
      features: [
        'Unlimited account connections',
        'Advanced AI investment insights',
        'Portfolio risk analysis',
        'Smart alerts & automation',
        'Historical performance analytics',
        'Priority support',
      ],
    },
  ],
  enterprise: {
    title: 'Enterprise plan',
    body: 'Need a custom solution for your organization? Talk with our team to design a plan for your needs.',
    cta: { label: 'Contact sales', href: '#' },
    image: '/t/vantra/images/pricing-enterprise-bg.png',
  },
};

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

export const FAQ = {
  eyebrow: '',
  title: 'Frequently asked questions',
  subhead: 'Find quick answers to common questions about the platform, pricing, and security.',
  stillHaveQuestions: {
    heading: 'Still have questions?',
    body: 'Reach out, and our team will guide you.',
    cta: { label: 'Talk to our team', href: '#' },
    avatars: [
      '/t/vantra/images/avatar-5.jpg',
      '/t/vantra/images/avatar-6.jpg',
      '/t/vantra/images/avatar-2.jpg',
    ],
  },
  items: [
    {
      q: 'How secure is my financial data?',
      a: 'Your data is protected with industry-standard encryption and secure infrastructure. We follow strict security practices to ensure your financial information remains private and safe.',
    },
    {
      q: 'Can I connect multiple investment accounts?',
      a: 'Yes. You can securely connect multiple bank, trading, and investment accounts to track everything in one unified dashboard.',
    },
    {
      q: 'How do the AI insights work?',
      a: 'Our AI analyzes market trends, portfolio performance, and risk signals to generate insights that help you make smarter investment decisions.',
    },
    {
      q: 'Is a trial available before subscribing?',
      a: 'Yes. You can explore the platform with a trial period to understand how the features work before choosing a paid plan.',
    },
    {
      q: 'Do you offer plans for financial teams or organizations?',
      a: 'Yes. We offer enterprise solutions designed for financial teams and institutions. You can contact our sales team to discuss custom requirements.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Contact / final CTA — the footer's own "Ready to invest smarter?" band
// ---------------------------------------------------------------------------

/**
 * The source has no embedded contact/enquiry form anywhere on the home
 * page — every "get in touch" action is a link to a separate `/contact` or
 * `/request-demo` page this contract has no route for. `showForm` is false
 * for the same reason kiln's is: rendering a form here would invent one the
 * source never had.
 */
export const CONTACT = {
  eyebrow: '',
  title: 'Ready to invest smarter?',
  subhead:
    'Join investors using AI insights and real-time data to track portfolios and make better financial decisions.',
  primaryCta: { label: 'Start free trial', href: '#pricing' },
  secondaryCta: { label: 'Try the live demo', href: '#' },
  phone: '',
  email: 'support@yourbrand.com',
  address: '',
  hours: '',
  showForm: false,
  formNote: '',
  bg: '/t/vantra/images/footer-bg.jpg',
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export const FOOTER = {
  tagline: 'A modern platform for smarter portfolio tracking and financial insights.',
  quickLinksTitle: 'Quick links',
  quickLinks: [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQs', href: '#faq' },
  ],
  /** The year is appended at render time (see Footer.tsx), not baked in here. */
  copyright: 'Vantra. All rights reserved.',
};
