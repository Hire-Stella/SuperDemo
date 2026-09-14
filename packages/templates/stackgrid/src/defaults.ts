/* ==================================================================
   lib/data.ts — the single typed source of truth for every string,
   asset path and ASCII parameter on the site.
   ================================================================== */

import {
  ABOUT_CIRCUIT_MASK,
  CAREERS_LAUNCH,
  FEATURE_DATA_PIPELINES,
  FEATURE_INFRA_AUDITS,
  FEATURE_SECURE_DATA,
  FEATURE_SUPPORT_AGENT,
  FOOTER_TOWER,
} from "./ascii-art";

/* ------------------------------------------------------------------
   TODO: replace with the site owner's own details.

   Everything in OWNER_DETAILS_TO_REPLACE was inherited verbatim from
   the original Framer template and belongs to the *template author*
   (Krutik Maru), not to the owner of this site. The social links point
   at his personal X / LinkedIn profiles, the YouTube link is a bare
   homepage link, and every @stackgrid.framer.website mailbox lives on
   the Framer preview domain and will not receive mail once this site
   moves to its own domain. Swap all of it before going to production.
   ------------------------------------------------------------------ */
export const OWNER_DETAILS_TO_REPLACE = {
  /** Shown in the FAQ / contact "support" pills. */
  supportEmail: "support@stackgrid.framer.website",
  /** Footer of /terms-and-conditions. */
  legalEmail: "legal@stackgrid.framer.website",
  /** Footer of /acceptable-use. */
  securityEmail: "security@stackgrid.framer.website",
  /** Listed on /contact. */
  phone: "+1-555-010-2345",
  office: "1016 LZ Amsterdam, Netherlands",
  /** The template author's personal accounts — do not ship these. */
  socials: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/krutik-maru/" },
    { label: "X", href: "https://x.com/krutikmaru_18" },
    { label: "YouTube", href: "https://youtube.com/" },
  ],
  /** The contact form placeholders on the live site are his own name. */
  formPlaceholders: {
    firstName: "Krutik",
    lastName: "Maru",
    email: "krutik@framer.com",
  },
} as const;

/* ------------------------------------------------------------------
   Booking.

   The original embeds app.cal.com/embed/embed.js pointed at
   `cal.com/framer-placeholder/default` — an unconfigured placeholder
   account that belongs to nobody. Shipping that would send real
   prospects to a dead calendar, so the booking panel here is
   self-contained UI whose primary action goes to /contact.

   Set CAL_USERNAME to a real Cal.com handle (e.g. "stackgrid/30min")
   and the panel can be switched over to a live embed.
   ------------------------------------------------------------------ */
export const CAL_USERNAME: string | null = null;

export const site = {
  name: "Stackgrid",
  url: "https://stackgrid.example.com",
  description:
    "Stackgrid engineers custom AI agents and secure data pipelines that eliminate manual enterprise workflows — from infrastructure audits to production hand-off.",
  tagline: "This is just some description, I am not sure what to put here really.",
  copyright: "©️ Stackgrid. All Rights Reserved.",
} as const;

/* ---------------------------- nav ---------------------------- */

export type NavLink = { label: string; href: string };

export const navLinksLeft: NavLink[] = [
  { label: "About", href: "/about" },
  { label: "Pricing", href: "/#pricing" },
];

export const navLinksRight: NavLink[] = [
  { label: "Case Studies", href: "/case-studies" },
  { label: "Contact", href: "/contact" },
];

export const footerColumns: { title: string; links: NavLink[] }[] = [
  {
    title: "Pages",
    links: [
      { label: "Home", href: "/" },
      { label: "About", href: "/about" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Case Studies", href: "/case-studies" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms-and-conditions" },
      { label: "Acceptable Use", href: "/acceptable-use" },
    ],
  },
];

/* ------------------------- ASCII config -------------------------
   Ramps transcribed off the live rendered text, one per treatment. */

export const ramps = {
  /** Hero video. Sparse ring glyphs: space = brightest, ◐ = darkest. */
  rings: " ○◐",
  /** Block ramp used by the illustration and card artwork. */
  blocks: " ░▒▓█",
  /** The classic 70-step luminance ramp used for the portraits. */
  dense:
    " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  /** Hex readout that shimmers behind the /about hero. */
  hex: "0123456789ABCDEF",
} as const;

export const heroAscii = {
  video: "/t/stackgrid/video/hero-ascii-source.mp4",
  poster: "/t/stackgrid/images/hero-ascii-poster.png",
  /** Live panel is 595x420 at font-size 6px / line-height 6.6px. */
  fontSize: 6,
  lineHeight: 6.6,
} as const;

export const asciiArt = {
  footerTower: FOOTER_TOWER,
  careersLaunch: CAREERS_LAUNCH,
  aboutCircuitMask: ABOUT_CIRCUIT_MASK,
} as const;

/* ---------------------------- home ---------------------------- */

export const hero = {
  headline: "The all new AI Era",
  subcopy:
    "Make custom AI agents and secure data pipelines to eliminate your manual workflows.",
  secondaryCta: { label: "Why us?", href: "/#the-solution" },
  primaryCta: { label: "Start now", href: "/#pricing" },
} as const;

export const customers = {
  label: "Trusted by people at",
  logos: [
    "Openly AI",
    "Stries",
    "I Combinator",
    "Radial",
    "Vercex",
    "Votion",
    "XYZ",
    "Search App",
  ],
} as const;

export const solution = {
  heading: "The Human-AI Intersection.",
  subcopy:
    "Unifying human enterprise and autonomous data pipelines to scale your company’s throughput instantly.",
  asciiLabel: "The AI",
  photo: {
    src: "/t/stackgrid/images/hand-reaching-right.png",
    alt: "Human Hand Reaching For Right Side",
  },
} as const;

export type Feature = {
  title: string;
  description: string;
  /** Pre-rendered artwork; no bitmap source exists on the original. */
  art: string;
  color: string;
  /** true -> artwork sits above the copy, false -> below. */
  artOnTop: boolean;
};

export const features = {
  eyebrow: "Features",
  heading: "Engineered Core Capabilities.",
  subcopy:
    "From isolated language model agents to private, secure database environments—we architect the structural foundation of your automated enterprise.",
  cards: [
    {
      title: "Customer Support Agents",
      description:
        "Deploy custom LLM agents trained directly on your internal company knowledge base.",
      art: FEATURE_SUPPORT_AGENT,
      color: "var(--sg-feature-blue)",
      artOnTop: true,
    },
    {
      title: "Automated Data Pipelines",
      description:
        "Connect disparate APIs and legacy systems to eliminate manual data entry entirely.",
      art: FEATURE_DATA_PIPELINES,
      color: "var(--sg-feature-magenta)",
      artOnTop: false,
    },
    {
      title: "Secure Enterprise Data",
      description:
        "Query proprietary documents through private, zero-retention infrastructure using RAG architecture.",
      art: FEATURE_SECURE_DATA,
      color: "var(--sg-feature-teal)",
      artOnTop: false,
    },
    {
      title: "Strategic AI Infra Audits",
      description:
        "Evaluate your existing data readiness before investing in expensive enterprise model deployments.",
      art: FEATURE_INFRA_AUDITS,
      color: "var(--sg-feature-amber)",
      artOnTop: true,
    },
  ] satisfies Feature[],
} as const;

