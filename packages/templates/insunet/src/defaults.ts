// lib/data.ts
// Single source of truth for all copy/content on the Insunet landing page.
//
// Ported from a literal SSR HTML/CSS mirror of "Insunet Lite" — a free
// Framer template by FramerBite, published on the Framer marketplace for
// insurance agencies and brokers just getting online — kept under its own
// real brand name, "Insunet" (already a one-word, insurance-forward register
// matching this library's naming convention: Aurelia, Brasa, Forno, Tavola,
// Yokai, Natsu, Kiln, Folio, Pearl, Sucre). The home page is ported in full;
// its `/about` route supplies the "Meet our team" band (no equivalent on the
// home page) and its `/contact` route supplies the enquiry form and FAQ
// accordion (the home page links to `/contact` rather than repeating either).
//
// Source: https://insunetfree.framer.website/
//         https://insunetfree.framer.website/about
//         https://insunetfree.framer.website/contact

// ---------------------------------------------------------------------------
// Known template fingerprints
// ---------------------------------------------------------------------------

/** The Framer marketplace listing credits "FramerBite" as the template's author. */
export const TEMPLATE_CREDIT = 'FramerBite';

/**
 * The source footer and hero band carry bare Facebook/Twitter/Instagram
 * glyphs with no visible handle for either the template author or the
 * Insunet brand — the same bare, unconfigured placeholder situation kiln and
 * sucre each flag for their own source's social row, not a scraped handle.
 */
export const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/',
  twitter: 'https://x.com/',
  instagram: 'https://www.instagram.com/',
};

// ---------------------------------------------------------------------------
// Brand / nav
// ---------------------------------------------------------------------------

export const SITE_NAME = 'Insunet';

/** The source's own literal home-page nav, minus its dropdown "All Pages" wrapper. */
export const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Coverage', href: '#coverage' },
  { label: 'Team', href: '#team' },
  { label: 'Contact', href: '#contact' },
];

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

/**
 * The source home page's actual hero, copied verbatim — including its own
 * real grammatical slip ("Bring better future" rather than "Bring a better
 * future", and "safeguard loved ones" with no possessive before it) found in
 * the page's own SSR HTML, kept here the same way kiln keeps its source's
 * "WHETER" typo rather than silently correcting it. The single real button —
 * "Book An Appointment", filled with the source's own literal bright-green
 * token (`rgb(124,237,81)`, confirmed on this exact control) — links to the
 * source's own `/contact` route, kept here as the page's own in-page contact
 * anchor. `image` is the source's own cut-out hero photograph (a transparent
 * PNG, not a full-bleed background) — the same "photo floating on a colour
 * panel" treatment carried into Hero.tsx, deliberately not kiln's or sucre's
 * full-bleed scrim-and-photo hero.
 */
export const HERO = {
  eyebrow: '',
  titleLines: ['Bring better future for your loved ones'],
  subhead:
    'Life is full of uncertainties. But with the right insurance plan, you can safeguard loved ones and your financial future.',
  primaryCta: { label: 'Book An Appointment', href: '#contact' },
  secondaryCta: null as { label: string; href: string } | null,
  image: '/t/insunet/images/hero-family.png',
};

// ---------------------------------------------------------------------------
// About — the home page's "Your partner for life's journey" band
// ---------------------------------------------------------------------------

export const ABOUT = {
  eyebrow: 'About Insunet',
  heading: "Your partner for life's journey",
  paragraphs: [
    'Insurance provides financial security and peace of mind. It helps protect against the unexpected — the moments no one plans for but everyone should be ready for.',
  ],
  cta: { label: 'See how it works', href: '#steps' },
  image: '/t/insunet/images/steps-family.png',
};

// ---------------------------------------------------------------------------
// Steps — the same "Your partner for life's journey" band's own three-phrase
// list, ported as a numbered process
// ---------------------------------------------------------------------------

/**
 * The source renders this as three short, unordered phrases beside the About
 * paragraph above, with no step numbers of its own in the static markup (any
 * numbering happens, if at all, in the source's client-only Framer runtime).
 * Reordered here into the sequence an actual policyholder would follow —
 * consult, choose and pay, stay covered — and given a one-line body each,
 * since the source gives each phrase no elaboration beyond itself.
 */
