// ============================================================================
// ZOVA — single source of truth for site content.
// Recreated from the live Framer site (zova-saas.framer.ai — "Zova - Framer
// Business Template" by studio "Lunis") with the project owner's
// authorization.
//
// NOTE on `ctaHref`: on the live site, every "Get free trial" button (and
// every pricing-tier "Get started" button) is a raw link to
// https://contra.com/payment-link/oozcCbDL-zova-framer-business-template-single-site
// — that is the Framer *template's own* purchase link on the Contra
// marketplace (i.e. a link for buying the Framer template itself), left in
// by the template author. It is not a real trial-signup destination, so it
// was intentionally NOT carried over into this clone. Every CTA that used it
// now points at the internal `ctaHref` below instead — point this at the
// real signup/trial flow when one exists.
// ============================================================================

export const ctaHref = "/#contact";
export const ctaLabel = "Get free trial";

// Per the About page brief: the live site's "See openings on LinkedIn"
// button had no real careers URL behind it — just a bare link to
// linkedin.com. Kept as a LinkedIn company-page-style placeholder; replace
// with the real LinkedIn company page when one exists.
export const linkedinHref = "https://www.linkedin.com/company/zova";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export type NavLink = {
  label: string;
  href: string;
};

export type FooterLinkColumn = {
  heading: string;
  links: NavLink[];
};

export type FeatureCard = {
  title: string;
  description: string;
  icon: "forecast" | "dashboard" | "reporting" | "risk";
};

export type BenefitRow = {
  title: string;
  description: string;
  visual: "typewriter" | "notification" | "image";
  image?: string;
};

export type ProcessStep = {
  number: string;
  title: string;
  description: string;
};

export type PricingTier = {
  name: string;
  description: string;
  price: string;
  priceSuffix?: string;
  ctaLabel: string;
  featured?: boolean;
  features: string[];
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  dek: string;
  authorName: string;
  authorRole: string;
  date: string;
  readTime: string;
  sections: { heading: string; body: string }[];
};

export type TeamMember = {
  name: string;
  role: string;
  initials: string;
  color: string;
};

export type ValueCard = {
  title: string;
  description: string;
};

export type StatTile = {
  target: number;
  prefix?: string;
  suffix?: string;
  label: string;
  description: string;
};

// ----------------------------------------------------------------------------
// Nav / footer
// ----------------------------------------------------------------------------

export const navLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/#contact" },
];

