// lib/data.ts
// Single source of truth for all copy/content on the Summit landing page.
//
// Ported from a literal SSR HTML/CSS mirror of "Aset" — a free Framer
// template by Green Yang, published on the Framer marketplace for AI-driven
// asset management, investment and robo-advisor products — rebranded here
// from "Aset" to the fictional wealth-management brand name "Summit" (a
// portfolio's own upward climb, the same growth-metaphor register as this
// library's other ports pick a one-word name from their niche). One real
// route (the Aset home page) is ported in full; it is the source's only
// page.
//
// Source: https://aset.framer.website/

// ---------------------------------------------------------------------------
// Known template fingerprints
// ---------------------------------------------------------------------------

/** The Framer marketplace listing credits "Green Yang" as the template's author. */
export const TEMPLATE_CREDIT = 'Green Yang';

/**
 * The source footer's only real social link is an "X" icon pointing to the
 * template author's own personal handle (`x.com/greeenyang`) — not a Summit
 * brand account, so it is not reused here. Its second icon's `href` is
 * literally `framer.com?via=green13` (the author's own Framer affiliate
 * link, reused as a generic "Instagram" glyph) — also not a real social
 * link, so both are kept as bare, unconfigured placeholder roots, the same
 * treatment kiln and sucre give their own sources' equivalent links.
 */
export const SOCIAL_LINKS = {
  x: 'https://x.com/',
  instagram: 'https://www.instagram.com/',
};

// ---------------------------------------------------------------------------
// Brand / nav
// ---------------------------------------------------------------------------

export const SITE_NAME = 'Summit';

/**
 * The source's own literal nav, copied verbatim — including the source's
 * own inconsistency between its nav's singular "Benefit" and its footer's
 * plural "Benefits" for the same link, both kept as found rather than
 * silently unified.
 */
export const NAV_LINKS = [
  { label: 'Home', href: '#top' },
  { label: 'Feature', href: '#features' },
  { label: 'Benefit', href: '#benefits' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'FAQ', href: '#faq' },
];

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

/**
 * The source home page's actual hero, copied verbatim: one headline, one
 * subhead, two real buttons (a filled white "Get Started" pill with an
 * arrow glyph and a translucent glass "Learn More" pill) and a social-proof
 * row — five overlapping avatar photos, a "1.2k+" count and eight fake
 * "trusted by" company wordmarks (Wealthro, Finyon, Aegra, Portivio,
 * Vaultic, Altoris, Quantora, Fundara — the source's own fictional logos,
 * not real companies, so kept as-is rather than treated as scraped content).
 * Both buttons' real `href` on the source is its own Framer affiliate link
 * (`framer.com?via=green13`) — replaced here with the page's own section
 * anchors rather than carried over, the same swap every sibling template
 * makes for a source's own promotional links.
 */
export const HERO = {
  eyebrow: '',
  titleLines: ['Empowering Your Investments with AI Technology'],
  subhead:
    'Our innovative AI technology transforms asset management by analyzing vast data sets in real-time.',
  primaryCta: { label: 'Get Started', href: '#pricing' },
  secondaryCta: { label: 'Learn More', href: '#features' },
  image: '/t/summit/images/hero-visual.png',
  trustLabel: 'Trusted by top innovative teams',
  trustCount: '1.2k+',
  trustCountLabel: 'already trust us',
  avatars: [
    '/t/summit/images/avatar-cluster-1.png',
    '/t/summit/images/avatar-cluster-2.png',
    '/t/summit/images/avatar-cluster-3.jpg',
    '/t/summit/images/avatar-cluster-4.png',
    '/t/summit/images/avatar-cluster-5.png',
  ],
  logos: ['Wealthro', 'Finyon', 'Aegra', 'Portivio', 'Vaultic', 'Altoris', 'Quantora', 'Fundara'],
};

// ---------------------------------------------------------------------------
// About — the home page's "Easier & Smarter" intro band
// ---------------------------------------------------------------------------

/**
 * The literal eyebrow, heading and one-line body that introduce the
 * four-card highlights grid below, copied verbatim.
 */
export const ABOUT = {
  eyebrow: 'Easier & Smarter',
  heading: 'Invest with Confidence. Backed by Intelligence.',
  paragraphs: [
    'This allows us to identify investment opportunities that maximize returns for our clients.',
  ],
  image: null as string | null,
};

// ---------------------------------------------------------------------------
// Highlights — the intro band's own four-card grid
// ---------------------------------------------------------------------------