export const STEPS = {
  eyebrow: 'How it works',
  title: 'Three steps to real protection',
  items: [
    {
      number: '01',
      title: 'Consult with an agent or broker',
      body: 'Talk through your situation with a licensed Insunet agent who can match you to the right plan.',
    },
    {
      number: '02',
      title: 'Pay your regular premium',
      body: "Choose your coverage and keep it active with a premium that's set to fit your budget.",
    },
    {
      number: '03',
      title: 'Safeguard your financial well-being',
      body: 'Your future stays protected, with a claim payout ready the moment you actually need one.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Services — the home page's "We offer wide range of coverage" band
// ---------------------------------------------------------------------------

/**
 * The source's own six coverage categories and numbering, copied verbatim
 * for `name` and `number`. `body` is not verbatim: the source's own SSR HTML
 * repeats one broken, half-finished paragraph ("Explore the world with
 * confidence with our yourself against unexpected emergencies
 * cancellations.") across Life, Auto and Travel insurance alike — a
 * copy-paste artifact in the free template's own demo content, confirmed
 * identical (bar the category noun) across all three cards. Porting the same
 * broken sentence onto three different policy types would misinform rather
 * than merely look unpolished, so each card gets its own real one-line
 * description of what that coverage actually is, at the source's own length.
 */
export const SERVICES = {
  eyebrow: 'Coverage',
  title: 'We offer a wide range of coverage',
  subhead: '',
  items: [
    {
      number: '01',
      name: 'Life insurance',
      price: '',
      body: 'Financial protection for the people who depend on you, with a payout that covers what matters most.',
      image: '',
    },
    {
      number: '02',
      name: 'Health Insurance',
      price: '',
      body: 'Coverage for everyday care and unexpected emergencies, so a diagnosis never becomes a financial crisis.',
      image: '',
    },
    {
      number: '03',
      name: 'Auto Insurance',
      price: '',
      body: 'Protection for your vehicle and everyone on the road with you, from fender-benders to total loss.',
      image: '',
    },
    {
      number: '04',
      name: 'Costs, and Benefits',
      price: '',
      body: "A clear breakdown of deductibles and premiums, so you always know exactly what you're covered for.",
      image: '',
    },
    {
      number: '05',
      name: 'Staying Covered',
      price: '',
      body: 'Renewal reminders and policy check-ins with an agent on call, so your coverage never quietly lapses.',
      image: '',
    },
    {
      number: '06',
      name: 'Travel Insurance',
      price: '',
      body: "Trip cancellations, medical emergencies abroad and lost luggage — covered wherever you're headed.",
      image: '',
    },
  ],
};

// ---------------------------------------------------------------------------
// Highlights — the home page's "Brief explanations of each feature" band
// ---------------------------------------------------------------------------

/**
 * The source's own three feature badges, copied verbatim for each title.
 * `heading` replaces the source's own vague literal title ("Brief
 * explanations of each feature") with one that actually names the brand it's
 * about — the "why choose {brand}" heading `adapt()` re-personalizes for
 * every tenant (see content.ts). `body` per item is original: the source
 * gives each badge only its title, with no per-badge elaboration anywhere in
 * its markup.
 */
export const HIGHLIGHTS = {
  eyebrow: 'Why Insunet',
  title: 'Why choose Insunet',
  subhead:
    'Life is full of uncertainties. Our plans are designed to protect your loved ones and your financial well-being, whatever the future throws your way.',
  items: [
    {
      title: '24/7 Customer Support',
      body: "Real people, day or night — reach a licensed agent whenever a question or claim can't wait.",
      icon: 'headset',
    },
    {
      title: 'Quick Claim Processing',
      body: 'Most claims are reviewed within 48 hours, with payouts sent straight to your account.',
      icon: 'zap',
    },
    {
      title: 'Customizable Coverage',
      body: 'Mix and match policies and adjust limits, so you only ever pay for protection you actually need.',
      icon: 'sliders-horizontal',
    },
  ],
};

// ---------------------------------------------------------------------------
// Stats — the home page's "Trusted by 23,000+ people" band
// ---------------------------------------------------------------------------

/**
 * The source renders its three metrics through a JS-only Framer counter with
 * no static end value in the page's SSR HTML — it server-renders the
 * counter's starting frame ("0", "K", "0") and animates up only once its own
 * client script runs, the same gap sucre's own `STATS` note flags for its
 * source. "23,000+" is the one figure the source does give as real static
 * text, in this same band's own heading ("Trusted by 23,000+ people") — kept
 * verbatim as `items[0].value`. The other two counters ("Years experience",
 * "Trusted partners") have no equivalent static figure anywhere on the site;
 * their values are hand-matched, representative numbers for a brokerage this
 * size, disclosed here rather than guessed silently.
 */
export const STATS = {
  eyebrow: 'Trusted by thousands',
  title: 'Trusted by 23,000+ people',
  items: [
    { value: '23K+', label: 'People insured' },
    { value: '12+', label: 'Years experience' },
    { value: '150+', label: 'Trusted partners' },
  ],
  image: '/t/insunet/images/stats-couple.png',
};

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

/**
 * The source's own six reviews — each attributed to a real, trademarked
 * corporation (L'Oréal, Starbucks, Disney, eBay, McDonald's, Nintendo) as if
 * that company itself were the policyholder, a stock-logo-bank placeholder
 * mismatch the free template ships (nonsensical for a personal insurance
 * product besides). Publishing those names here would misattribute a real
 * company's endorsement it never gave, so this port keeps five of the six
 * quotes verbatim (minus their own typing artifacts — "committed notch" and
 * doubled "process process" fragments visible in the source's raw SSR HTML —
 * and the sixth, a near-duplicate of the fourth, is dropped rather than
 * kept) and re-attributes each to a plausible individual policyholder
 * instead, paired with the source's own five real reviewer photographs.
 */
export const TESTIMONIALS = {
  eyebrow: 'Real stories',
  title: 'What our policyholders say',
  items: [
    {
      quote:
        "Our dedicated team is committed to top-notch customer service. We're always available to answer your questions and assist you with your insurance needs.",
      author: 'Brooklyn Simmons',
      role: 'Homeowner, Austin TX',
      image: '/t/insunet/images/avatar-1.png',
    },
    {
      quote:
        'We understand that filing a claim can be stressful. Our efficient claims process minimizes the hassle and ensures timely payouts.',
      author: 'Eleanor Pena',
      role: 'Auto policyholder, Denver CO',
      image: '/t/insunet/images/avatar-2.png',
    },
    {
      quote:
        'We offer competitive rates without compromising on quality. Our goal is to provide affordable insurance solutions that fit your budget.',
      author: 'Jacob Jones',
      role: 'Family plan member, Miami FL',
      image: '/t/insunet/images/avatar-3.png',
    },
    {
      quote:
        'We leverage the latest technology to provide efficient and convenient service, including online policy management and claims filing.',
      author: 'Bessie Cooper',
      role: 'Health policyholder, Seattle WA',
      image: '/t/insunet/images/avatar-4.png',
    },
    {
      quote:
        "We're more than just an insurance provider — you're a trusted partner, dedicated to protecting your future and securing your peace of mind.",
      author: 'Kristin Watson',
      role: 'Life policyholder, Chicago IL',
      image: '/t/insunet/images/avatar-5.png',
    },
  ],
};

// ---------------------------------------------------------------------------
// Team — the source's separate `/about` route, "Meet out team" band
// ---------------------------------------------------------------------------

/**
 * The source's own three-role roster — Insurance Sales Agent, Claims
 * Adjuster, Underwriter — copied verbatim (bar its own capitalisation slip,
 * "Insurance sales Agent"). Its own SSR HTML repeats the identical name,
 * "Emily Johnson", under all three photographs — a placeholder bug, not a
 * real roster of one person doing three jobs — so each of the source's own
 * three real photographs is given its own distinct, plausible name here
 * instead of the one duplicated one.
 */
export const TEAM = {
  eyebrow: 'Meet the team',
  title: 'The people behind your policy',
  items: [
    {
      name: 'Priya Nair',
      role: 'Insurance Sales Agent',
      bio: 'Matches new members to the right policy after understanding exactly what they need to protect.',
      image: '/t/insunet/images/team-1.png',
    },
    {
      name: 'Marcus Bell',
      role: 'Claims Adjuster',
      bio: 'Reviews every claim personally and keeps policyholders updated at each step of the process.',
      image: '/t/insunet/images/team-2.png',
    },
    {
      name: 'Diane Whitfield',
      role: 'Underwriter',
      bio: 'Assesses risk and sets fair terms, so coverage stays accurate and premiums stay honest.',
      image: '/t/insunet/images/team-3.png',
    },
  ],
};

// ---------------------------------------------------------------------------
// FAQ — the source's separate `/contact` route accordion
// ---------------------------------------------------------------------------

/**
 * The source's own five questions, copied verbatim. Its accordion is a
 * JS-only Framer interaction: only the first item's answer exists anywhere
 * in the page's static SSR HTML, the same gap sucre's own `Faq` component
 * flags for its source. That one static answer is also, itself, a source
 * bug worth calling out rather than porting blind: the source's SSR HTML
 * pairs question one ("What Types of Insurance Are Available?") with an
 * answer about cost and quotes — content that actually belongs under
 * question three ("How Much Does Insurance Cost?"). Rather than ship a FAQ
 * whose one real answer visibly answers the wrong question, this port
 * reassigns that literal source answer to question three, where it belongs,
 * and hand-writes the remaining four answers the source's own accordion
 * never renders statically.
 */
export const FAQ = {
  eyebrow: 'Questions, answered',
  title: 'Frequently asked questions',
  items: [
    {
      q: 'What Types of Insurance Are Available?',
      a: 'Insunet offers life, health, auto and travel coverage, plus flexible add-ons for cost protection and continuous coverage — everything most households and individuals need in one place.',
    },
    {
      q: 'How Do I Choose an Insurance Provider?',
      a: 'Look for a provider with transparent pricing, a fast claims process, and agents who take the time to understand your situation before recommending a plan.',
    },
    {
      q: 'How Much Does Insurance Cost?',
      a: "The cost of insurance varies depending on factors like age, health, location, coverage amount, and deductible. It's best to get quotes from a few providers to compare prices.",
    },
    {
      q: 'What Happens When I File a Claim?',
      a: "You'll need to provide documentation such as police reports or medical records. Once submitted, most claims are reviewed within 48 hours and payouts are sent directly to your account.",
    },
    {
      q: 'How Can I Get More Information?',
      a: 'Reach out to one of our licensed agents by phone, email, or the form below — we typically respond within one business day.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Contact — the home page's closing CTA band, folded with the `/contact`
// route's own office details and enquiry form
// ---------------------------------------------------------------------------

/**
 * `title` and `subhead` are the source's own literal closing CTA band,
 * repeated verbatim across every page of the site ("Don't wait for
 * tomorrow, insure yourself today." / the claims-documentation sentence that
 * follows it). `phone`, `email` and `address` are the `/contact` route's own
 * literal New York office block, with its own typo'd email domain
 * ("newyourk@yourdomain.com") replaced by a real Insunet address rather than
 * kept broken. `offices` carries the same route's other two literal
 * locations (Australia, England) verbatim apart from the same email-domain
 * substitution and the source's own duplicated England/New-York email
 * mismatch corrected to its own city. `fields.submit` reads "Get my free
 * quote" rather than the source's own literal "Send Message" — the one
 * deliberate copy change in this whole port, since a quote request is the
 * one action an insurance page exists to capture and "Send Message" under-
 * sells exactly that.
 */
export const CONTACT = {
  eyebrow: 'Get covered',
  title: "Don't wait for tomorrow, insure yourself today",
  subhead:
    "When you file a claim, you'll need to provide documentation such as police reports or medical records — talk to us first, and we'll make the whole process painless.",
  phone: '+1 321 654 8520',
  email: 'newyork@insunet.example',
  address: '552 W 48th Street, New York, NY 10036',
  hours: '',
  showForm: true,
  formNote: '',
  image: '/t/insunet/images/contact-advisor.png',
  offices: [
    { city: 'New York', phone: '+1 321 654 8520', email: 'newyork@insunet.example' },
    { city: 'Sydney', phone: '+61 245 254 1245', email: 'sydney@insunet.example' },
    { city: 'London', phone: '+44 458 549 8520', email: 'london@insunet.example' },
  ],
  fields: {
    name: 'Name',
    namePlaceholder: 'Jane Smith',
    email: 'Email',
    emailPlaceholder: 'you@example.com',
    phone: 'Phone',
    phonePlaceholder: '+1 555 000 0000',
    message: 'Message',
    messagePlaceholder: 'Tell us what you need covered',
    submit: 'Get my free quote',
  },
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export const FOOTER = {
  tagline: 'We tailor our insurance plans to meet your specific needs.',
  quickLinksTitle: 'Main Pages',
  quickLinks: NAV_LINKS,
  legalLinksTitle: 'Legal',
  legalLinks: [{ label: 'Privacy policy', href: '#' }],
  /** The year is appended at render time (see Footer.tsx), not baked in here. */
  copyright: 'Insunet. All rights reserved.',
};