/** The branch diagram: a hub with four rotated 2px connectors. */
export type IntegrationBranch = {
  title: string;
  /** length of the connector line in px */
  length: number;
  /** rotation applied to the connector, in degrees */
  rotate: number;
  /** offset of the connector's origin from the hub, in px */
  top: number;
  left: number;
};

export const integration = {
  heading: "The Integration Ecosystem",
  subcopy: "We connect the industry's best APIs into one seamless pipeline.",
  hubLabel: "Stackgrid",
  branches: [
    { title: "Large Language Models", length: 150, rotate: -47, top: -42, left: -7 },
    { title: "Vector Databases", length: 150, rotate: -15, top: -3, left: 18 },
    { title: "Automation Middleware", length: 150, rotate: 8, top: 31, left: 23 },
    { title: "CRM", length: 150, rotate: 28, top: 64, left: 14 },
  ] satisfies IntegrationBranch[],
} as const;

export type Tier = {
  label: string;
  name: string;
  description: string;
  price: string;
  /** e.g. "/month"; empty for one-off engagements. */
  byline?: string;
  cta: { label: string; href: string };
  points: string[];
};

export const pricing = {
  heading: "Service Tiers",
  subcopy:
    "Our services are divided into clear execution phases designed to audit, build, and continuously optimize your custom intelligence assets.",
  tiers: [
    {
      label: "Tier 1",
      name: "The Paid Discovery",
      description:
        "We map out exactly where AI can save your business time and money.",
      price: "$1,000",
      cta: { label: "Book now", href: "/contact" },
      points: [
        "Review of your current manual tasks",
        "Identify the highest-ROI AI opportunities",
        "Complete data privacy and security check",
        "Step-by-step custom implementation plan",
      ],
    },
    {
      label: "Tier 2",
      name: "The Core Build",
      description:
        "We build, connect, and deploy automated systems tailored to your workflow.",
      price: "$18,500",
      cta: { label: "Book now", href: "/contact" },
      points: [
        "Custom AI agent and chatbot development",
        "Connecting your existing software tools",
        "Secure setup using your private company data",
        "Complete team training and system handover",
      ],
    },
    {
      label: "Tier 3",
      name: "Ongoing Maintenance",
      description:
        "We keep your new automated systems updated and running flawlessly.",
      price: "$3,500",
      byline: "/month",
      cta: { label: "Book now", href: "/contact" },
      // Verbatim from the live site: Tier 3 genuinely repeats Tier 1's
      // bullet list. Kept as-is rather than "fixed".
      points: [
        "Review of your current manual tasks",
        "Identify the highest-ROI AI opportunities",
        "Complete data privacy and security check",
        "Step-by-step custom implementation plan",
      ],
    },
  ] satisfies Tier[],
} as const;

export type Testimonial = {
  company: string;
  /** The one-line engagement summary shown on the selector card. */
  overview: string;
  quote: string;
  name: string;
  role: string;
  portrait: { src: string; alt: string };
  caseStudySlug: string;
};

export const testimonials = {
  heading: "Proven Deployment Outcomes",
  subcopy:
    "Below is the exact operational impact and ROI our custom automation pipelines have delivered across enterprise infrastructures.",
  ctaLabel: "Read Case Study",
  items: [
    {
      company: "Simplify Digital Co",
      overview:
        "Bypassed manual invoicing friction for a global supply chain firm by deploying an event-driven middleware orchestration layer that cuts processing time from 48 hours to 11 minutes.",
      quote:
        "Our manual data entry pipelines were completely strangling our margins and causing massive shipping delays at international customs checkpoints. Stackgrid bypassed the standard AI market fluff and engineered a robust, infrastructure-level solution. The autonomous pipeline completely transformed our unit economics, slashed our processing timelines from days to minutes, and allowed our business to scale throughput without forcing us to scale our human operational headcount.",
      name: "Kevin McCallister",
      role: "Chief Operating Officer",
      portrait: {
        src: "/t/stackgrid/images/portrait-kevin-mccallister.png",
        alt: "Portrait of Kevin McCallister, Chief Operating Officer at Simplify Digital Co",
      },
      caseStudySlug:
        "replacing-legacy-erp-invoicing-bottlenecks-with-an-autonomous-middleware-pipeline",
    },
    {
      company: "CoreTech Systems",
      overview:
        "Engineered a stateful conversational AI agent trained strictly on proprietary banking databases to autonomously resolve Tier-1 helpdesk tickets without regulatory breaches.",
      quote:
        "We were terrified of customer-facing AI hallucinations that could land us in regulatory hot water or expose financial data. Stackgrid didn't just build a chatbot; they built a deterministic infrastructure. This architecture doesn't guess—it functions exactly within the mathematical guardrails defined, solving user problems instantly while keeping our legal and compliance teams entirely comfortable.",
      name: "Cata Giraldo",
      role: "VP of Engineering",
      portrait: {
        src: "/t/stackgrid/images/portrait-cata-giraldo.png",
        alt: "Portrait of Cata Giraldo, VP of Engineering at CoreTech Systems",
      },
      caseStudySlug:
        "building-a-context-aware-compliant-llm-agent-for-high-volume-support-deflection",
    },
    {
      company: "Velosite",
      overview:
        "Engineered a predictive AI middleware pipeline that analyzes real-time product telemetry to autonomously trigger personalized onboarding interventions, drastically reducing enterprise user churn.",
      quote:
        "Before this deployment, our CS team was constantly putting out fires and reacting to churn after the fact. Stackgrid didn't just build a basic integration; they built an intelligent infrastructure that actually predicts user friction in real-time. It completely automated our health scoring and allowed our team to focus purely on high-level strategy instead of manual data digging. Our retention metrics transformed entirely.",
      name: "Aman Patel",
      role: "Director of Customer Success",
      portrait: {
        src: "/t/stackgrid/images/portrait-aman-patel.png",
        alt: "Portrait of Aman Patel, Director of Customer Success at Velosite",
      },
      caseStudySlug:
        "deploying-predictive-ai-to-automate-customer-success-and-eradicate-churn",
    },
  ] satisfies Testimonial[],
} as const;

export type Faq = { question: string; answer: string };

export const faq = {
  heading: "Frequently Asked Questions",
  subcopy:
    "Clear, zero-fluff technical and operational parameters regarding how we build, deploy, and secure your enterprise architectures.",
  items: [
    {
      question: "Is our company data safe from public AI models?",
      answer:
        "Yes. We use zero-retention APIs and deploy entirely within your private cloud. Your data is ring-fenced and never trains public models.",
    },
    {
      question: "Does this integrate with our legacy software?",
      answer:
        "Yes. We build custom middleware for any system with an API. For closed legacy software, we deploy secure RPA to bridge the gap.",
    },
    {
      question: "How fast is the deployment timeline?",
      answer:
        "Audits take 7 days. Internal workflow automations deploy in 3 to 4 weeks. Customer-facing agents launch in 6 to 8 weeks after rigorous hallucination testing.",
    },
    {
      question: "Will this replace our human workforce?",
      answer:
        "No. Our systems resolve 80% of repetitive Tier-1 tasks automatically. High-stakes edge cases are instantly routed to your human staff with full context.",
    },
    {
      question: "Who owns the code and intellectual property?",
      answer:
        "You own 100% of the IP upon completion. We offer ongoing SLAs to monitor API stability and update the underlying language models.",
    },
  ] satisfies Faq[],
} as const;