export const footerColumns: FooterLinkColumn[] = [
  {
    heading: "Product",
    links: [
      { label: "Home", href: "/" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Features", href: "/#feature" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/#contact" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    heading: "More",
    links: [
      { label: "Privacy Policy", href: "/legal-terms/privacy-policy" },
      { label: "Terms", href: "/legal-terms/terms-and-conditions" },
    ],
  },
];

// "Designed by Lunis" is a legitimate design-studio credit line from the
// live site (not template-marketplace spam), kept as-is per the brief.
export const footerCredit = "Designed by Lunis";
export const footerCopyright = "© Zova. All Rights Reserved.";

// ----------------------------------------------------------------------------
// Hero
// ----------------------------------------------------------------------------

export const heroEyebrow = "Now available for early access";
export const heroHeadingLines = ["Real-time insight", "for modern", "finance"];
export const heroHighlightWord = "modern finance";
export const heroSubhead =
  "Powerful AI platform simplifying reporting and delivering forecasts for faster decisions.";
export const heroRating = { stars: 5, value: "4.8", label: "rated by 8K+ users" };

// The hero's right-hand visual is a short looping product-illustration video
// on the live site (autoplay, muted, loop, playsinline) — not a static
// image. Downloaded and self-hosted rather than approximated with a still.
export const heroVideo = "/t/zova/videos/hero-loop.mp4";
export const heroVideoPoster = "/t/zova/images/hero-loop-poster.png";

// The large dashboard screenshot sits in its own framed section below the
// hero content on the live site (not inside the hero itself).
export const heroImage = "/t/zova/images/hero-dashboard-ui.png";

// ----------------------------------------------------------------------------
// Logo strip — these are placeholder demo logos bundled with the Framer
// template (their own layer names in the source file are literally
// "Fakebrand 1" through "Fakebrand 4") — not real Zova customers. Swap for
// genuine client logos before shipping.
// ----------------------------------------------------------------------------

export const partnerLogos = [
  "/t/zova/logos/partner-logo-1.png",
  "/t/zova/logos/partner-logo-2.png",
  "/t/zova/logos/partner-logo-3.png",
  "/t/zova/logos/partner-logo-4.png",
];

// ----------------------------------------------------------------------------
// Feature cards
// ----------------------------------------------------------------------------

export const featureCards: FeatureCard[] = [
  {
    title: "AI driven forecasting",
    description: "See AI-powered revenue and risk predictions in seconds.",
    icon: "forecast",
  },
  {
    title: "Unified dashboard",
    description: "Track key metrics in one clean, customizable view.",
    icon: "dashboard",
  },
  {
    title: "Automated reporting",
    description: "Create clear reports instantly with no manual effort.",
    icon: "reporting",
  },
  {
    title: "Risk detection",
    description: "Spot unusual patterns and potential risks right away.",
    icon: "risk",
  },
];

// ----------------------------------------------------------------------------
// "Why modern teams choose us"
// ----------------------------------------------------------------------------

export const whyChooseHeading = "Why modern teams choose us";
export const whyChooseSubhead =
  "A smarter AI engine and financial workflow built to help teams move with clarity.";

export const benefitRows: BenefitRow[] = [
  {
    title: "Real-time intelligence",
    description:
      "Get instant insights and forecasts powered by advanced AI so your team can make decisions with clarity.",
    visual: "typewriter",
  },
  {
    title: "Effortless workflow",
    description:
      "A simple and intuitive interface that removes friction and keeps your financial operations moving smoothly.",
    visual: "notification",
  },
  {
    title: "Reliable accuracy",
    description:
      "Consistent, data-driven analysis that helps teams effectively reduce risk and stay ahead of the curve with confidence.",
    visual: "image",
    image: "/t/zova/images/dashboard-analytics-view.png",
  },
];

// Phrases cycled by the small typing-effect UI snippet in "Real-time intelligence".
export const typewriterPhrases = [
  "What risks to be aware of...",
  "Where cash flow is tightening...",
  "Which invoices need review...",
];

// ----------------------------------------------------------------------------
// "Get started in 3 steps"
// ----------------------------------------------------------------------------

export const processHeading = "Get started in 3 steps";
export const processSubhead = "A simple flow that brings clarity to your financial data in minutes.";

export const processSteps: ProcessStep[] = [
  {
    number: "01",
    title: "Connect your data",
    description: "Import financial sources with quick and secure integrations.",
  },
  {
    number: "02",
    title: "Let AI analyze",
    description: "Your data is processed instantly to reveal trends and patterns.",
  },
  {
    number: "03",
    title: "View clear insights",
    description: "See forecasts, reports, and metrics in one intuitive workspace.",
  },
];

// Decorative portfolio-list rows shown behind steps 01-03 — built from
// markup (not a screenshot), matching how the source page builds it. Exact
// company list is not meaningful, just plausible UI chrome.
export const portfolioRows = [
  { name: "Apple", ticker: "AAPL", date: "25 Jan 2024", shares: "340 Shares", color: "#111111" },
  { name: "Microsoft", ticker: "MSFT", date: "25 Jan 2024", shares: "3,364 Shares", color: "#2563eb" },
  { name: "Walmart", ticker: "WMT", date: "22 Jan 2024", shares: "612 Shares", color: "#0ea5e9" },
  { name: "NovaTech", ticker: "NVTC", date: "18 Jan 2024", shares: "128 Shares", color: "#7c3aed" },
  { name: "VitaHealth", ticker: "VTHL", date: "12 Jan 2024", shares: "980 Shares", color: "#059669" },
];

// ----------------------------------------------------------------------------
// Integration section
// ----------------------------------------------------------------------------

export const integrationHeading = "Connect your entire stack";
export const integrationSubhead =
  "Sync your financial data automatically from the tools your team already relies on.";

// A short looping illustration animation (a character waving a wand) sits
// above the integration icon grid on the live site.
export const integrationVideo = "/t/zova/videos/integration-illustration-loop.mp4";
export const integrationVideoPoster = "/t/zova/images/integration-illustration-poster.png";

// These 9 tiles are real downloadable assets on the live page — each <img>
// there literally carries alt="Sample logo", confirming they're generic
// placeholder integration icons bundled with the template (not real partner
// brands). Self-hosted as-is rather than replaced with invented ones; swap
// in real integration partner logos when available.
export const integrationIcons = [
  "/t/zova/images/integration-icon-1.png",
  "/t/zova/images/integration-icon-2.png",
  "/t/zova/images/integration-icon-3.png",
  "/t/zova/images/integration-icon-4.png",
  "/t/zova/images/integration-icon-5.png",
  "/t/zova/images/integration-icon-6.png",
  "/t/zova/images/integration-icon-7.png",
  "/t/zova/images/integration-icon-8.png",
  "/t/zova/images/integration-icon-9.png",
];

// ----------------------------------------------------------------------------
// Pricing
// ----------------------------------------------------------------------------

export const pricingHeading = "Simple pricing for every team";
export const pricingSubhead = "Choose a plan that supports your workflow and scales as you grow.";

export const pricingTiers: PricingTier[] = [
  {
    name: "Starter",
    description: "For individuals and early teams getting started with financial clarity.",
    price: "Free",
    ctaLabel: "Get started",
    features: [
      "Connect up to three data sources",
      "Basic dashboard views",
      "Standard forecasting",
      "Automated weekly reports",
      "Email support",
    ],
  },
  {
    name: "Growth",
    description: "For growing teams that need deeper insights and more automation.",
    price: "$49",
    priceSuffix: "/mo",
    ctaLabel: "Get started",
    featured: true,
    features: [
      "Unlimited data sources",
      "Advanced dashboard customization",
      "Real time forecasting",
      "Automated daily reports",
      "Priority support",
    ],
  },
  {
    name: "Pro",
    description: "For established teams looking for full visibility and powerful analysis.",
    price: "$99",
    priceSuffix: "/mo",
    ctaLabel: "Get started",
    features: [
      "Full integrations with all tools",
      "Custom reporting and exports",
      "Team collaboration and permissions",
      "Anomaly detection alerts",
      "Dedicated account support",
    ],
  },
];

// ----------------------------------------------------------------------------
// Testimonial
// ----------------------------------------------------------------------------

export const testimonial = {
  quote:
    "This platform gives us instant clarity. Our forecasts are more accurate and team makes decisions faster than ever.",
  name: "John Smith",
  role: "Operations Lead",
  photo: "/t/zova/images/testimonial-john-smith.png",
};

// ----------------------------------------------------------------------------
// FAQ
// ----------------------------------------------------------------------------

export const faqHeading = "Help and support";
export const faqSubhead = "Answers to common questions about setup, pricing, and how everything works.";

// Looping illustration (person at a desk, question marks overhead) next to
// the FAQ heading on the live site.
export const faqVideo = "/t/zova/videos/faq-illustration-loop.mp4";
export const faqVideoPoster = "/t/zova/images/faq-illustration-poster.png";

export const faqs: FaqItem[] = [
  {
    question: "How do I connect my financial data sources?",
    answer:
      "You can link banks, tools, and spreadsheets directly from the setup page with secure one click integrations.",
  },
  {
    question: "Can I change or cancel my plan at any time?",
    answer:
      "Yes, you can upgrade, downgrade, or cancel your plan whenever you like with no hidden extra fees.",
  },
  {
    question: "How secure is my data?",
    answer:
      "All data is encrypted in transit and at rest, and we follow industry standard security practices to keep your information protected.",
  },
  {
    question: "Does the platform support multiple team members?",
    answer:
      "Yes, you can invite your team, assign specific roles, and manage permissions based on your current plan.",
  },
  {
    question: "What integrations are included?",
    answer:
      "Most integrations are available on all plans, while advanced data connections are included in higher tiers.",
  },
  {
    question: "Do you offer onboarding support?",
    answer:
      "Yes, we provide guided setup and extensive resources to help you get your business fully up and running.",
  },
];

// ----------------------------------------------------------------------------
// Blog
// ----------------------------------------------------------------------------

export const blogHeading = "Insights and resources";
export const blogSubhead =
  "Practical guides and ideas to help modern teams improve their financial workflow.";

export const blogPosts: BlogPost[] = [
  {
    slug: "the-new-era-of-financial-automation",
    title: "The new era of intelligent financial automation (2026)",
    dek: "How modern teams streamline operations with automated financial workflows.",
    authorName: "Daniel Cho",
    authorRole: "Customer Success Manager",
    date: "2025-12-05",
    readTime: "5 min read",
    sections: [
      {
        heading: "Why automation matters",
        body: "Many companies struggle with slow financial tasks that drain time and focus. Automation removes repetitive steps and frees teams to prioritize strategic work. It also reduces the risk of human error and improves overall accuracy.",
      },
      {
        heading: "Key areas that benefit first",
        body: "Reconciliation, invoice tracking, and monthly reporting are usually the first tasks that show dramatic improvement. These workflows become faster, more predictable, and easier to manage. Teams also gain clearer visibility into financial status at any moment.",
      },
      {
        heading: "What success looks like",
        body: "With automation, businesses find that financial cycles run more smoothly. Bottlenecks fade as teams become more confident in their data. The entire organization benefits from better forecasting and decision making.",
      },
    ],
  },
  {
    slug: "how-startups-can-stay-organized-during-rapid-growth",
    title: "How startups can stay organized during rapid growth",
    dek: "A practical guide to keeping your financial operations steady while scaling.",
    authorName: "Sofia Ramirez",
    authorRole: "Lead Financial Analyst",
    date: "2025-11-28",
    readTime: "6 min read",
    sections: [
      {
        heading: "The challenge of growing fast",
        body: "When a company scales quickly, financial processes often fall behind. Teams adopt new tools, hire new people, and take on new revenue streams. Without strong systems, this growth introduces risk and inefficiency.",
      },
      {
        heading: "Setting up the right foundations",
        body: "Startups can stay organized by adopting clear workflows early. This includes structured reporting practices, consistent documentation, and a single source of truth for data. Good foundations help teams stay aligned and avoid confusion.",
      },
      {
        heading: "Maintaining momentum over time",
        body: "As the company evolves, financial systems must adapt as well. Regular audits, small process improvements, and simple automations keep operations healthy. A proactive approach helps teams handle new challenges with confidence.",
      },
    ],
  },
  {
    slug: "a-financial-dashboard-your-team-will-actually-use",
    title: "A powerful financial dashboard that your team will actually use",
    dek: "What makes a financial dashboard effective and easy for teams to adopt.",
    authorName: "Sofia Ramirez",
    authorRole: "Lead Financial Analyst",
    date: "2025-10-31",
    readTime: "4 min read",
    sections: [
      {
        heading: "Why dashboards fall short",
        body: "Many dashboards are cluttered with data that does not drive decisions. Teams get overwhelmed and ignore the insights. A thoughtful structure is essential to create a tool that people rely on daily.",
      },
      {
        heading: "Choosing what to display",
        body: "A strong dashboard highlights performance indicators that matter most. This includes cash flow, outstanding invoices, upcoming expenses, and reconciliation status. Clear labels and visual hierarchy make the information easier to absorb.",
      },
      {
        heading: "Encouraging team adoption",
        body: "A dashboard becomes powerful only when people use it consistently. Regular reviews, shared workflows, and simple onboarding help everyone stay familiar with the data. Over time, the dashboard becomes the center of operational clarity.",
      },
    ],
  },
  {
    slug: "smarter-reporting-for-modern-finance-teams",
    title: "Providing smarter reporting for modern finance teams",
    dek: "How businesses can create reports that are simple, clear, and actionable.",
    authorName: "Amy Park",
    authorRole: "Head of Product",
    date: "2025-10-21",
    readTime: "5 min read",
    sections: [
      {
        heading: "The problem with traditional reports",
        body: "Old reporting habits often produce long documents that are difficult to interpret. Teams waste time reading through unnecessary details. This slows decision making and leads to missed opportunities.",
      },
      {
        heading: "Creating clear and actionable reports",
        body: "Modern reporting focuses on clarity and simplicity. Each report highlights insights, trends, and recommended actions. Teams gain better visibility and can respond faster to changes.",
      },
      {
        heading: "Keeping reports consistent",
        body: "Reliable formats help everyone stay aligned. When reports follow the same structure each month, teams know where to find key information. This consistency builds trust in the data and improves team communication.",
      },
    ],
  },
  {
    slug: "how-financial-visibility-builds-stronger-teams",
    title: "How financial visibility builds stronger and faster teams",
    dek: "The hidden impact of clear financial data on collaboration and culture.",
    authorName: "Evan Mercer",
    authorRole: "Chief Executive Officer",
    date: "2025-10-09",
    readTime: "5 min read",
    sections: [
      {
        heading: "The value of shared understanding",
        body: "When teams understand their financial position, collaboration becomes smoother. Conversations are grounded in facts rather than assumptions. This shared clarity strengthens alignment across departments.",
      },
      {
        heading: "Transparency creates accountability",
        body: "Visibility helps people take ownership of their work. With access to real data, teams can measure progress and identify challenges early. This encourages a culture of responsibility and improvement.",
      },
      {
        heading: "Building long term confidence",
        body: "Over time, consistent visibility builds trust. Teams feel more prepared, more informed, and more confident in their decisions. Clear financial insights support a healthier and more resilient organization.",
      },
    ],
  },
];

// ----------------------------------------------------------------------------
// Contact section
// ----------------------------------------------------------------------------

export const contactHeading = "Get in touch";
export const contactSubhead =
  "Reach out to our team at any time for support or questions and we'll get back to you within 2 business days.";

// The live page shows two different support addresses in two different
// places (support@zova.com in one footer spot, support@zovasaas.com in the
// contact block) — a genuine inconsistency in the source. This clone uses
// support@zovasaas.com everywhere, as the more specific/complete address.
export const contactPhone = "412-483-8261";
export const contactEmail = "support@zovasaas.com";
export const contactAddress = "210 Market St. Suite 402, San Francisco, CA";

// Looping illustration shown next to the contact form on the live site.
export const contactVideo = "/t/zova/videos/contact-illustration-loop.mp4";
export const contactVideoPoster = "/t/zova/images/contact-illustration-poster.png";

// ----------------------------------------------------------------------------
// Closing CTA band
// ----------------------------------------------------------------------------

export const closingCtaHeading = "Bring financial clarity to your numbers today";
export const closingCtaSubhead =
  "Start your free trial today and discover how easy it is to bring absolute clarity to your financial workflow.";

// ----------------------------------------------------------------------------
// About page
// ----------------------------------------------------------------------------

export const aboutHeading = "Zova unites teams around smarter financial decisions";
export const aboutHighlightWord = "financial decisions";

// The About header visual is a looping illustration video on the live site
// (a different asset from the small people-talking icon used elsewhere).
export const aboutHeaderVideo = "/t/zova/videos/about-header-loop.mp4";
export const aboutHeaderVideoPoster = "/t/zova/images/about-header-poster.png";

export const aboutPhotoStrip = [
  { src: "/t/zova/images/about-desk-setup.png", alt: "Minimalist Desk Setup" },
  { src: "/t/zova/images/about-collaborative-workspace.png", alt: "Collaborative Workspace" },
  { src: "/t/zova/images/about-minimalist-office.png", alt: "Minimalist Office Space" },
];

export const aboutStats: StatTile[] = [
  { target: 300, suffix: "M+", label: "Tracked Annually", description: "Supporting financial activity with accuracy." },
  { target: 98, suffix: "%", label: "Less Manual Work", description: "Automating repetitive tasks for workflows." },
  { target: 5, suffix: "K+", label: "Monthly Audits", description: "Ensuring accurate books at scale for teams." },
  { target: 99.9, suffix: "%", label: "Uptime", description: "Reliable performance for your operations." },
];

export const aboutValuesIntro = {
  quote:
    "At Zova, we believe teams make their best decisions when money is no longer a mystery. Our goal is simple: give every business the absolute clarity and insight they deserve.",
  attribution: "Evan Mercer, CEO, Zova Tech",
};

export const aboutValues: ValueCard[] = [
  {
    title: "Transparency",
    description:
      "We communicate clearly, operate openly, and ensure users always understand how their financial data is handled.",
  },
  {
    title: "Reliability",
    description:
      "We design every feature with precision and care, delivering consistent performance that users can trust every day.",
  },
  {
    title: "Simplicity",
    description:
      "We turn complex financial tasks into intuitive workflows so teams can focus on growth rather than manual processes.",
  },
  {
    title: "Customer Focus",
    description:
      "We listen closely, iterate quickly, and prioritize solutions that genuinely improve our customers' financial operations.",
  },
];

export const leadershipHeading = "Our leadership and experts";
export const leadershipSubhead =
  "A dedicated team of analysts, engineers, and expert advisors helping you build a stronger financial foundation.";

// No photos were found for these team tiles during recon, so this clone
// uses simple initials-avatar placeholders rather than inventing stock
// photos. Swap for real headshots when available.
export const teamMembers: TeamMember[] = [
  { name: "Evan Mercer", role: "Chief Executive Officer", initials: "EM", color: "#111111" },
  { name: "Amy Park", role: "Head of Product", initials: "AP", color: "#2563eb" },
  { name: "Daniel Cho", role: "Customer Success Manager", initials: "DC", color: "#059669" },
  { name: "Sofia Ramirez", role: "Lead Financial Analyst", initials: "SR", color: "#7c3aed" },
];

export const careersHeading = "Grow your career at Zova";
export const careersSubhead =
  "Work with a trusted team that simplifies complex financial workflows and brings clarity to every business we support.";
export const careersCtaLabel = "See openings on LinkedIn";

// Looping illustration in the careers band at the bottom of the About page.
export const careersVideo = "/t/zova/videos/about-career-loop.mp4";
export const careersVideoPoster = "/t/zova/images/about-career-poster.png";

// ----------------------------------------------------------------------------
// Legal pages
// ----------------------------------------------------------------------------

export const legalVersion = "Version 1.0 · Dec 8, 2025";

// The Privacy Policy on the live site is generic, unfilled Framer-template
// boilerplate — it genuinely still contains literal "[Company Name]"
// placeholder text and placeholder contact details that don't match the
// rest of the site (support@zova.com / +1 (123) 456-7890 / a generic
// address). Reproduced verbatim per the brief rather than "fixed"; the site
// owner should replace this with real legal copy before shipping.
export const privacyPolicySections: { heading: string; body: string[] }[] = [
  {
    heading: "1. Information We Collect",
    body: [
      "Personal Information: When you place an order, subscribe to our newsletter, or contact us, we may collect your name, email, phone number, shipping address, and payment details.",
      "Non-Personal Information: We collect browsing data such as IP addresses, cookies, and analytics to improve our website and user experience.",
    ],
  },
  {
    heading: "2. How We Use Your Information",
    body: [
      "To process and fulfill orders, including payment processing and shipping.",
      "To improve our website, services, and customer experience.",
      "To send promotional emails, updates, and exclusive offers (you can opt out anytime).",
      "To comply with legal requirements and prevent fraudulent activities.",
    ],
  },
  {
    heading: "3. How We Share Your Information",
    body: [
      "We do not sell or rent your personal information to third parties.",
      "We may share necessary data with trusted service providers (e.g., payment processors, shipping carriers) to fulfill orders.",
      "In case of legal obligations, we may disclose information to comply with laws or protect our rights.",
    ],
  },
  {
    heading: "4. Cookies & Tracking Technologies",
    body: [
      "We use cookies to enhance your browsing experience and analyze website performance.",
      "You can adjust cookie settings through your browser, but disabling cookies may affect website functionality.",
    ],
  },
  {
    heading: "5. Data Security",
    body: [
      "We implement security measures to protect your personal data from unauthorized access or misuse.",
      "While we strive to protect your information, no method is 100% secure, and we cannot guarantee absolute security.",
    ],
  },
  {
    heading: "6. Your Rights & Choices",
    body: [
      "You have the right to access, update, or delete your personal data by contacting us.",
      "You can opt out of marketing emails by clicking the unsubscribe link in any email.",
    ],
  },
  {
    heading: "7. Third-Party Links",
    body: [
      "Our website may contain links to third-party websites. We are not responsible for their privacy policies or content.",
    ],
  },
  {
    heading: "8. Changes to This Privacy Policy",
    body: [
      "We reserve the right to update this policy at any time. Changes will be posted on this page with an updated date.",
      "Your continued use of our website after updates constitutes acceptance of the revised policy.",
    ],
  },
  {
    heading: "9. Contact Information",
    body: [
      "For any questions regarding this Privacy Policy, please contact us at:",
      "Email: support@zova.com",
      "Phone: +1 (123) 456-7890",
      "Address: 123 Business Road, City, Country",
      "Thank you for trusting [Company Name] with your information. Your privacy matters to us.",
    ],
  },
];

// The Terms and Conditions page is the same kind of unfilled Framer-template
// boilerplate, including literal "[X]" placeholders in the Returns &
// Refunds section (e.g. "returns within [X] days") and the same generic
// placeholder contact block. Reproduced verbatim per the brief; the site
// owner should complete it with real legal copy before shipping.
export const termsSections: { heading: string; body: string[] }[] = [
  {
    heading: "1. Use of Our Website",
    body: [
      "You must be at least 18 years old or have parental consent to use our website.",
      "You agree not to use our website for any unlawful or prohibited activities.",
      "We reserve the right to modify or discontinue any part of our website without notice.",
    ],
  },
  {
    heading: "2. Products & Orders",
    body: [
      "All purchases are subject to availability. We reserve the right to refuse or cancel any order.",
      "Prices and product descriptions are subject to change without notice.",
      "We may limit or cancel quantities purchased per person or per order at our discretion.",
    ],
  },
  {
    heading: "3. Payments & Billing",
    body: [
      "We accept major credit cards, PayPal, and other secure payment methods.",
      "You agree to provide accurate payment and billing information.",
      "In case of payment disputes, we reserve the right to cancel or suspend orders.",
    ],
  },
  {
    heading: "4. Shipping & Delivery",
    body: [
      "Shipping times vary based on location and carrier policies.",
      "We are not responsible for delays caused by external factors such as customs or courier issues.",
      "Any shipping fees are non-refundable unless stated otherwise.",
    ],
  },
  {
    heading: "5. Returns & Refunds",
    body: [
      "We accept returns within [X] days of delivery, provided the item is unused and in original packaging.",
      "Refunds will be processed to the original payment method within [X] days.",
      "Certain products may be non-returnable (e.g., digital goods, personalized items).",
    ],
  },
  {
    heading: "6. Intellectual Property",
    body: [
      "All content on our website, including images, text, and logos, is our property or used with permission.",
      "You may not copy, distribute, or use our content without written consent.",
    ],
  },
  {
    heading: "7. Limitation of Liability",
    body: [
      "We are not responsible for any indirect, incidental, or consequential damages arising from your use of our website or products.",
      "Our liability is limited to the amount you paid for the purchased product or service.",
    ],
  },
  {
    heading: "8. Privacy Policy",
    body: [
      "Your personal information is handled according to our Privacy Policy.",
      "We take appropriate security measures to protect your data but cannot guarantee absolute security.",
    ],
  },
  {
    heading: "9. Changes to Terms",
    body: [
      "We reserve the right to update these Terms and Conditions at any time.",
      "Continued use of our website after changes implies acceptance of the revised terms.",
    ],
  },
  {
    heading: "10. Contact Information",
    body: [
      "For any questions regarding these Terms and Conditions, please contact us at:",
      "Email: support@zova.com",
      "Phone: +1 (123) 456-7890",
      "Address: 123 Business Road, City, Country",
      "Thank you for shopping with [Company Name]! Your trust is important to us.",
    ],
  },
];
