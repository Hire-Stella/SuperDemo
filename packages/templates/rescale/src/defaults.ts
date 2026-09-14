// ============================================================================
// VECTORA — single source of truth for site content.
// Recreated from the live Framer site (rescale.framer.ai) with the owner's
// authorization. Third-party template-marketplace / affiliate links that
// appeared on the live nav ("Use For Free" -> framer.link, "Book a Call" ->
// an unrelated Calendly) have been intentionally replaced with in-app
// destinations (#pricing / /contact) — see README notes in the task brief.
// ============================================================================

export type NavLink = {
  label: string;
  href: string;
};

export type SocialLink = {
  label: string;
  href: string;
  icon: "x" | "linkedin" | "instagram" | "youtube" | "discord";
};

export type HeroMiniStat = {
  label: string;
  target: number;
  suffix: string;
};

export type FeatureTag = {
  label: string;
};

export type ProcessStep = {
  step: string;
  title: string;
  description: string;
};

export type IntegrationHighlight = {
  value: string;
  label: string;
};

export type PerformanceStat = {
  label: string;
  target: number;
  prefix?: string;
  suffix: string;
};

export type Founder = {
  name: string;
  role: string;
  photo: string;
  socials: SocialLink[];
};

export type Testimonial = {
  name: string;
  role: string;
  company: string;
  quote: string;
  photo: string;
};

export type PricingFeature = string;