export const cta = {
  heading: "Scale Your Infrastructure.",
  subcopy:
    "Book a 30-minute technical assessment. We will audit your current manual workflows and tell you exactly which processes can be automated using AI.",
  points: [
    "No aggressive sales pitches.",
    "Speak directly with a lead engineer.",
    "Receive a clear deployment roadmap.",
  ],
  action: { label: "Book a technical assessment", href: "/contact" },
} as const;

/* ---------------------------- about ---------------------------- */

export type TeamMember = { name: string; role: string; photo: string };

export const about = {
  headline: ["We engineer systems,", "not slide decks."],
  subcopy:
    "Stackgrid was built on a single, uncompromising premise: traditional consulting is broken. We do not charge retainers to deliver theoretical roadmaps.",
  cta: { label: "Book now", href: "/contact" },
  process: {
    eyebrow: "The process",
    heading: "The process",
    subcopy:
      "How we take your enterprise from fractured, manual data silos to production-grade automation with absolute structural precision.",
    steps: [
      {
        title: "Architecture Audit",
        description:
          "We map your existing data silos, legacy APIs, and operational bottlenecks to define exact integration points with zero guesswork.",
      },
      {
        title: "Secure Prototyping",
        description:
          "We build the initial LLM agents and middleware in a ring-fenced sandbox, rigorously testing for hallucination, latency, and strict security compliance.",
      },
      {
        title: "Production & Handoff",
        description:
          "Live deployment into your cloud infrastructure. We provide full documentation, employee training, and ongoing SLA maintenance to ensure zero downtime.",
      },
    ],
  },
  statistics: {
    heading: "The Company in Numbers",
    items: [
      { value: "$14M+", label: "Operational Capital Saved for Clients" },
      { value: "60+", label: "Enterprise Pipelines Deployed" },
      { value: "12", label: "Specialized Machine Learning Engineers" },
      { value: "0", label: "Public Data Leaks" },
    ],
  },
  team: {
    heading: "Our team",
    subcopy:
      "The engineering cell behind your infrastructure. A dense team of systems architects, data specialists, and interaction developers focused entirely on scaling your operational leverage.",
    members: [
      {
        name: "Stefan Holm",
        role: "CEO & Co-Founder",
        photo: "/t/stackgrid/images/portrait-aman-patel.png",
      },
      {
        name: "Ron Bilevich",
        role: "Lead Systems Architect",
        photo: "/t/stackgrid/images/team-ron-bilevich.png",
      },
      {
        name: "Marek Novak",
        role: "Principal Data & AI Infrastructure Engineer",
        photo: "/t/stackgrid/images/team-marek-novak.png",
      },
      {
        name: "Lukas Weber",
        role: "Senior Full-Stack Interaction Developer",
        photo: "/t/stackgrid/images/team-lukas-weber.png",
      },
      {
        name: "Anders Jensen",
        role: "Cloud Infrastructure Specialist",
        photo: "/t/stackgrid/images/portrait-aman-patel.png",
      },
      {
        name: "Mateo Silva",
        role: "Frontend Interaction Engineer",
        photo: "/t/stackgrid/images/team-ron-bilevich.png",
      },
      {
        name: "Julian Krause",
        role: "Technical Project Manager",
        photo: "/t/stackgrid/images/team-marek-novak.png",
      },
      {
        name: "Thomas Wright",
        role: "Backend Systems Developer",
        photo: "/t/stackgrid/images/team-lukas-weber.png",
      },
    ] satisfies TeamMember[],
  },
} as const;

/* ------------------------- case studies ------------------------- */

export type CaseStudy = {
  slug: string;
  title: string;
  industry: string;
  date: string;
  summary: string;
  thumbnail: { src: string; alt: string };
  metrics: { value: string; label: string }[];
  friction: string[];
  blueprint: string[];
  stack: string[];
  testimonialCompany: string;
};

export const caseStudiesIndex = {
  eyebrow: "Case studies",
  heading: "Case studies",
  subcopy:
    "Explore the specific architecture blueprints, data metrics, and works we done.",
  allHeading: "All case studies",
  allSubcopy: "Explore all of our case studies",
  ctaLabel: "Read Case Study",
  sections: {
    friction: "The Operational Friction",
    blueprint: "The Architecture Blueprint",
    stack: "The Tech Stack",
    testimonial: "Client Testimonial",
  },
} as const;

