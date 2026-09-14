// lib/data.ts
// Single source of truth for all copy/content on the Momentum Fit landing page.

// ---------------------------------------------------------------------------
// Known template fingerprints (see BUILD_BRIEF.md "Known template fingerprints")
// ---------------------------------------------------------------------------

/**
 * Original template credit — confirm with the site owner whether to keep,
 * replace, or remove. Kept from the live source template's footer
 * ("Design by Prasidh Nishchal").
 */
export const TEMPLATE_CREDIT = "Prasidh Nishchal";

/**
 * Placeholder booking / scheduling link. Every "Get Started", "Book a
 * Session" and "Join the program" CTA on the source template points at this
 * bare, unconfigured cal.com URL — it is NOT a real booking page. Replace
 * with the real Cal.com (or other scheduler) link before launch.
 */
export const BOOKING_URL = "https://cal.com";

/**
 * Social links row (footer + nav). All three are bare, unconfigured
 * placeholders in the source template ("https://www.facebook.com/",
 * "https://www.instagram.com/", "https://x.com/") and go nowhere useful.
 * Note: the source also links one nav element to
 * "https://x.com/NishchalPr65627", which is the template author's personal
 * X account, not the site's own — that URL is intentionally NOT reused here.
 * Replace all three with the real social profile URLs before launch.
 */
export const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/",
  instagram: "https://www.instagram.com/",
  x: "https://x.com/",
};

// ---------------------------------------------------------------------------
// Brand / nav
// ---------------------------------------------------------------------------

export const SITE_NAME = "Forgewell";

export const NAV_LINKS = [
  { label: "Home", href: "#hero-section" },
  { label: "About me", href: "#about-me" },
  { label: "Programs", href: "#services" },
  { label: "Pricing", href: "#pricing" },
  { label: "Results", href: "#results" },
];

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export const HERO = {
  eyebrow: "Personal Coach",
  titleLines: ["Rebuild", "Yourself.", "One Rep at a Time."],
  subhead:
    "Personalized coaching to help you build strength, break plateaus, and become the strongest version of yourself.",
  cta: "Get Started",
  testimonial: {
    quote:
      "I've tried coaches before, but this was different. Structured plans, real accountability, and someone who actually pushed me when I needed it.",
    name: "Sheena Maliwal",
    role: "Fitness Influencer",
    avatar: "/t/momentum/images/hero-testimonial-avatar.jpg",
  },
  videoPoster: "/t/momentum/images/hero-video-poster.png",
};

export const STATS = [
  { value: 250, suffix: "+", label: "Clients Trained" },
  { value: 8, suffix: "+", label: "Years exp." },
  { value: 99, suffix: "%", label: "Satisfaction" },
  { value: 50, suffix: "+", label: "Client Reviews" },
];

// ---------------------------------------------------------------------------
// About / Trainer
// ---------------------------------------------------------------------------

export const ABOUT = {
  eyebrow: "Meet your Trainer",
  name: "Marcus Bennett",
  title: "Certified Strength & Conditioning Coach",
  paragraphs: [
    "For over 8 years, I've helped everyday people — not just athletes — build real, lasting strength. My approach is about understanding your body, your history, and your goals, then building a plan around you.",
    "I got into coaching after my own transformation — going from someone who dreaded the gym to someone who couldn't imagine life without it. That shift taught me discipline isn't about motivation, it's about systems. That's what I bring to every client: structure, accountability, and a plan that actually adapts as you progress.",
  ],
  cta: "Book a Session",
  photo: "/t/momentum/images/trainer-marcus-bennett.png",
};

// ---------------------------------------------------------------------------
// Why Momentum (feature cards)
// ---------------------------------------------------------------------------

export const WHY_MOMENTUM = {
  eyebrow: "Why Forgewell",
  title: "Coaching That Actually Adapts to You",
  subhead:
    "Everything you need to train smarter, stay consistent, and see real results.",
  features: [
    {
      title: "Personalized training built around your body",
      image: "/t/momentum/images/feature-personalized-training.png",
      callout: { value: "3x", label: "faster progress with structured 1:1 coaching" },
    },
    {
      title: "Recovery and nutrition that keeps you consistent",
      image: "/t/momentum/images/feature-recovery-nutrition.png",
      callout: null,
    },
    {
      title: "Consistent accountability that keeps you showing up",
      image: "/t/momentum/images/feature-accountability.png",
      callout: null,
    },
  ],
};

// ---------------------------------------------------------------------------
// Services / Programs
// ---------------------------------------------------------------------------