export type PricingTier = {
  name: string;
  monthlyPrice: number;
  features: PricingFeature[];
  ctaLabel: string;
  ctaHref: string;
  featured?: boolean;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type JournalPost = {
  slug: string;
  title: string;
  date: string;
  readingTime: string;
  excerpt: string;
  thumbnail: string;
  intro: string;
  body: {
    heading?: string;
    paragraph?: string;
    list?: string[];
    quote?: { text: string; attribution: string };
  }[];
  closingLine: string;
};

// ----------------------------------------------------------------------------
// Nav / socials
// ----------------------------------------------------------------------------

export const navLinks: NavLink[] = [
  { label: "Features", href: "/#features" },
  { label: "How it Works", href: "/#how-it-works" },
  { label: "Integration", href: "/#integration" },
  { label: "Performance", href: "/#performance" },
  { label: "About Us", href: "/#about-us" },
  { label: "Client Insights", href: "/#client-insights" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
  { label: "Journal", href: "/journal" },
];

export const socialLinks: SocialLink[] = [
  { label: "X (Twitter)", href: "https://www.x.com/tamasbodo", icon: "x" },
  { label: "LinkedIn", href: "https://www.linkedin.com", icon: "linkedin" },
  { label: "Instagram", href: "https://www.instagram.com", icon: "instagram" },
  { label: "YouTube", href: "https://www.youtube.com", icon: "youtube" },
  { label: "Discord", href: "https://www.discord.com", icon: "discord" },
];

export const primaryCtaHref = "/#pricing";
export const primaryCtaLabel = "Use For Free";
export const bookCallHref = "/contact";
export const bookCallLabel = "Book a Call";

// ----------------------------------------------------------------------------
// Hero
// ----------------------------------------------------------------------------

export const heroBadge = "12K+ Growing Businesses";

export const heroHeading = {
  line1: "Amplify",
  highlight1: "your growth",
  line2: "with",
  highlight2: "Smart AI",
  line3: "insights",
};

export const heroSubcopy =
  "You are just one click away from transforming your business with powerful analytics support.";

export const heroClientLogos = [
  "/t/rescale/images/client-logo-1.svg",
  "/t/rescale/images/client-logo-2.svg",
  "/t/rescale/images/client-logo-3.svg",
  "/t/rescale/images/client-logo-4.svg",
  "/t/rescale/images/client-logo-5.svg",
  "/t/rescale/images/client-logo-6.svg",
];

export const heroMiniStats: HeroMiniStat[] = [
  { label: "Growth", target: 87, suffix: "%" },
  { label: "Sales", target: 92, suffix: "%" },
  { label: "Efficiency", target: 78, suffix: "%" },
];

export const heroFloatingTags: FeatureTag[] = [
  { label: "Revenue Analysis" },
  { label: "Sales Performance" },
  { label: "Market Insights" },
  { label: "Custom Reports" },
];

// ----------------------------------------------------------------------------
// Features
// ----------------------------------------------------------------------------

export const featuresEyebrow = "Instantly Connected Growth Partners";
export const featuresMarqueeTags = ["Simple Strategies", "Process Optimisation"];

// ----------------------------------------------------------------------------
// How it works
// ----------------------------------------------------------------------------

export const processSteps: ProcessStep[] = [
  {
    step: "Step 1",
    title: "Sign up & Profile",
    description:
      "Create your account with our guided setup process. Access your personalized dashboard instantly.",
  },
  {
    step: "Step 2",
    title: "Personalisation",
    description:
      "Tell us your goals and preferences. We'll customize your experience with AI-driven insights.",
  },
  {
    step: "Step 3",
    title: "Strategy",
    description:
      "Implement data-backed strategies aligned with your objectives. Optimize your performance in real-time.",
  },
  {
    step: "Step 4",
    title: "Analyze & Scale",
    description:
      "Monitor your success through clear analytics. Scale what works and optimize for growth.",
  },
];

// ----------------------------------------------------------------------------
// Integration
// ----------------------------------------------------------------------------

export const integrationHighlights: IntegrationHighlight[] = [
  { value: "2x", label: "Faster Exports" },
  { value: "4x", label: "Faster Implementation" },
];

export const integrationReliability = { label: "System Reliability", target: 99, suffix: "%" };

export const integrationLogos = [
  "/t/rescale/images/integration-logo-1.svg",
  "/t/rescale/images/integration-logo-2.svg",
  "/t/rescale/images/integration-logo-3.svg",
  "/t/rescale/images/integration-logo-4.svg",
  "/t/rescale/images/integration-logo-5.svg",
  "/t/rescale/images/integration-logo-6.svg",
  "/t/rescale/images/integration-logo-7.svg",
];

// ----------------------------------------------------------------------------
// Performance
// ----------------------------------------------------------------------------

export const performanceStats: PerformanceStat[] = [
  { label: "Campaigns Launched", target: 6, suffix: "K+" },
  { label: "Active Platform Users", target: 34, suffix: "K" },
  { label: "AI Insights Generated", target: 200, suffix: "K" },
  { label: "Global Engagement", target: 180, suffix: "K" },
  { label: "Customer Satisfaction", target: 92, suffix: "%" },
  { label: "Strategic Solutions", target: 36, suffix: "K" },
];

// ----------------------------------------------------------------------------
// About us
// ----------------------------------------------------------------------------

export const founders: Founder[] = [
  {
    name: "Zane Wilder",
    role: "CEO",
    photo: "/t/rescale/images/founder-zane-wilder.jpeg",
    socials: [
      { label: "LinkedIn", href: "https://www.linkedin.com", icon: "linkedin" },
      { label: "X (Twitter)", href: "https://www.x.com", icon: "x" },
      { label: "Instagram", href: "https://www.instagram.com", icon: "instagram" },
    ],
  },
  {
    name: "Ethan Blake",
    role: "Head of Innovation",
    photo: "/t/rescale/images/founder-ethan-blake.jpeg",
    socials: [
      { label: "LinkedIn", href: "https://www.linkedin.com", icon: "linkedin" },
      { label: "X (Twitter)", href: "https://www.x.com", icon: "x" },
      { label: "Instagram", href: "https://www.instagram.com", icon: "instagram" },
      { label: "YouTube", href: "https://www.youtube.com", icon: "youtube" },
    ],
  },
  {
    name: "Rita Hayes",
    role: "Head of Product",
    photo: "/t/rescale/images/founder-rita-hayes.jpeg",
    socials: [
      { label: "X (Twitter)", href: "https://www.x.com", icon: "x" },
      { label: "Instagram", href: "https://www.instagram.com", icon: "instagram" },
    ],
  },
];

export const companyStory = {
  eyebrow: "The Story So Far —",
  paragraphs: [
    "Three friends with a shared passion for AI met at Stanford's AI Lab. After countless coffee-fueled coding sessions, we got into YC's Winter '20 batch. Today, backed by Silicon Valley's finest, we're making AI accessible to businesses worldwide.",
    "We're industry leaders in AI-driven business solutions, enabling companies to make smarter, data-backed decisions. Our team blends AI expertise with business analytics to deliver impactful results.",
    "Committed to innovation, we've helped thousands transform data into strategic advantages, driving growth and success globally.",
  ],
  badge: "Backed by Y Combinator (W22)",
};

export const lifeAtVectoraPhotos = [
  "/t/rescale/images/life-at-vectora-1.jpeg",
  "/t/rescale/images/life-at-vectora-2.jpeg",
  "/t/rescale/images/life-at-vectora-3.jpeg",
  "/t/rescale/images/life-at-vectora-4.jpeg",
];

// ----------------------------------------------------------------------------
// Testimonials
// ----------------------------------------------------------------------------

export const testimonials: Testimonial[] = [
  {
    name: "David Pierce",
    role: "Marketing Consultant",
    company: "Giggle",
    quote:
      "The transformation was remarkable to witness. Within months, our productivity soared as team members embraced the new system and started delivering exceptional results.",
    photo: "/t/rescale/images/testimonial-david-pierce.jpeg",
  },
  {
    name: "Sally Taher",
    role: "Lead Designer",
    company: "Bastillo",
    quote:
      "Since implementing this solution, we've seen a dramatic improvement in our analytics efficiency. The AI insights helped us identify opportunities we would have missed.",
    photo: "/t/rescale/images/testimonial-sally-taher.jpeg",
  },
  {
    name: "Greg Weingartner",
    role: "CEO",
    company: "Nexusgate",
    quote: "The platform's automation has streamlined our workflow, enhancing productivity.",
    photo: "/t/rescale/images/testimonial-greg-weingartner.jpeg",
  },
  {
    name: "Jorn Lande",
    role: "Marketing Director",
    company: "Spitfire",
    quote: "Vectora delivers actionable data, transforming our decision-making process.",
    photo: "/t/rescale/images/testimonial-jorn-lande.jpeg",
  },
];

// ----------------------------------------------------------------------------
// Pricing
// ----------------------------------------------------------------------------

export const annualDiscount = 0.2; // "Save 20%"

export const pricingTiers: PricingTier[] = [
  {
    name: "Essential",
    monthlyPrice: 29,
    features: ["Core Analytics", "Limited Campaigns", "Community Access", "Standard Support"],
    ctaLabel: "Purchase",
    ctaHref: "/contact",
  },
  {
    name: "Advanced",
    monthlyPrice: 79,
    features: [
      "All Essential Features",
      "Unlimited Campaigns",
      "Advanced AI predictions",
      "Priority support",
      "Team collaboration tools",
    ],
    ctaLabel: "Purchase",
    ctaHref: "/contact",
    featured: true,
  },
  {
    name: "Enterprise",
    monthlyPrice: 199,
    features: [
      "All Advanced Features",
      "Custom AI models",
      "API access",
      "Advanced Integrations",
      "24/7 priority support",
      "Training Sessions",
    ],
    ctaLabel: "Contact Sales",
    ctaHref: "/contact",
  },
];

// ----------------------------------------------------------------------------
// FAQ
// ----------------------------------------------------------------------------

export const faqs: FaqItem[] = [
  {
    question: "Is the platform suitable for beginners?",
    answer:
      "Yes, our platform is designed to be intuitive and user-friendly, with guided onboarding and expert support at every step.",
  },
  {
    question: "How accurate are the AI insights?",
    answer:
      "Our AI delivers highly accurate insights by analyzing vast amounts of real-time data, continuously learning and adapting to market changes.",
  },
  {
    question: "Can I integrate with my existing tools?",
    answer:
      "Yes, we offer seamless integration with popular business tools and platforms, ensuring a smooth connection with your current workflow.",
  },
  {
    question: "What security measures do you have?",
    answer:
      "We implement bank-level encryption and advanced security protocols to ensure your data is protected at all times.",
  },
  {
    question: "How often are insights updated?",
    answer:
      "Our platform provides real-time updates and insights, ensuring you always have the latest data for informed decision-making.",
  },
  {
    question: "What kind of support do you offer?",
    answer:
      "We provide 24/7 technical support, dedicated success managers, and comprehensive resources to ensure your success.",
  },
];

// ----------------------------------------------------------------------------
// Journal
// ----------------------------------------------------------------------------

export const journalPosts: JournalPost[] = [
  {
    slug: "the-future-of-business-intelligence-trends-for-2024-and-beyond",
    title: "The Future of Business Intelligence",
    date: "2024-04-27",
    readingTime: "4 mins",
    excerpt:
      "As we move deeper into 2024, the landscape of business intelligence is evolving at an unprecedented pace with AI and machine learning as current necessities.",
    thumbnail: "/t/rescale/images/journal-thumb-future-of-bi.jpeg",
    intro:
      "As we move deeper into 2024, the landscape of business intelligence is evolving at an unprecedented pace. Artificial intelligence and machine learning are no longer future possibilities – they're current necessities that are reshaping how businesses understand and use their data.",
    body: [
      {
        paragraph:
          "The most significant shift we're seeing is the democratization of advanced analytics. Tools and capabilities that were once reserved for large enterprises with dedicated data science teams are now accessible to organizations of all sizes, creating new opportunities for innovation and growth.",
      },
      {
        heading: "Key Trends To Watch",
        list: [
          "Automated analytics",
          "Predictive insights",
          "Real-time processing",
          "Natural language queries",
        ],
      },
      {
        quote: {
          text: "87% of businesses plan to increase their investment in AI-powered analytics tools in 2024",
          attribution: "Business Intelligence Quarterly",
        },
      },
      {
        paragraph:
          "This democratization is driving a fundamental change in how businesses compete. Small and medium-sized enterprises can now leverage sophisticated analytical capabilities that were previously only available to industry giants. This leveling of the playing field is fostering innovation and creating new competitive dynamics across virtually every industry.",
      },
      {
        paragraph:
          "Looking ahead, the integration of natural language processing and augmented analytics promises to make business intelligence even more accessible and actionable. The ability to simply ask questions and receive AI-generated insights is transforming how business users interact with data, making sophisticated analysis available to non-technical users throughout organizations.",
      },
    ],
    closingLine: "Explore the future of business intelligence →",
  },
  {
    slug: "integrating-ai-analytics-a-success-story",
    title: "Integrating AI Analytics: A Success Story",
    date: "2024-03-12",
    readingTime: "3 min",
    excerpt:
      "When global retailer TechFlex faced declining market share, they turned to AI analytics and transformed how they approached business intelligence.",
    thumbnail: "/t/rescale/images/journal-thumb-integrating-ai-analytics.jpeg",
    intro:
      "When global retailer TechFlex faced declining market share and increasing competition, they turned to AI analytics for a solution. The transformation wasn't just about implementing new technology – it was about fundamentally changing how they approached business intelligence and decision-making.",
    body: [
      {
        paragraph:
          "Within six months of implementing AI-powered analytics, TechFlex saw dramatic improvements across all key performance indicators. The ability to process and analyze data in real-time didn't just improve their efficiency; it gave them the agility to respond to market changes faster than their competitors.",
      },
      {
        heading: "Implementation Results",
        list: [
          "Revenue increased by 32%",
          "Customer satisfaction up 45%",
          "Operating costs reduced by 28%",
        ],
      },
      {
        heading: "Implementation Timeline",
        list: ["Week 1-2: Setup", "Week 3-4: Training", "Week 5-8: Integration", "Week 9+: Optimization"],
      },
      {
        paragraph:
          "The success of TechFlex's transformation sparked a ripple effect throughout their industry. Competitors and partners alike began to recognize that AI analytics wasn't just another tech trend, but a fundamental shift in how modern businesses operate. The company's experience highlighted that successful AI integration requires both technological readiness and cultural adaptation.",
      },
      {
        paragraph:
          "Perhaps most importantly, TechFlex's journey demonstrated that the benefits of AI analytics extend far beyond immediate operational improvements. The company discovered new market opportunities, developed more effective customer engagement strategies, and created innovative products based on insights that would have been impossible to uncover through traditional analysis methods.",
      },
    ],
    closingLine: "See how AI analytics can transform your business →",
  },
  {
    slug: "how-ai-is-transforming-business-analytics-in-2024",
    title: "Transforming Business Through AI Innovation",
    date: "2024-07-21",
    readingTime: "3 mins",
    excerpt:
      "The integration of AI into business processes has moved beyond the experimental phase into practical application, augmenting human capabilities.",
    thumbnail: "/t/rescale/images/journal-thumb-transforming-business.jpeg",
    intro:
      "The integration of AI into business processes has moved beyond the experimental phase and into practical application. Companies across industries are discovering that AI isn't just about automation – it's about augmenting human capabilities to achieve previously impossible levels of performance and insight.",
    body: [
      {
        paragraph:
          "Success in AI implementation isn't about replacing human decision-making, but rather about creating a symbiotic relationship between human intuition and machine intelligence. This partnership is proving to be the key to unlocking new levels of business performance and innovation.",
      },
      {
        heading: "AI Impact Statistics",
        list: ["75% faster analysis", "60% better predictions", "45% cost reduction"],
      },
      {
        quote: {
          text: "AI integration changed how we approach every aspect of our business strategy.",
          attribution: "Sarah Martinez, CEO, Innovation Corp",
        },
      },
      {
        paragraph:
          "The most successful AI implementations are those that focus on enhancing rather than replacing human capabilities. Organizations are finding that when AI handles routine analysis and pattern recognition, their teams are freed to focus on higher-value activities like strategy development and creative problem-solving. This shift is leading to more engaged employees and better business outcomes.",
      },
      {
        paragraph:
          "As AI technology continues to evolve, we're seeing the emergence of more sophisticated applications that can handle increasingly complex tasks. However, the human element remains crucial – the most successful organizations are those that maintain a balance between technological capability and human insight, creating a powerful synergy that drives innovation and growth.",
      },
    ],
    closingLine: "Discover how AI can transform your business →",
  },
  {
    slug: "5-ways-to-optimize-your-business-strategy-with-smart-analytics",
    title: "5 Ways to Optimize Your Business Strategy with Smart Analytics",
    date: "2024-05-08",
    readingTime: "3 mins",
    excerpt:
      "Smart analytics has revolutionized the way businesses approach strategy optimization, turning what was once an art into a precise science.",
    thumbnail: "/t/rescale/images/journal-thumb-5-ways-optimize.jpeg",
    intro:
      "Smart analytics has revolutionized the way businesses approach strategy optimization, turning what was once an art into a precise science. By leveraging advanced analytics tools, companies can now identify opportunities and threats with unprecedented accuracy, leading to more effective strategic planning and execution.",
    body: [
      {
        paragraph:
          "The key to success lies in understanding how to apply these analytical insights in practical, actionable ways. Organizations that excel at this are seeing dramatic improvements in their ability to adapt to market changes and stay ahead of competition.",
      },
      {
        heading: "Implementation Results",
        list: [
          "Data quality assessment",
          "Strategy alignment",
          "Implementation planning",
          "Performance monitoring",
        ],
      },
      {
        quote: {
          text: "Implementation of smart analytics led to a 40% improvement in strategic decision-making accuracy",
          attribution: "Global Finance Review",
        },
      },
      {
        paragraph:
          "What sets successful organizations apart is their ability to create a culture of data-driven strategy optimization. This involves not just implementing the right tools, but also developing the organizational capabilities to act on insights quickly and effectively. Companies that achieve this balance find themselves better equipped to navigate market uncertainties and capitalize on emerging opportunities.",
      },
      {
        paragraph:
          "The future of strategy optimization lies in the convergence of human intuition and artificial intelligence. While AI can process vast amounts of data and identify patterns, human judgment remains crucial in interpreting these insights within the broader business context and making final strategic decisions.",
      },
    ],
    closingLine: "See how AI analytics can transform your business →",
  },
  {
    slug: "the-rise-of-predictive-analytics-a-game-changer-for-business-strategy",
    title: "The Rise of Predictive Analytics: A Game-Changer for Business Strategy",
    date: "2024-08-24",
    readingTime: "4 min",
    excerpt:
      "The landscape of business decision-making is experiencing a fundamental shift as predictive analytics moves from a luxury to a necessity.",
    thumbnail: "/t/rescale/images/journal-thumb-predictive-analytics.jpeg",
    intro:
      "The landscape of business decision-making is experiencing a fundamental shift as predictive analytics moves from a luxury to a necessity. Organizations that have embraced this technology are finding themselves able to anticipate market changes, customer behaviors, and operational challenges with unprecedented accuracy, creating a significant competitive advantage in their respective industries.",
    body: [
      {
        paragraph:
          "What makes predictive analytics particularly powerful is its ability to transform historical data into forward-looking insights. Unlike traditional analytics that tell you what happened, predictive analytics helps you understand what's likely to happen next, enabling proactive rather than reactive business strategies.",
      },
      {
        heading: "Impact of Predictive Analytics",
        list: [
          "85% improved forecast accuracy",
          "3x faster response to market changes",
          "40% reduction in operational risks",
        ],
      },
      {
        quote: {
          text: "Predictive analytics isn't just about forecasting – it's about creating a future-ready organization that can adapt and thrive in any market condition.",
          attribution: "Dr. James Wilson, Chief Analytics Officer",
        },
      },
      {
        paragraph:
          "Early adopters of predictive analytics are reporting remarkable success stories across various business functions. From marketing teams optimizing campaign timing to supply chain managers preventing inventory shortages, the applications are proving to be both versatile and valuable. The key to success lies not just in implementing the technology, but in asking the right questions and focusing on actionable predictions.",
      },
      {
        paragraph:
          "Looking ahead, the integration of machine learning with predictive analytics promises even more sophisticated capabilities. As algorithms become more refined and data sets more comprehensive, businesses will be able to make increasingly accurate predictions about everything from customer lifetime value to market trend evolution. This evolution represents not just a technological advancement, but a fundamental change in how businesses approach strategy and planning.",
      },
    ],
    closingLine: "Discover how predictive analytics can transform your business →",
  },
];

// ----------------------------------------------------------------------------
// Contact page
// ----------------------------------------------------------------------------

export const officeLocations = ["Budapest", "London", "Amsterdam"];

export const contactEmail = "hello@vectora.ai";