export const caseStudies: CaseStudy[] = [
  {
    slug: "replacing-legacy-erp-invoicing-bottlenecks-with-an-autonomous-middleware-pipeline",
    title:
      "Replacing Legacy ERP Invoicing Bottlenecks with an Autonomous Middleware Pipeline",
    industry: "Logistics & Global Supply Chain",
    date: "July 20, 2026",
    summary:
      "Bypassed manual invoicing friction for a global supply chain firm by deploying an event-driven middleware orchestration layer that cuts processing time from 48 hours to 11 minutes.",
    thumbnail: {
      src: "/t/stackgrid/images/case-simplify-digital-co-thumbnail.png",
      alt: "Simplify Digital Co Thumbnail",
    },
    metrics: [
      { value: "0%", label: "Manual Human Intervention Rate" },
      { value: "11 mins", label: "Average Batch Processing Time" },
      { value: "$142,000+", label: "Annual Late-Fee Penalties Eliminated" },
    ],
    friction: [
      "Simplify Digital Co. was processing upwards of 4,000 multi-currency, cross-border customs invoices every single week. Their legacy Enterprise Resource Planning (ERP) platform lacked native intelligent automation, requiring five full-time operational data clerks to manually extract lines of nested line-item data, verify raw totals against corresponding digital purchase orders, and flag currency variances. This manual entry bottleneck delayed logistics routing by up to 48 hours per batch. Crucially, human transcription typos frequently triggered compliance discrepancies at customs checkpoints, resulting in steep operational fines and supply-chain logjams that choked their weekly throughput.",
    ],
    blueprint: [
      "We designed and engineered a custom, event-driven middleware orchestration layer that connects directly to Simplify Digital Co.’s internal email servers and secure file transfer protocols via private webhooks. When a raw invoice payload lands, it triggers a multi-modal data pipeline that strips out metadata and flattens nested tabular document arrays.",
      "The ingestion engine streams the data blocks through an isolated instance of Claued 3.5 Sonnex to convert unstructured text into explicit, schema-validated JSON arrays. To ensure total operational stability, the pipeline processes data through a strict deterministic verification layer. This layer dynamically queries the company's central SQL ledger, cross-checks unit prices against historical contracts, runs tax calculations, and logs the execution metrics. If the values align within a strict 0.01% error margin, the system automatically executes a state mutation in the client's live accounting database, completing the transaction ledger instantly without a human ever touching a keyboard.",
    ],
    stack: ["Redish DB", "Cobra", "Kuber Nets", "AMS", "Chain Lang", "Metax"],
    testimonialCompany: "Simplify Digital Co",
  },
  {
    slug: "building-a-context-aware-compliant-llm-agent-for-high-volume-support-deflection",
    title:
      "Building a Context-Aware, Compliant LLM Agent for High-Volume Support Deflection",
    industry: "FinTech",
    date: "April 3, 2026",
    summary:
      "Engineered a stateful conversational AI agent trained strictly on proprietary banking databases to autonomously resolve Tier-1 helpdesk tickets without regulatory breaches.",
    thumbnail: {
      src: "/t/stackgrid/images/case-coretech-systems-thumbnail.png",
      alt: "CoreTech System Thumbnail",
    },
    metrics: [
      { value: "82%", label: "Helpdesk Deflection Rate" },
      { value: "< 45s", label: "Average Resolution Time" },
      { value: "0", label: "Compliance Breaches" },
    ],
    friction: [
      "CoreTech Systems, a rapidly scaling digital banking platform, experienced an exponential surge in Tier-1 customer support requests regarding account configurations, balance discrepancies, and basic transaction disputes. Their human engineering and customer success queues were severely backed up, causing standard ticket resolution times to spiral past 36 hours. Legacy rule-based chatbots failed completely at comprehending conversational nuances, frustrating premium users and driving up customer churn rates. However, because they operate in FinTech, implementing an off-the-shelf LLM was a massive regulatory risk; a single “hallucinated” piece of financial advice could trigger severe legal penalties.",
    ],
    blueprint: [
      "We engineered a highly restrictive, stateful conversational AI agent utilizing a localized Retrieval-Augmented Generation (RAG) architecture. Instead of relying on a foundational model's pre-trained knowledge, the agent is strictly tethered to CoreTech's proprietary product databases, security boundary documentation, and historical Zendesk transaction paths. The agent operates inside a custom validation framework that monitors semantic inputs in real-time. We utilized deterministic function calling to allow the model to pull live transaction data securely via secure API endpoints. The guardrails are absolute: if a user query falls outside the vectorized documentation or requires account mutation (like transferring funds), the system immediately halts generation and forwards the complex edge case to human personnel, pre-compiling the entire historical memory context so the human agent loses zero time.",
    ],
    stack: ["Postgrass SQL", "Noder JS", "Cobra", "Asure", "Metax"],
    testimonialCompany: "CoreTech Systems",
  },
  {
    slug: "deploying-predictive-ai-to-automate-customer-success-and-eradicate-churn",
    title:
      "Deploying Predictive AI to Automate Customer Success and Eradicate Churn",
    industry: "B2B SaaS",
    date: "January 18, 2026",
    summary:
      "Engineered a predictive AI middleware pipeline that analyzes real-time product telemetry to autonomously trigger personalized onboarding interventions, drastically reducing enterprise user churn.",
    thumbnail: {
      src: "/t/stackgrid/images/case-velosite-thumbnail.png",
      alt: "Velosite Thumbnail",
    },
    metrics: [
      { value: "40%", label: "Reduction in Churn Risk" },
      { value: "< 2 mins", label: "Autonomous Intervention Latency" },
      { value: "100%", label: "Automated Health Scoring" },
    ],
    friction: [
      "Velosite SaaS was acquiring enterprise users rapidly, but their Customer Success team was drowning in reactive support operations. Because they lacked real-time, unified visibility into product usage telemetry, they could not identify which high-value clients were at risk of churning until it was too late. Manual “health-check” routines were painfully inefficient, requiring CS reps to dig through siloed Mixpanel dashboards, while generic, static email drip campaigns were being completely ignored by frustrated accounts. The manual latency between a user experiencing platform friction and a CS rep reaching out was costing the company significant recurring revenue.",
    ],
    blueprint: [
      "We deployed an intelligent, event-driven retention architecture that bridges the gap between raw data and customer communication. The system ingests raw product usage telemetry (clicks, feature adoption rates, session durations) directly via secure webhooks into a centralized vector environment.",
      "A custom pipeline continuously analyzes this behavioral data against historical churn patterns. When the system detects a “drop-off signature”—for instance, a user failing to configure a core integration within 48 hours of account creation—it autonomously triggers a hyper-personalized intervention. The middleware queries an LLM to generate a highly specific, context-aware message offering an exact solution to the user's friction point. Simultaneously, it pushes a fully compiled diagnostic brief into the Customer Success team's internal Slack channel, ensuring human reps only step in when high-touch intervention is mathematically necessary.",
    ],
    stack: ["Cobra", "Kuber Nets", "AMS", "Lamma"],
    testimonialCompany: "Velosite",
  },
];

/** The listing page features the ERP study above the "all" grid. */
export const featuredCaseStudySlug = caseStudies[0].slug;

/* ---------------------------- careers ---------------------------- */

export type Job = {
  slug: string;
  title: string;
  summary: string;
  department: string;
  location: string;
  compensation: string;
  mission: string;
  responsibilities: { lead: string; text: string }[];
  requirements: { lead: string; text: string }[];
};

export const careers = {
  heading: "Join the team",
  // Verbatim from the live site — the sentence genuinely ends without a
  // full stop, and the roles/salary bands below are the template's own
  // sample data rather than real openings.
  subcopy:
    "We don't do corporate bureaucracy or open-ended meetings. We are a dense, hyper-focused engineering cell looking for elite architects",
  cta: { label: "Open Roles", href: "/careers#jobs" },
  openHeading: "Open roles",
  openSubcopy:
    "Explore our active technical openings for engineers and developers ready to ship premium, production-grade automation infrastructure.",
  ctaLabel: "View job",
  applyLabel: "Apply here",
  detailHeadings: {
    mission: "Mission",
    responsibilities: "Responsibilities",
    requirements: "Requirements",
    sidebar: "Job Details",
    department: "Department",
    location: "Location",
    compensation: "Compensation",
  },
} as const;