/**
 * The source's own four benefit cards, copied verbatim. Only two of the
 * four carry a `data-framer-name` of "Card 2 Visual" / "Card 3 Visual" in
 * the source's compiled markup (confirmed by grepping the raw SSR HTML);
 * the other two illustrations render under the generic names "Image" and
 * no visual at all was recoverable for the remaining slot. Rather than
 * leave two cards bare, all four are paired with one of the source's own
 * real isometric illustration assets (the scattered-dots graphic, the
 * concentric-orbit graphic, the layered-percentage-cards graphic and the
 * 3D bar-chart graphic — all four pulled from elsewhere on this same page)
 * matched by which illustration best fits each card's own real copy — a
 * reasonable pick, not one verified against the source's exact per-card DOM
 * assignment, the same disclosed-but-unverified move sucre's own README
 * gives its source's home-page image assignments.
 */
export const HIGHLIGHTS = {
  items: [
    {
      title: 'Precision-Driven Portfolio Growth',
      body: 'Every move guided by data and insights for smarter portfolio growth.',
      icon: 'target',
      image: '/t/summit/images/feature-layers.png',
    },
    {
      title: 'Diversified Assets',
      body: 'Tailor your portfolio to achieve optimal performance.',
      icon: 'shuffle',
      image: '/t/summit/images/feature-scatter.png',
    },
    {
      title: 'Your Portfolio, Optimized in Real-Time',
      body: 'Adjusted instantly with market changes to enhance investment efficiency.',
      icon: 'activity',
      image: '/t/summit/images/feature-orbit.png',
    },
    {
      title: 'Maximize Returns, Minimize Effort',
      body: 'A fully automated investment system that saves you time and worry.',
      icon: 'zap',
      image: '/t/summit/images/graphic-bars.png',
    },
  ],
};

// ---------------------------------------------------------------------------
// Services — the home page's "Smarter Investing Starts Here" band
// ---------------------------------------------------------------------------

/**
 * The source's own three service cards, copied verbatim — name, one-line
 * body and a "Learn More" link each. The source shows no per-card visual or
 * price in this band (bare feature copy only), so `image`/`price` are left
 * blank rather than inventing either, and `cta` carries the source's own
 * literal "Learn More" label via this contract's own extra field (the
 * schema's `Service` has no CTA field of its own — the same move sucre's
 * own `SERVICES.items[].cta` makes for its source's "Explore all"/"Create
 * yours" card links).
 */
export const SERVICES = {
  eyebrow: 'Smarter Investing Starts Here',
  title: 'Smarter Investing Starts Here',
  subhead: '',
  items: [
    {
      number: '01',
      name: 'Transparent Performance Tracking',
      price: '',
      body: 'Monitor portfolio growth with real-time, easy-to-read analytics.',
      icon: 'line-chart',
      cta: 'Learn More',
      image: null as string | null,
    },
    {
      number: '02',
      name: 'Seamless Asset Allocation',
      price: '',
      body: 'Balance investments across asset classes for better returns.',
      icon: 'pie-chart',
      cta: 'Learn More',
      image: null as string | null,
    },
    {
      number: '03',
      name: 'Smart Risk Management',
      price: '',
      body: 'AI analyzes volatility and trends to minimize risk exposure.',
      icon: 'shield-check',
      cta: 'Learn More',
      image: null as string | null,
    },
  ],
};

// ---------------------------------------------------------------------------
// Steps — the home page's "Smarter Investing. Stronger Outcomes" band
// ---------------------------------------------------------------------------

/**
 * The source's own feature-pipeline band. Grepping its raw SSR markup for
 * this band's real `<h5>`/`<p>` pairs (rather than trusting a flattened text
 * dump, which repeats every card two or three times across the source's own
 * responsive breakpoint variants) turns up seven distinct pairs, not six:
 * "Real-Time Insights" is used twice, with two genuinely different bodies
 * ("Access blockchain data in real-time…" and "Live analytics provide
 * clarity…") — a real quirk of the source, not a crawl artifact, so both
 * are kept as their own items rather than one arbitrarily dropped. Each
 * card's own `data-framer-name` on its heading/body wrapper additionally
 * still reads a leftover CMS label from an earlier "Web3 fintech" version of
 * this same template ("Future-Forward Solutions" / "Our Web3 fintech
 * simplifies complex finance for all to access.") — the same
 * layer-keeps-its-original-name drift kiln's own hero subhead notes, not
 * used here since the source's own real rendered copy (the visible
 * `<h5>`/`<p>` text) is what a visitor actually reads.
 */