export const SERVICES = {
  eyebrow: "Our Programs",
  title: "Everything You Need to Reach Your Goal",
  subhead:
    "No generic plans. Every program is built around your body, your schedule, and the results you're actually chasing.",
  cta: "Get Started",
  programs: [
    {
      title: "1:1 Personal Coaching",
      subtitle: "Personalized Training Plans",
      image: "/t/momentum/images/service-1on1-coaching.png",
      bullets: [
        "Custom program built around your goals",
        "Weekly check-ins and progress tracking",
        "Direct access to your coach, anytime",
      ],
    },
    {
      title: "Online Coaching",
      subtitle: "Train Anywhere, Stay Accountable",
      image: "/t/momentum/images/service-online-coaching.png",
      bullets: [
        "Remote programming, updated weekly",
        "Form checks via video review",
        "Full access through the mobile app",
      ],
    },
    {
      title: "Nutrition Coaching",
      subtitle: "Nutrition Built for Real Life",
      image: "/t/momentum/images/service-nutrition-coaching.png",
      bullets: [
        "Macro plans that fit your lifestyle",
        "No extreme diets, no restriction",
        "Adjusted monthly as you progress",
      ],
    },
    {
      title: "Group Training",
      subtitle: "Train With Energy, Not Alone",
      image: "/t/momentum/images/service-group-training.png",
      bullets: [
        "Small-group sessions, individual attention",
        "Shared accountability, real motivation",
        "Flexible scheduling, multiple sessions weekly",
      ],
    },
    {
      title: "Transformation Package",
      subtitle: "The Full Transformation System",
      image: "/t/momentum/images/service-transformation-package.png",
      bullets: [
        "Training + nutrition + weekly coaching calls",
        "Priority support and plan adjustments",
        "Built for serious, long-term results",
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// How It Works
// ---------------------------------------------------------------------------

export const HOW_IT_WORKS = {
  eyebrow: "How It Works",
  title: "Your Path to Real Results",
  subhead:
    "From your first consultation to your biggest milestone — here's exactly how we get you there.",
  cta: "Get Started",
  steps: [
    {
      number: "01",
      title: "Book a Free Consultation",
      description: "Tell us your goals, your schedule, and where you're starting from",
    },
    {
      number: "02",
      title: "Get Your Custom Plan",
      description: "A training and nutrition plan built specifically around you",
    },
    {
      number: "03",
      title: "Train & Track Progress",
      description: "Weekly check-ins, form reviews, and real accountability",
    },
    {
      number: "04",
      title: "Level Up",
      description: "Once you hit your goal, we'll push for the next level",
    },
    {
      number: "05",
      title: "See Real Results",
      description: "Consistent progress, adjusted every step of the way",
    },
  ],
  midCta: {
    title: "Start Your Fitness Journey Now",
    subtitle: "Book your Free Consultation",
    image: "/t/momentum/images/how-it-works-results.png",
  },
};

// ---------------------------------------------------------------------------
// Results / Testimonials
// ---------------------------------------------------------------------------

export const RESULTS = {
  eyebrow: "Real Transformations",
  title: "Results That Speak for Themselves",
  subhead:
    "Every client's journey is different — but the discipline, structure, and support stay the same.",
  testimonials: [
    {
      name: "Sarah",
      program: "1:1 Coaching",
      duration: "18 Months",
      quote:
        "Marcus took my lifting to a new level. I wasn't sure how much progress I had left, but with structured programming and feedback, I broke through plateaus and moved into powerlifting. My strength and confidence grew, and my training finally had direction.",
      before: "/t/momentum/images/before-sarah.png",
      after: "/t/momentum/images/after-sarah.png",
    },
    {
      name: "Andrew",
      program: "Online Coaching",
      duration: "6 Months",
      quote:
        "I came in with no real plan, just showing up and hoping for the best. Forgewell gave me structure I never had — every session had a purpose. Six months in, I'm stronger than I've ever been and finally see the changes I was chasing.",
      before: "/t/momentum/images/before-andrew.png",
      after: "/t/momentum/images/after-andrew.png",
    },
    {
      name: "Samuel",
      program: "In-Person Training",
      duration: "10 Months",
      quote:
        "Coming back from an injury, I was scared to even lift again. The programming was careful, progressive, and never rushed — I'm not just back to where I was, I'm stronger than before.",
      before: "/t/momentum/images/before-samuel.png",
      after: "/t/momentum/images/after-samuel.png",
    },
    {
      name: "Sheena",
      program: "1:1 Coaching",
      duration: "12 Months",
      quote:
        "I'd tried every diet and workout plan online with no real results. What changed everything was having someone actually watch my progress and adjust things week to week. Down 14kg and stronger in every lift.",
      before: "/t/momentum/images/before-sheena.png",
      after: "/t/momentum/images/after-sheena.png",
    },
  ],
};

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

export const PRICING = {
  eyebrow: "Pricing",
  title: "Invest in Your Strongest Self",
  subhead:
    "Simple, transparent pricing — no hidden fees, no long-term contracts. Cancel or switch plans anytime.",
  cta: "Join the program",
  tiers: [
    {
      name: "Online coaching",
      description: "Best for self-motivated training, anywhere",
      price: "$99",
      period: "/month",
      featured: false,
      features: [
        "Custom training program",
        "Form checks via video review",
        "Full access through the mobile app",
        "Email support",
      ],
    },
    {
      name: "1:1 Personal Coaching",
      description: "Best for hands-on guidance and accountability",
      price: "$249",
      period: "/month",
      featured: true,
      badge: "Most popular",
      features: [
        "Fully personalized training",
        "Weekly 1:1 check-ins",
        "Direct messaging access",
        "Progress tracking",
      ],
    },
    {
      name: "Full Transformation Package",
      description: "Best for serious, long-term results",
      price: "$399",
      period: "/month",
      featured: false,
      features: [
        "Everything in 1:1 Coaching",
        "Weekly video coaching calls",
        "Priority support, same-day responses",
        "Custom recovery and mobility plan",
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

/**
 * NOTE: only the question text was captured from the live source page — the
 * live page truncates answers behind closed accordions and the crawl
 * couldn't reach the collapsed content. Answers below are reasonable,
 * on-brand copy written for this fitness-coaching site, not scraped from the
 * source. Flagged in NOTES.md.
 */
export const FAQ = {
  eyebrow: "FAQ",
  title: "Frequently Asked Questions",
  subhead:
    "If you're new here or wondering what to expect, these answers will guide you through how coaching works, what's included, and how we tailor every plan to your needs.",
  items: [
    {
      question: "What should I expect during my first session?",
      answer:
        "Your first session starts with a conversation, not a workout. We'll talk through your goals, training history, injuries, and schedule, then run a short movement assessment so we know exactly where you're starting from. By the end, you'll walk away with a clear picture of what your program will look like.",
    },
    {
      question: "Do I need gym experience to get started?",
      answer:
        "Not at all. Every program is built around your current fitness level, whether that's your first time picking up a dumbbell or you're returning after a long break. We coach the fundamentals first and progress you at a pace that keeps you safe and consistent.",
    },
    {
      question: "How is online coaching different from in-person training?",
      answer:
        "Online coaching gives you the same personalized programming, weekly check-ins, and direct coach access — just delivered through the app, with form checks via video review instead of in-person sessions. In-person training adds hands-on cueing and real-time adjustments during the session itself. Both follow the same structured, accountability-first approach.",
    },
    {
      question: "Can I change or cancel my plan anytime?",
      answer:
        "Yes. There are no long-term contracts — you can upgrade, downgrade, or cancel your plan at any time. If your goals or schedule change, your program changes with them.",
    },
    {
      question: "How soon will I start seeing results?",
      answer:
        "Most clients notice improvements in energy, consistency, and strength within the first few weeks, with visible physical changes typically showing up within 8-12 weeks of consistent training and nutrition. Real, lasting transformation builds over months, not days — which is why every plan is designed for the long term.",
    },
  ],
};

// ---------------------------------------------------------------------------
// Final CTA
// ---------------------------------------------------------------------------

export const FINAL_CTA = {
  title: "Ready to Build Your Strongest Self?",
  subhead:
    "No shortcuts, no generic plans — just structured coaching, real accountability, and results you can measure.",
  cta: "Get Started",
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export const FOOTER = {
  tagline:
    "We believe strength is built through structure, consistency, and the right guidance — every step of the way.",
  quickLinksTitle: "Quick links",
  quickLinks: NAV_LINKS,
  programsTitle: "Programs",
  programs: [
    { label: "1:1 Coaching", href: "#services" },
    { label: "Online Training", href: "#services" },
    { label: "Nutrition Coaching", href: "#services" },
    { label: "Group Training", href: "#services" },
    { label: "Transformation Package", href: "#services" },
  ],
  logo: "Forgewell.",
  // Rendered/visible text on the source page correctly reads "@Momentum"
  // (original brand); rebranded to "@Forgewell" below.
  // (A stray data-framer-name attribute in the raw markup read
  // "@All rights reserved for @PawBloom" — a leftover from a different
  // template this one was derived from. Not used anywhere here.)
  copyright: "All rights reserved for @Forgewell",
};