export const jobs: Job[] = [
  {
    slug: "ui-ux-interaction-developer-(ai-interfaces)",
    title: "UI/UX Interaction Developer (AI Interfaces)",
    summary:
      "Transform complex AI orchestrations and node-based data workflows into high-end, low-latency user interfaces and interactive canvases.",
    department: "UI/UX Interaction",
    location: "Remote",
    compensation: "$130,000 – $175,000 USD + Production Hand-off Bonuses",
    mission:
      "Enterprise intelligence is useless if executives cannot control it. Most AI interfaces are ugly, slow, and poorly designed wrappers. Your job is to build the premium frontend layer for Stackgrid's deployments. You will design and code fluid, highly responsive canvases, real-time node graphs, and interactive dashboards that make running autonomous data pipelines feel like playing a video game. You prioritize strict layout logic, structural performance, and flawless micro-interactions.",
    responsibilities: [
      {
        lead: "Engineer Interactive Canvases:",
        text: "Build complex layout architectures featuring canvas panning, absolute coordinate calculations, and node-based visualization components.",
      },
      {
        lead: "Optimize Data Streaming UI:",
        text: "Develop highly performant UI states that elegantly handle real-time token streaming, state mutations, and heavy client-side calculations without dropping below 60fps.",
      },
      {
        lead: "Maintain Design Systems:",
        text: "Translate high-fidelity Figma blueprints into pixel-perfect, production-grade React components using Tailwind CSS and tabular lining variables.",
      },
      {
        lead: "Choreograph Motion:",
        text: "Build custom, logic-driven animation sequences with Framer Motion to clearly represent non-linear AI decision-making paths and backend processes.",
      },
    ],
    requirements: [
      {
        lead: "Interaction Portfolio:",
        text: "A verified portfolio demonstrating extreme control over complex web interactions, layout calculations, and fluid animations using Framer Motion or raw CSS/JS.",
      },
      {
        lead: "Frontend Precision:",
        text: "Expert-level fluency in React, Next.js, and TypeScript. You must understand how to optimize rendering pipelines, manage complex local component states, and prevent unnecessary DOM re-renders.",
      },
      {
        lead: "Typography & Scale Obsession:",
        text: "You care about the details. You notice when borders are off by 0.5px, when text alignment lacks tabular nums for data ledgers, and when spacing scales lack consistency.",
      },
    ],
  },
  {
    slug: "lead-rag-data-infrastructure-engineer",
    title: "Lead RAG & Data Infrastructure Engineer",
    summary:
      "Engineer secure, high-scale vector retrieval architectures and data ingestion pipelines to power private enterprise context injection engines.",
    department: "Data Architecture",
    location: "Remote",
    compensation: "$160,000 – $210,000 USD + Production Hand-off Bonuses",
    mission:
      "Large language models are completely useless to an enterprise without accurate, secure, real-time context. Your job is to build the pipelines that feed them. As a Lead RAG & Data Infrastructure Engineer at Stackgrid, you will design the storage and retrieval layers that allow models to query millions of private, un-structured enterprise documents in milliseconds. You will be directly responsible for data sovereignty, ensuring zero data retention outside of ring-fenced client networks.",
    responsibilities: [
      {
        lead: "Architect Vector Pipelines:",
        text: "Design and optimize high-throughput data ingestion pipelines that clean, chunk, embed, and index massive corpuses of unstructured enterprise data.",
      },
      {
        lead: "Optimize Retrieval Performance:",
        text: "Implement and test advanced RAG strategies (hierarchical node parsing, hybrid keyword/vector search, re-ranking models) to drive down context latency below 500ms.",
      },
      {
        lead: "Enforce Data Sovereignty:",
        text: "Deploy ring-fenced vector databases (Qdrant, Pinecone, pgvector) inside secure cloud environments (AWS Nitro Enclaves or client-managed VPCs) ensuring absolute isolation from public web scrapers.",
      },
      {
        lead: "Manage Embedding Latency:",
        text: "Monitor and optimize embedding compute costs and model drift, ensuring data indices remain dynamically synced with the clients' live production databases.",
      },
    ],
    requirements: [
      {
        lead: "Vector Database Mastery:",
        text: "Definitive, hands-on experience deploying and scaling vector databases in production environments handling millions of high-dimensional vectors.",
      },
      {
        lead: "Advanced Chunking Strategy:",
        text: "You understand that basic token-splitting doesn't work for complex corporate data. You must possess deep knowledge of semantic chunking, parent-child retrieval, and metadata filtering.",
      },
      {
        lead: "Infrastructure Pragmatism:",
        text: "Strong command of containerization (Docker) and enterprise cloud architecture (AWS/GCP). You care deeply about data privacy laws, compliance boundaries (SOC 2, GDPR), and encrypted storage pipelines.",
      },
    ],
  },
  {
    slug: "lead-ai-automation-engineer",
    title: "Lead AI Automation Engineer",
    summary:
      "Architect and deploy high-throughput, multi-agent pipelines and fault-tolerant middleware for enterprise clients. Replace legacy operational friction with production-grade code.",
    department: "Engineering",
    location: "Remote",
    compensation: "$150,000 – $195,000 USD + Production Hand-off Bonuses",
    mission:
      "You are being hired to permanently replace manual corporate labor with bulletproof, production-grade code. At Stackgrid, we do not build basic wrappers, experimental toys, or hypothetical proof-of-concepts. We build complex, multi-agent orchestrations and high-throughput automated middleware for enterprises handling millions in revenue. Your objective is to dissect fragmented, legacy operational workflows and design the secure, autonomous pipelines that eliminate human latency entirely.",
    responsibilities: [
      {
        lead: "Architect Multi-Agent Orchestrations:",
        text: "Design, develop, and optimize stateful, context-aware LLM agents utilizing advanced deterministic function-calling mechanisms.",
      },
      {
        lead: "Build Fault-Tolerant Middleware:",
        text: "Engineer serverless middleware layers capable of handling aggressive API rate-limiting, token-consumption tracking, and automated fallback routines with absolute zero downtime.",
      },
      {
        lead: "Pipeline Optimization:",
        text: "Connect disparate enterprise APIs and legacy SQL/NoSQL databases into cohesive, event-driven data flows that run without data silos.",
      },
      {
        lead: "Production Monitoring:",
        text: "Implement rigorous telemetry tracking to monitor system latency, error spikes, prompt drift, and hallucination rates across all active deployments.",
      },
    ],
    requirements: [
      {
        lead: "Production Experience:",
        text: "You must have a verified portfolio demonstrating that you have shipped LLM-powered applications or automated middleware systems into a live production environment serving actual user traffic.",
      },
      {
        lead: "Technical Dominance:",
        text: "Expert-level fluency in Python and TypeScript. You should be completely comfortable writing custom API orchestrations, working raw within serverless infrastructure, and optimizing heavy vector queries.",
      },
      {
        lead: "Architectural Pragmatism:",
        text: "You prioritize data security, input sanitation, and predictable software outputs over AI hype. You write lean, maintainable code and design architectures that do not rely on fragile prompt formatting to survive production loads.",
      },
    ],
  },
];

/* ---------------------------- contact ---------------------------- */