export const STEPS = {
  title: 'Smarter Investing.',
  titleLine2: 'Stronger Outcomes',
  items: [
    {
      number: '01',
      title: 'AI-Powered Strategies',
      body: 'Adaptive strategies driven by real-time machine learning.',
    },
    {
      number: '02',
      title: 'Real-Time Insights',
      body: 'Access blockchain data in real-time to make timely and informed decisions.',
    },
    {
      number: '03',
      title: 'Portfolio Optimization',
      body: 'Smart rebalancing to maximize returns and control risk effectively.',
    },
    {
      number: '04',
      title: 'Real-Time Insights',
      body: 'Live analytics provide clarity for every investment decision.',
    },
    {
      number: '05',
      title: 'Automated Execution',
      body: 'Seamless execution from signal to trade, with precision and speed.',
    },
    {
      number: '06',
      title: 'Adaptive Risk Management',
      body: 'AI models adjust exposure based on changing market dynamics and volatility.',
    },
    {
      number: '07',
      title: 'Performance Tracking',
      body: 'Monitor performance in real-time with clear metrics and visual reporting.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Stats — the home page's "Performance You Can Measure" band
// ---------------------------------------------------------------------------

/** The source's own three literal metrics, copied verbatim. */
export const STATS = {
  eyebrow: '',
  title: 'Performance You Can Measure',
  items: [
    { value: '98.7%', label: 'Client Retention Rate' },
    { value: '$250M+', label: 'Assets Managed' },
    { value: '120+', label: 'Automated Strategies' },
  ],
};

// ---------------------------------------------------------------------------
// Pricing — the home page's plan band
// ---------------------------------------------------------------------------

/**
 * The source's own two real plans, copied verbatim — including its own
 * asymmetry: the "Core Plan" lists a flat "0.4% management fee" as one of
 * four bullet features, while the featured "Vision Plan" instead opens with
 * a fee-range bullet ("0.2%–0.4% management fee") ahead of four more
 * benefits. Kept as the source's own real feature counts (four and five)
 * rather than padded to match.
 */
export const PRICING = {
  eyebrow: 'Pricing Options',
  title: 'Choose the subscription plan that suits your needs',
  tiers: [
    {
      name: 'Core Plan',
      price: '$99',
      note: 'Billed monthly',
      badge: '',
      features: ['0.4% management fee', 'AI rebalancing', 'Market insights', 'Advisor support'],
      cta: { label: 'Get Started', href: '#faq' },
      featured: false,
    },
    {
      name: 'Vision Plan',
      price: '$2,099',
      note: 'Billed monthly',
      badge: 'Best value',
      features: [
        '0.2%–0.4% management fee',
        'Advanced AI strategies',
        '2.75% cash interest',
        'Investment team access',
        'Priority support & onboarding',
      ],
      cta: { label: 'Upgrade Now', href: '#faq' },
      featured: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

/**
 * The source's own eight reviews, copied verbatim, rendered in the source as
 * a two-row looping marquee (confirmed by its repeated, tripled DOM nodes
 * carrying the same eight quotes in the same order — not eight-plus distinct
 * reviews). Each reviewer's own portrait photo is matched to their quote by
 * first-appearance order in the source's own SSR markup (the same
 * positional match sucre's own testimonial photos use) rather than a
 * per-name `data-framer-name` trace, since every avatar in this band shares
 * the same generic "Avatar" layer name.
 */
export const TESTIMONIALS = {
  eyebrow: '',
  title: 'Trusted by Forward-Thinking Investors',
  subhead: "Real stories from users who've transformed their investment experience with AI-driven insights.",
  items: [
    {
      quote:
        'The platform gave me clarity and confidence in managing my personal investments, even with limited time.',
      author: 'Olivia Bennett',
      role: 'Product Manager',
      image: '/t/summit/images/testimonial-olivia.png',
    },
    {
      quote: 'I use it daily to fine-tune portfolio strategies—it saves hours and adds accuracy.',
      author: 'Ethan Carter',
      role: 'Wealth Advisor',
      image: '/t/summit/images/testimonial-ethan.png',
    },
    {
      quote: 'As someone new to finance, I felt empowered by how intuitive and intelligent this tool is.',
      author: 'Sofia Miller',
      role: 'Freelance Designer',
      image: '/t/summit/images/testimonial-sofia.png',
    },
    {
      quote:
        'Accurate, automated, and surprisingly intuitive. This is what modern wealth management should feel like.',
      author: 'Daniel Brooks',
      role: 'Private Investor',
      image: '/t/summit/images/testimonial-daniel.png',
    },
    {
      quote: 'The AI insights helped me balance risk across both traditional and crypto assets seamlessly.',
      author: 'Marcus Reed',
      role: 'Crypto Analyst',
      image: '/t/summit/images/testimonial-marcus.png',
    },
    {
      quote: 'I appreciate the transparency—real-time tracking makes our internal reporting much easier.',
      author: 'Isabelle Turner',
      role: 'Operations Director',
      image: '/t/summit/images/testimonial-isabelle.png',
    },
    {
      quote:
        'I value the smart algorithms behind the product—finally, tech that understands the market like a human.',
      author: 'Noah Hayes',
      role: 'AI Engineer',
      image: '/t/summit/images/testimonial-noah.png',
    },
    {
      quote: "Our team uses the enterprise dashboard to monitor treasury activity—it's become essential.",
      author: 'Jenna Wallace',
      role: 'Startup Founder',
      image: '/t/summit/images/testimonial-jenna.png',
    },
  ],
};

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

/**
 * The source's own five accordion questions are all present in its SSR
 * markup, but only the first item's answer is — the other four are real
 * Framer accordions whose body paragraph mounts only once opened client-side
 * (confirmed by each item's own `data-framer-name="Closed"` wrapper), so
 * their answers never reach the page's static HTML at all. The first
 * question/answer pair below is the source's own real copy, brand name
 * templated in at render time (see content.ts); the other four answers are
 * original copy written to match this band's own tone and the specific
 * question each one asks, flagged here rather than silently invented, the
 * same disclosed gap momentum's and vaultmind's own FAQ sections give their
 * sources' equivalent collapsed answers.
 */
export const FAQ = {
  eyebrow: 'FAQ',
  title: 'FAQ',
  items: [
    {
      q: 'How is {brand} different?',
      a: "{brand} isn't just another investment platform—it's powered by real-time AI that adapts to market changes, automates your strategies, and constantly refines your portfolio. Unlike traditional tools that rely on static inputs or manual actions, {brand} helps you move faster, smarter, and with far more clarity.",
    },
    {
      q: 'Is {brand} suitable for beginners?',
      a: "Yes. Every plan opens with a short risk questionnaire and a plain-language walkthrough of what the AI is doing and why, so you're never staring at a decision you don't understand. You can start as hands-off or as hands-on as you like.",
    },
    {
      q: 'How secure is my data and portfolio on {brand}?',
      a: 'Your accounts connect through read-only, bank-grade encrypted links, and every trade the AI places still requires your account-level authorization. Nothing about your portfolio or personal data is ever sold or shared.',
    },
    {
      q: 'Can I customize my investment strategy?',
      a: 'Yes. You can set your own risk tolerance, exclude asset classes you\'d rather avoid, and weight the AI toward growth, income or a balance of both — it rebalances inside whatever boundaries you set.',
    },
    {
      q: 'What kind of assets can I manage with {brand}?',
      a: 'Equities, ETFs, bonds and cash today, with crypto and alternative assets available on the Vision plan — all tracked side by side in one portfolio view.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Contact — the source's closing "Start Investing Smarter Today" CTA band
// ---------------------------------------------------------------------------

/**
 * The source has no contact form, phone, email, address or hours anywhere
 * on the page — its home page ends in a single full-width CTA band with one
 * heading, one line of body copy and one button, all pointed at the
 * source's own Framer affiliate link. `showForm` is false for the same
 * reason kiln's own contact band gives: rendering a form here would invent
 * one the source never had.
 */
export const CONTACT = {
  eyebrow: '',
  title: 'Start Investing Smarter Today',
  subhead: 'Harness the power of AI to grow your portfolio with confidence and clarity.',
  phone: '',
  email: '',
  address: '',
  hours: '',
  showForm: false,
  formNote: '',
  cta: { label: 'Get Started', href: '#pricing' },
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export const FOOTER = {
  tagline: 'AI-driven portfolio management, built for clarity and confidence.',
  quickLinksTitle: 'Explore',
  quickLinks: NAV_LINKS,
  /** The year is appended at render time (see Footer.tsx), not baked in here. */
  copyright: 'Copyright © {brand}. All rights reserved.',
};