export const contact = {
  heading: "Contact us",
  subcopy:
    "Drop your technical parameters below, and an engineering lead will review your architecture layout within 24 hours.",
  fields: [
    {
      name: "firstName",
      label: "First Name",
      type: "text",
      placeholder: OWNER_DETAILS_TO_REPLACE.formPlaceholders.firstName,
      half: true,
    },
    {
      name: "lastName",
      label: "Last Name",
      type: "text",
      placeholder: OWNER_DETAILS_TO_REPLACE.formPlaceholders.lastName,
      half: true,
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: OWNER_DETAILS_TO_REPLACE.formPlaceholders.email,
      half: false,
    },
    {
      name: "phone",
      label: "Phone",
      type: "tel",
      placeholder: OWNER_DETAILS_TO_REPLACE.phone,
      half: false,
    },
  ],
  messageField: {
    name: "message",
    label: "Message",
    placeholder: "Type your message here...",
  },
  submitLabel: "Submit",
  reach: {
    heading: "Reach out to us",
    subcopy:
      "You can reach out to us via our support email or phone number or even an office visit",
    cards: [
      {
        label: "Email",
        value: `${OWNER_DETAILS_TO_REPLACE.supportEmail}.`,
        href: `mailto:${OWNER_DETAILS_TO_REPLACE.supportEmail}`,
      },
      {
        label: "Phone",
        value: OWNER_DETAILS_TO_REPLACE.phone,
        href: `tel:${OWNER_DETAILS_TO_REPLACE.phone.replace(/[^+\d]/g, "")}`,
      },
      { label: "Office", value: OWNER_DETAILS_TO_REPLACE.office, href: null },
    ],
  },
  faq: {
    heading: "Frequently Asked Questions",
    subcopy:
      "Answers to immediate onboarding parameters, engineering timelines, and technical requirements before launching your initial infrastructure audit.",
    items: [
      {
        question: "Will I be speaking with a sales representative?",
        answer:
          "No. We do not employ traditional salespeople. Your initial 30-minute discovery call will be conducted directly with a Lead Systems Architect.",
      },
      {
        question: "What do I need to prepare for our initial assessment?",
        answer:
          "Upon booking, you will receive a brief technical questionnaire regarding your current software stack and manual bottlenecks. We require this to be completed 24 hours prior to our meeting so we can bypass generic introductions and get straight to architectural solutions.",
      },
      {
        question:
          "Will you sign an NDA before we discuss our internal processes?",
        answer:
          "Absolutely. We understand we are dealing with highly sensitive operational data. A standard mutual Non-Disclosure Agreement (NDA) is automatically attached to your calendar booking confirmation, fully executed before we speak.",
      },
      {
        question: "Do you charge for the initial discovery call?",
        answer:
          "The introductory 30-minute feasibility call is completely free. If we determine your infrastructure is ready for automation, we will then propose a flat-fee Infrastructure Audit as the formal Phase 01 engagement.",
      },
      {
        question:
          "Will deploying this infrastructure disrupt our current daily operations?",
        answer:
          "No. We do not touch your live production environment during the build phase. We engineer, train, and stress-test your custom AI agents and middleware in a completely secure, parallel sandbox. You experience absolute zero downtime. We only execute the final switchover once the system is fully verified and your staff is completely trained on the new workflow.",
      },
    ] satisfies Faq[],
  },
} as const;

/* ---------------------------- 404 ---------------------------- */

export const notFound = {
  heading: "Not Found",
  subcopy:
    "This page does not exist, but we definitely exist to engineer your system with AI.",
  cta: { label: "Back to home", href: "/" },
} as const;

/* ---------------------------- legal ---------------------------- */

export type LegalBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; lead?: string; text: string }
  | { kind: "bullets"; items: { lead?: string; text: string }[] };

export type LegalPage = {
  slug: string;
  title: string;
  intro: string[];
  blocks: LegalBlock[];
};

export const privacyPolicy: LegalPage = {
  slug: "privacy-policy",
  title: "Privacy Policy",
  intro: [
    'Stackgrid ("we," "our," or "us") is committed to protecting your privacy and ensuring absolute data sovereignty. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website stackgrid.framer.website and engage with our technical consulting and AI deployment services.',
    "Please read this Privacy Policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site or engage our services.",
  ],
  blocks: [
    // NOTE: this heading reads "The Operational Friction" on the live
    // site — a leftover from the case-study template. Kept verbatim.
    { kind: "heading", text: "The Operational Friction" },
    {
      kind: "paragraph",
      text: "We may collect information about you in a variety of ways. The information we may collect includes:",
    },
    {
      kind: "paragraph",
      lead: "Personal Data:",
      text: "Personally identifiable information, such as your name, shipping address, email address, telephone number, and corporate title, that you voluntarily give to us when you book an assessment, sign up for our services, or contact us directly.",
    },
    {
      kind: "paragraph",
      lead: "Client Operational Data:",
      text: "To execute an Infrastructure Audit or System Architecture Build, we may securely collect proprietary business data. This includes but is not limited to: API keys, legacy architecture schematics, internal workflow documentation, and sandbox datasets required for testing custom automated pipelines.",
    },
    {
      kind: "paragraph",
      lead: "Derivative Data:",
      text: "Information our servers automatically collect when you access the site, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Site.",
    },
    {
      kind: "heading",
      text: "Artificial Intelligence & Data Sovereignty Protocol",
    },
    {
      kind: "paragraph",
      text: "As an enterprise-grade AI infrastructure firm, we adhere to strict data handling protocols regarding Large Language Models (LLMs):",
    },
    {
      kind: "bullets",
      items: [
        {
          lead: "Public Model Isolation:",
          text: "We explicitly guarantee that any proprietary company data, documents, or customer information processed through our custom Retrieval-Augmented Generation (RAG) systems or middleware pipelines will never be used to train, fine-tune, or improve public LLMs (e.g., OpenAI, Anthropic, Google).",
        },
        {
          lead: "Zero-Data Retention (ZDR):",
          text: "API endpoints and automated routing systems deployed by Stackgrid are configured for zero-data retention. Data passing through orchestration layers is held only in temporary memory to execute the automation and is immediately purged upon task completion.",
        },
      ],
    },
    { kind: "heading", text: "How We Use Your Information" },
    {
      kind: "paragraph",
      text: "Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you to:",
    },
    {
      kind: "bullets",
      items: [
        {
          text: "Fulfill and manage purchases, orders, payments, and other transactions related to our deployment sprints.",
        },
        { text: "Create and manage your enterprise account and SLA billing." },
        {
          text: "Deliver targeted administrative notices and infrastructure updates.",
        },
        {
          text: "Monitor system performance, API latency, and prompt drift (using anonymized telemetry data).",
        },
        { text: "Respond to product and customer service requests." },
      ],
    },
    { kind: "heading", text: "Disclosure of Your Information" },
    {
      kind: "paragraph",
      text: "We do not sell, trade, or rent your operational data. We may share information we have collected about you in certain situations:",
    },
    {
      kind: "paragraph",
      lead: "Third-Party Sub-Processors:",
      text: "To deploy our architectures, we utilize enterprise-grade sub-processors for cloud hosting, middleware routing, and vector databases (e.g., AWS, Pinecone, Google Cloud). We strictly mandate that all third-party infrastructure providers comply with SOC 2 Type II and GDPR standards, and we execute custom Data Processing Agreements (DPAs) that prohibit them from accessing or indexing your siloed data.",
    },
    {
      kind: "paragraph",
      lead: "By Law or to Protect Rights:",
      text: "If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.",
    },
    { kind: "heading", text: "Tracking Technologies" },
    {
      kind: "paragraph",
      lead: "Cookies and Web Beacons:",
      text: "We may use cookies, web beacons, tracking pixels, and other tracking technologies on the Site to help customize the Site and improve your experience. Most browsers are set to accept cookies by default. You can remove or reject cookies, but be aware that such action could affect the availability and functionality of the Site.",
    },
    { kind: "heading", text: "Data Security" },
    {
      kind: "paragraph",
      text: "We use administrative, technical, and physical security measures to help protect your personal and corporate data. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse. Our internal databases utilize AES-256 encryption.",
    },
    { kind: "heading", text: "Policy for Minors" },
    {
      kind: "paragraph",
      text: "We do not knowingly solicit information from or market to children under the age of 18. Our services are strictly designed for B2B enterprise engagements. If we learn we have collected personal information from a minor without verification of parental consent, we will delete that information as quickly as possible.",
    },
    { kind: "heading", text: "Your Privacy Rights (GDPR & CCPA)" },
    {
      kind: "paragraph",
      text: "Depending on your location, you may have the right to:",
    },
    {
      kind: "bullets",
      items: [
        { text: "Request access and obtain a copy of your personal information." },
        { text: "Request rectification or erasure of your personal data." },
        { text: "Restrict the processing of your personal information." },
        { text: "Data portability." },
      ],
    },
    {
      kind: "paragraph",
      text: "To make a request regarding your data, please use the contact information provided below. We will consider and act upon any request in accordance with applicable data protection laws.",
    },
    { kind: "heading", text: "Data Handoff & Erasure" },
    {
      kind: "paragraph",
      text: "Upon completion of a deployment sprint or termination of an Ongoing SLA, Stackgrid initiates a complete infrastructure handoff. All prototype environments, temporary vector databases, and sandbox testing data held on our servers are permanently destroyed. You retain absolute ownership and control of the production infrastructure.",
    },
    { kind: "heading", text: "Contact Us" },
    {
      kind: "paragraph",
      text: "If you have questions or comments about this Privacy Policy, require a Data Processing Agreement (DPA), or need to speak with our Security Architecture team regarding our compliance framework, please contact us.",
    },
  ],
};

export const termsAndConditions: LegalPage = {
  slug: "terms-and-conditions",
  title: "Terms and Conditions",
  intro: [
    'These Terms & Conditions ("Terms") constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("Client," "you," "your") and Stackgrid ("we," "us," "our"), concerning your access to and use of our website stackgrid.framer.website as well as any technical consulting, infrastructure audits, system architectures, or Ongoing Service Level Agreements (SLAs) provided by us.',
    "By engaging our services or accessing our site, you acknowledge that you have read, understood, and agree to be bound by all of these Terms. If you do not agree with all of these Terms, you are expressly prohibited from using our services and must discontinue use immediately.",
  ],
  blocks: [
    { kind: "heading", text: "Scope of Services & Engagement Model" },
    {
      kind: "paragraph",
      text: "Stackgrid operates as an engineering consultancy deploying custom software, middleware, and artificial intelligence infrastructure. Our engagements are divided into distinct operational phases:",
    },
    {
      kind: "bullets",
      items: [
        {
          lead: "Phase 01: Infrastructure Audit (Paid Discovery):",
          text: "A definitive technical evaluation and architectural roadmap.",
        },
        {
          lead: "Phase 02: System Architecture (The Build Sprint):",
          text: "Bounded technical sprints to build and deploy custom automated pipelines and secure language model environments.",
        },
        {
          lead: "Phase 03: Enterprise SLA (Ongoing Optimization):",
          text: "Monthly recurring technical maintenance, model upgrades, and telemetry monitoring.",
        },
      ],
    },
    { kind: "heading", text: "Fees, Payments, and Billing Protocols" },
    {
      kind: "bullets",
      items: [
        {
          lead: "Fixed-Fee Sprints:",
          text: "Sprints for Audits and System Architecture builds are billed at a fixed rate, split into structured milestone payments (e.g., 50% upfront, 50% upon deployment handover), unless dictated otherwise in the specific SOW.",
        },
        {
          lead: "SLA Retainers:",
          text: "Ongoing maintenance fees are billed on a monthly recurring basis, processed automatically 5 days prior to the start of the service month.",
        },
        {
          lead: "Late Payments & Deployment Pauses:",
          text: "We respect engineering deadlines, but we do not work for free. If any invoice remains unpaid for more than seven (7) business days past its due date, Stackgrid reserves the right to immediately pause all active deployment pipelines, staging environments, and ongoing SLA support until the balance is cleared in full.",
        },
        {
          lead: "Refund Policy:",
          text: "Due to the resource-intensive and highly specialized nature of custom software engineering, all fees paid to Stackgrid are strictly non-refundable.",
        },
      ],
    },
    { kind: "heading", text: "Intellectual Property (IP) Rights & Code Ownership" },
    {
      kind: "bullets",
      items: [
        {
          lead: "Client Deliverables:",
          text: "Upon full and final payment of all outstanding invoices, Stackgrid transfers exclusive ownership of the custom code, custom documentation, and private database configurations explicitly engineered for the Client during the project sprint.",
        },
        {
          lead: "Stackgrid Core Scaffolding:",
          text: "Stackgrid retains absolute ownership, copyright, and intellectual property rights over any pre-existing software libraries, proprietary internal frameworks, utility functions, deployment scripts, or middleware templates used to build the Client’s infrastructure. The Client is granted a perpetual, royalty-free, non-exclusive license to use this core scaffolding internally within their deployed infrastructure.",
        },
      ],
    },
    { kind: "heading", text: "Client Cooperation & API Dependencies" },
    {
      kind: "bullets",
      items: [
        {
          lead: "Technical Access:",
          text: "Our engineers cannot build systems without access. The Client agrees to provide timely access to internal technical documentation, legacy databases, code repositories, and third-party API credentials necessary for the deployment.",
        },
        {
          lead: "Deadline Adjustments:",
          text: "If a project milestone is delayed due to the Client’s failure to provide required credentials, data assets, or feedback within forty-eight (48) hours of an engineering request, the delivery schedule will automatically shift out by an equivalent duration.",
        },
      ],
    },
    { kind: "heading", text: "Limitation of Liability & AI Operational Realities" },
    {
      kind: "paragraph",
      text: "This section governs the unique technical liabilities inherent to deploying large language models and autonomous software:",
    },
    {
      kind: "bullets",
      items: [
        {
          lead: "Third-Party Outages:",
          text: "Stackgrid engineers automated systems that rely on external foundational models and cloud providers (e.g., OpenAI, Anthropic, AWS, Google Cloud). We are strictly not liable for any financial losses, operational delays, or broken workflows caused by third-party API deprecations, rate limits, or unexpected service outages.",
        },
        {
          lead: "Model Hallucinations and Stochastic Outputs:",
          text: "Client acknowledges that large language models process data probabilistically. While Stackgrid implements advanced prompt guardrails, validation layers, and Retrieval-Augmented Generation (RAG) to minimize errors, we do not warrant or guarantee that an AI agent's outputs will be 100% accurate, error-free, or free of hallucinations at all times. The Client is responsible for maintaining final operational oversight over AI-generated outputs.",
        },
        {
          lead: "Maximum Liability Cap:",
          text: "To the maximum extent permitted by applicable law, Stackgrid’s total aggregate liability for any claims arising out of or relating to these Terms, whether in contract, tort, or otherwise, shall be strictly limited to the total amount of fees paid by the Client to Stackgrid during the three (3) months immediately preceding the event giving rise to the claim.",
        },
      ],
    },
    { kind: "heading", text: "Confidentiality & Non-Disclosure" },
    {
      kind: "paragraph",
      text: "Both parties agree to hold in strict confidence all proprietary technical, business, and financial data disclosed during the engagement. Stackgrid will execute an independent, mutual Non-Disclosure Agreement (NDA) with the Client prior to accessing any live production databases or sensitive enterprise environments.",
    },
    { kind: "heading", text: "Termination of Services" },
    {
      kind: "bullets",
      items: [
        {
          lead: "Sprint Termination:",
          text: "Sprints and fixed-fee builds cannot be canceled mid-cycle once engineering resources have been allocated.",
        },
        {
          lead: "SLA Cancellation:",
          text: "Ongoing monthly Enterprise SLAs may be terminated by either party providing thirty (30) days written notice prior to the next billing cycle. Upon termination, Stackgrid will execute a clean infrastructure handoff and securely purge all sandbox environments as outlined in our Privacy Policy.",
        },
      ],
    },
    { kind: "heading", text: "Governing Law" },
    {
      // Verbatim — the live site still carries the unfilled placeholder.
      kind: "paragraph",
      text: "These Terms and any separate agreements whereby we provide you services shall be governed by and construed in accordance with the laws of [Insert State/Country, e.g., the State of Delaware, United States], without regard to its conflict of law principles.",
    },
    { kind: "heading", text: "Contact & Technical Audits" },
    {
      kind: "paragraph",
      text: `If you have any questions regarding these Terms, require clarification on technical liability boundaries, or need to discuss custom enterprise clauses, please contact our legal and engineering review desk at: ${OWNER_DETAILS_TO_REPLACE.legalEmail}`,
    },
  ],
};

export const acceptableUse: LegalPage = {
  slug: "acceptable-use",
  title: "Acceptable Use Policy",
  intro: [
    'This Acceptable Use Policy ("AUP") outlines the strict rules and behavioral boundaries governing the use of any custom software, Large Language Model (LLM) architectures, automated middleware, API integrations, and ongoing server environments engineered, deployed, or maintained by Stackgrid ("we," "us," "our").',
    'This policy applies universally to the entity engaging our services ("Client," "you," "your") and any end-users, employees, or customers accessing the applications built by Stackgrid. By utilizing our deployed infrastructure, you agree to absolute compliance with this AUP.',
  ],
  blocks: [
    { kind: "heading", text: "Prohibited Operational Activities" },
    {
      kind: "paragraph",
      text: "You are strictly prohibited from utilizing any system architecture, database layer, or AI agent deployed by Stackgrid to conduct, facilitate, or promote the following high-risk activities:",
    },
    {
      kind: "bullets",
      items: [
        {
          lead: "Illegal & Regulated Industries:",
          text: "Processing data related to illegal gambling, unauthorized firearms manufacturing, human trafficking, unlicensed pharmaceutical distribution, or any activity violating local, national, or international laws.",
        },
        {
          lead: "Malicious Cyber Operations:",
          text: "Utilizing automated pipelines to distribute malware, orchestrate distributed denial-of-service (DDoS) attacks, execute phishing campaigns, or harvest credentials through autonomous scanning bots.",
        },
        {
          lead: "System Overloading & API Misuse:",
          text: "Intentionally flooding our middleware infrastructure or connected third-party APIs (such as OpenAI or AWS) with artificial traffic designed to cause service denial, rate-limiting lockouts, or catastrophic compute inflation.",
        },
      ],
    },
    {
      kind: "heading",
      text: "AI Safety, Manipulation, and Exploitation Boundaries",
    },
    {
      kind: "paragraph",
      text: "Because Stackgrid engineers probabilistic language model environments and autonomous agents, you agree to respect the safety guardrails embedded within the software. Prohibited behavior includes:",
    },
    {
      kind: "bullets",
      items: [
        {
          lead: "Adversarial Prompting & Jailbreaking:",
          text: "Intentionally executing prompt injection attacks, role-play overrides, or adversarial input sequences designed to bypass the alignment layer, security parameters, or system prompts established by our engineering team.",
        },
        {
          lead: "Deceptive Automation & Disinformation:",
          text: "Using custom text-generation models to generate deceptive political propaganda, deepfake media, synthetic reviews, or automated documentation designed to intentionally mislead public markets or regulatory bodies.",
        },
        {
          lead: "Unauthorized Scraping & Data Mining:",
          text: "Configuring deployed middleware to scrape, extract, or mine copyrighted materials or proprietary web databases in explicit violation of those target platforms' robots.txt files or terms of service.",
        },
      ],
    },
    {
      kind: "heading",
      text: "Intellectual Property Exploitation & Security Prohibitions",
    },
    {
      kind: "paragraph",
      text: "The core scaffolding and proprietary scripts utilized to run your infrastructure are protected assets. The following actions are strictly forbidden:",
    },
    {
      kind: "bullets",
      items: [
        {
          lead: "Scaffolding Reverse-Engineering:",
          text: "Attempting to decompile, reverse-engineer, or isolate the proprietary middleware frameworks, routing algorithms, or custom vector indexing mechanisms owned by Stackgrid to recreate a competing product.",
        },
        {
          lead: "Unsanctioned Penetration Testing:",
          text: "Launching third-party security audits, adversarial red-teaming scripts, or stress-testing protocols against our live operational environments without obtaining prior, written technical authorization from our Lead Security Architect.",
        },
      ],
    },
    {
      kind: "heading",
      text: "Foundational Model Alignment (Third-Party Compliance)",
    },
    {
      kind: "paragraph",
      text: "Stackgrid builds integrated systems that rely heavily on foundational AI providers. You must strictly ensure that your operational use of any deployed tool complies entirely with the usage policies of our sub-processors, including but not limited to:",
    },
    {
      kind: "bullets",
      items: [
        { text: "The Anthropic Acceptable Use Policy" },
        { text: "The OpenAI Usage Policies" },
        { text: "The Amazon Web Services (AWS) Acceptable Use Policy" },
      ],
    },
    {
      kind: "paragraph",
      text: "Any violation of a foundational provider's terms that results in a service suspension or account termination is the sole operational and financial liability of the Client.",
    },
    {
      kind: "heading",
      text: "Material Enforcement & Infrastructure Termination",
    },
    {
      kind: "paragraph",
      text: "Stackgrid maintains rigorous system logging and telemetry tracking to monitor the stability, error rates, and drift of deployed pipelines. If we detect behavioral anomalies or absolute proof of a violation of this AUP, we reserve the right to enforce the following measures:",
    },
    {
      kind: "bullets",
      items: [
        {
          lead: "Immediate API Suspension:",
          text: "We may instantly deactivate your access keys, isolate staging environments, and pause automated data synchronization pipelines without prior notice.",
        },
        {
          lead: "Contract Termination:",
          text: "Severe or repeated violations will result in the immediate cancellation of your Ongoing SLA and the forfeiture of any remaining milestone deliverables, without eligibility for a refund.",
        },
      ],
    },
    { kind: "heading", text: "Reporting Violations & Technical Inquiries" },
    {
      kind: "paragraph",
      text: `To report a suspected system exploit, data leak, or breach of this Acceptable Use Policy originating from an infrastructure system engineered by our team, please contact our security review desk immediately ${OWNER_DETAILS_TO_REPLACE.securityEmail}`,
    },
  ],
};

export const legalPages = [privacyPolicy, termsAndConditions, acceptableUse];
