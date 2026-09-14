export type Service = {
  slug: string;
  name: string;
  tagline: string;
  tags: [string, string];
  image: string;
  heroSubtitle: string;
  heroDescription: string;
  detailImage: string;
};

export const services: Service[] = [
  {
    slug: "intelligent-workflow-systems",
    name: "Intelligent workflow systems",
    tagline:
      "We craft digital experiences that are intuitive, elegant, and built to convert.",
    tags: ["Visual", "Ai"],
    image: "/t/utomic/images/service-workflow.jpg",
    heroSubtitle: "Automating complex business operations",
    heroDescription:
      "Modern businesses lose valuable time managing repetitive tasks across disconnected platforms and teams. Our intelligent workflow systems simplify complex operations by connecting processes into a unified automated environment powered by adaptive AI technologies. We design systems that reduce manual effort, improve speed, and create more efficient operational structures for growing digital businesses.",
    detailImage: "/t/utomic/images/service-detail-workflow.png",
  },
  {
    slug: "conversational-support-agents",
    name: "Conversational support agents",
    tagline:
      "Intelligent content at scale, without sacrificing quality or brand voice.",
    tags: ["Scalable", "Ai"],
    image: "/t/utomic/images/service-support.jpg",
    heroSubtitle: "Streamlining complex business workflows",
    heroDescription:
      "Modern organizations waste valuable hours handling repetitive work across disconnected systems and departments. Our intelligent automation platform streamlines complex workflows by linking every process into one connected environment powered by adaptive AI solutions. We create systems that eliminate manual tasks and establish efficient operational foundations for businesses focused on sustainable digital growth.",
    detailImage: "/t/utomic/images/project-apex.png",
  },
  {
    slug: "predictive-data-analysis",
    name: "Predictive data analysis",
    tagline:
      "Fast, scalable, and precisely engineered websites built for real-world performance.",
    tags: ["Robust", "Precise"],
    image: "/t/utomic/images/service-predictive.jpg",
    heroSubtitle: "Optimizing advanced business processes",
    heroDescription:
      "Growing businesses often lose valuable time managing repetitive processes across separate platforms and teams. Our smart workflow solutions simplify complex operations by integrating every process into one automated environment powered by intelligent AI technology. We develop systems that reduce manual work, improve productivity, and build stronger operational frameworks for modern digital organizations.",
    detailImage: "/t/utomic/images/service-support.jpg",
  },
  {
    slug: "custom-model-integration",
    name: "Custom model integration",
    tagline: "We build brands that are impossible to ignore and easy to trust.",
    tags: ["Strategic", "Ai"],
    image: "/t/utomic/images/service-content.jpg",
    heroSubtitle: "Simplifying modern business operations",
    heroDescription:
      "Businesses today spend countless hours coordinating repetitive tasks between disconnected teams and software platforms. Our AI-powered workflow solutions simplify operations by bringing every process together within one intelligent automated system. We design efficient solutions that reduce manual effort, increase productivity, and support scalable operational growth for forward-thinking digital businesses.",
    detailImage: "/t/utomic/images/project-ember.png",
  },
  {
    slug: "ai-content-generation",
    name: "AI content generation",
    tagline:
      "Data-driven marketing that builds visibility, drives traffic, and grows revenue.",
    tags: ["Ai", "Growth"],
    image: "/t/utomic/images/service-content.jpg",
    heroSubtitle: "Scaling content production intelligently",
    heroDescription:
      "Audiences expect consistent, relevant, high-quality content across every channel, every week. Our AI content systems combine production capability with human creative strategy to build content that is fast, on-brand, and excellent at scale.",
    detailImage: "/t/utomic/images/service-content.jpg",
  },
  {
    slug: "smart-process-optimization",
    name: "Smart process optimization",
    tagline:
      "Where bold ideas meet business thinking to create campaigns that actually work.",
    tags: ["Innovative", "Ai"],
    image: "/t/utomic/images/service-optimization.jpg",
    heroSubtitle: "Refining operations for lasting performance",
    heroDescription:
      "We analyze existing systems end to end, uncovering inefficiencies and opportunities for measurable improvement, then implement optimized processes that keep performing long after launch.",
    detailImage: "/t/utomic/images/service-optimization.jpg",
  },
];

export const serviceProcess = [
  {
    step: "Discovery",
    description:
      "We analyze existing workflows, uncover inefficiencies, and identify key automation opportunities.",
  },
  {
    step: "Planning",
    description:
      "We design scalable workflow structures focused on efficiency, collaboration, and seamless system integration.",
  },
  {
    step: "Optimization",
    description:
      "We test, refine, and improve system performance to ensure stable and efficient operations.",
  },
];

export type Project = {
  slug: string;
  name: string;
  tags: [string, string];
  image: string;
  service: string;
  timeline: string;
  client: string;
  location: string;
  intro: string;
  sections: { heading: string; body: string[] }[];
};

export const projects: Project[] = [
  {
    slug: "nova-brand-identity",
    name: "Nova Brand Identity",
    tags: ["Automation", "Intelligence"],
    image: "/t/utomic/images/project-nova.png",
    service: "Branding & Identity",
    timeline: "6 Weeks",
    client: "Nova Ventures",
    location: "Falls Church, VA",
    intro:
      "Nova Ventures came to our company at one of the most critical moments a startup can face — the transition from scrappy early-stage operation to credible, fundable, market-ready business.",
    sections: [
      {
        heading: "Project Overview",
        body: [
          "Nova Ventures came to our company at one of the most critical moments a startup can face — the transition from scrappy early-stage operation to credible, fundable, market-ready business. They had just closed their Series A funding round, had a product that was genuinely solving a real problem in the financial technology space, and a founding team with the vision and the drive to build something significant. What they did not have was a brand that reflected any of that.",
          "The existing visual presence was inconsistent, unmemorable, and failing entirely to communicate the ambition, intelligence, and trustworthiness that the business actually possessed. Their logo had been designed in a weekend, their color palette had no rationale behind it, and their messaging was a patchwork of half-formed ideas that said different things on different pages.",
          "Our company was brought in to change that — not just cosmetically, but fundamentally. Nova needed a brand that could walk into a boardroom, land on a billboard, and live in an app interface with equal confidence.",
        ],
      },
      {
        heading: "The Challenge",
        body: [
          "The fintech space presented a specific and well-documented creative challenge: category sameness. Every competitor in Nova's space had converged on the same visual language — dark backgrounds, electric blue accents, geometric sans-serif typography, and the kind of slick, cold aesthetic that signals \"technology\" while communicating almost nothing about the humanity or values of the business behind it.",
          "Our company also had to navigate the internal dynamics of a founding team with strong opinions and a deep emotional investment in the brand — building the kind of strategic foundation that gave everyone a shared, objective framework for making creative decisions.",
        ],
      },
      {
        heading: "Our Approach",
        body: [
          "We structured the six-week engagement in three distinct phases: Strategy, Design, and Refinement. Each phase had defined outputs, clear review points, and explicit sign-off criteria before the next phase began.",
          "The strategy phase opened with a two-day brand workshop involving Nova's founding team and three key investors, surfacing the core of what Nova actually stood for and producing a positioning statement and brand principles that became the filter for every creative decision that followed.",
          "The design phase produced three fully developed creative directions, each rooted in the same strategic foundation. After a structured review session, one direction emerged with clear consensus and was developed comprehensively across the complete brand system.",
        ],
      },
      {
        heading: "What We Delivered",
        body: [
          "Our company delivered a complete Brand Identity System in a professionally organized brand guidelines document covering every element of the visual and verbal identity, along with a verbal identity guide covering tone of voice, messaging frameworks, and key brand narratives.",
          "We also delivered a series of branded template files for the applications Nova's team would need most frequently, and ran a two-hour brand onboarding session with Nova's full team.",
        ],
      },
      {
        heading: "The Outcome",
        body: [
          "Nova Ventures launched their new brand identity exactly six weeks after our engagement began, to an immediate and overwhelmingly positive response from investors, partners, and the fintech press.",
          "In the months following the rebrand, Nova's investor deck conversion rate improved measurably, inbound partnership inquiries increased substantially, and the brand system continues to serve Nova as they scale toward their Series B.",
        ],
      },
    ],
  },
  {
    slug: "orbit-app-redesign",
    name: "Orbit App Redesign",
    tags: ["Intelligence", "Automation"],
    image: "/t/utomic/images/project-orbit.png",
    service: "UI/UX Design",
    timeline: "4 weeks",
    client: "Orbit Technologies",
    location: "Oakland, CA",
    intro:
      "The problem was that none of that power was accessible to the average user. The interface had been designed by engineers who understood the product deeply and unconsciously assumed that users would too.",
    sections: [
      {
        heading: "Project Overview",
        body: [
          "Orbit Technologies had spent two years building a project management platform with a genuinely impressive feature set — advanced dependency mapping, cross-team resource allocation, real-time workload visualization, and a reporting engine rare in the market.",
          "The problem was that none of that power was accessible to the average user. Onboarding completion rates sat well below industry benchmarks, average session lengths were declining quarter over quarter, and thirty-day churn was significantly higher than it had any right to be.",
          "Our company was engaged to diagnose the problem precisely and redesign the core user experience from the ground up, with a particular focus on onboarding, the primary dashboard, and the most frequently used workflow paths.",
        ],
      },
      {
        heading: "The Challenge",
        body: [
          "The central tension was one that comes up frequently in complex product redesigns: how do you simplify the experience for new and casual users without alienating the power users who have built their entire workflow around the existing interface?",
          "Our company also faced a defined eight-week timeline for a redesign scope that could easily have consumed twice that time. Prioritization and discipline were non-negotiable from day one.",
        ],
      },
      {
        heading: "Our Approach",
        body: [
          "We began where the evidence was rather than where opinions were — analyzing thousands of session recordings, studying heatmaps, reviewing twelve months of support ticket themes, and conducting twelve in-depth user interviews.",
          "The insight was simple but significant: Orbit was asking new users to commit fully to a learning curve before giving them any reason to believe the payoff was worth it. We restructured the entire onboarding sequence around delivering immediate, tangible value from the very first session.",
          "The dashboard was rebuilt entirely around hierarchy and frequency, making the three actions responsible for the majority of daily active user interactions the most prominent, most accessible elements on screen.",
        ],
      },
      {
        heading: "What We Delivered",
        body: [
          "A complete redesign of the Orbit onboarding experience, primary dashboard, core task management workflow, and notification system — all fully annotated, development-ready design files built in a structured component library.",
          "We also delivered a revised, scalable design system and a full usability testing report documenting the findings from three rounds of prototype testing.",
        ],
      },
      {
        heading: "The Outcome",
        body: [
          "The redesigned Orbit platform launched on schedule with zero critical issues. Onboarding completion rates increased by 40%, average session length grew by over 25%, navigation-related support tickets dropped by more than half, and thirty-day retention improved by 22 percentage points.",
        ],
      },
    ],
  },
  {
    slug: "pulse-campaign-strategy",
    name: "Pulse Campaign Strategy",
    tags: ["AI Solutions", "Campaign"],
    image: "/t/utomic/images/project-pulse.png",
    service: "Creative Strategy",
    timeline: "7 Weeks",
    client: "Pulse Wellness",
    location: "Queens, NY",
    intro:
      "Pulse had a genuinely differentiated product philosophy — one rooted in the idea that real wellness requires discipline and discomfort as much as it requires rest and recovery.",
    sections: [
      {
        heading: "Project Overview",
        body: [
          "Pulse Wellness was preparing to launch a new line of digital wellness products into one of the most crowded consumer markets in existence, where hundreds of apps and platforms were all saying exactly the same things in exactly the same way.",
          "Pulse's approach was honest in a category full of soft promises and aspirational imagery — but that differentiation had not yet found expression in their marketing or public-facing identity.",
          "Our company was brought in five weeks before the planned launch date to build the full creative strategy, from market positioning to channel-by-channel execution.",
        ],
      },
      {
        heading: "The Challenge",
        body: [
          "The compressed timeline was the most obvious challenge, but not the most significant one. The deeper challenge was calibrating Pulse's honest, no-nonsense approach so it felt refreshing rather than alienating to an audience conditioned to expect something familiar.",
        ],
      },
      {
        heading: "Our Approach",
        body: [
          "We began with a comprehensive competitive audit of over twenty wellness brands, supplemented with qualitative focus-group research into the Pulse target audience, revealing a consistent frustration: these consumers felt patronized by wellness marketing and wanted to be understood, not sold a fantasy.",
          "The creative platform we developed — \"Wellness Without the Pretense\" — positioned Pulse as the brand that respected its audience enough to tell them the truth. From that platform we built the full campaign architecture: messaging hierarchy, visual direction, tone of voice, and a complete channel execution plan.",
        ],
      },
      {
        heading: "What We Delivered",
        body: [
          "A comprehensive Creative Strategy Document covering market positioning, audience segmentation, campaign platform and rationale, messaging hierarchy, visual direction, and channel execution plan, plus a Campaign Creative Brief and measurement framework.",
        ],
      },
      {
        heading: "The Outcome",
        body: [
          "Pulse launched on schedule with a campaign that stood out immediately in a crowded category. Launch week social content generated more than three times the engagement of any previous content, earning significant unprompted commentary and substantial earned media pickup.",
          "Pulse ended their launch month with brand awareness metrics that significantly exceeded pre-launch projections and a customer acquisition cost below their modeled target.",
        ],
      },
    ],
  },
];

export type BlogPost = {
  slug: string;
  title: string;
  author: string;
  date: string;
  image: string;
  avatar: string;
  sections: { heading?: string; body: string }[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "building-smarter-workflows-with-ai-automation",
    title: "Building smarter workflows with AI automation",
    author: "Ethan Walker",
    date: "Apr 10, 2026",
    image: "/t/utomic/images/blog-1.png",
    avatar: "/t/utomic/images/blog-author-1.jpg",
    sections: [
      {
        heading: "AI-Powered Automation: Redefining Workflows",
        body: "One of the most significant impacts intelligent automation has had on businesses is in workflow efficiency. Through modern AI models, companies can automate repetitive tasks, freeing up employees to focus on more strategic work. Customer service can be greatly enhanced through AI-powered chatbots that handle common inquiries efficiently and without downtime, ensuring 24/7 support.",
      },
      {
        heading: "Data-Driven Decision Making",
        body: "AI helps businesses make sense of vast amounts of data. With models capable of analyzing complex datasets, companies can uncover trends and patterns that would otherwise go unnoticed — from predicting consumer behavior to optimizing supply chain logistics. This data-driven approach ensures companies remain agile and responsive to market changes.",
      },
      {
        heading: "Enhancing Experiences Through AI",
        body: "Customer experience is a key differentiator in today's competitive business environment, and intelligent automation helps companies deliver personalized, high-quality interactions at scale — tailoring recommendations, personalizing campaigns, and offering proactive support based on customer preferences and behaviors.",
      },
      {
        body: "Summary: Intelligent automation is playing a crucial role in the AI revolution by providing businesses with the tools they need to stay competitive. From automating workflows to enhancing customer experiences and making data-driven decisions, it is unlocking new possibilities for businesses across industries.",
      },
    ],
  },
  {
    slug: "how-automation-improves-scaling-system",
    title: "How automation improves scaling system",
    author: "Sophia Bennett",
    date: "May 12, 2026",
    image: "/t/utomic/images/blog-2.png",
    avatar: "/t/utomic/images/blog-author-2.jpg",
    sections: [
      {
        heading: "The Role of AI in Enhancing Customer Interactions",
        body: "AI chatbots have moved beyond answering basic questions — they now engage in complex conversations, handle inquiries, and solve issues in real time. These systems are highly scalable, ensuring businesses can handle high volumes of inquiries without sacrificing quality.",
      },
      {
        heading: "24/7 Availability and Instant Support",
        body: "One of the most significant advantages of AI-powered chatbots is their ability to provide round-the-clock service. Customers expect immediate responses regardless of time zone, and chatbots can work tirelessly, providing instant support even when human agents are offline.",
      },
      {
        heading: "Personalization at Scale",
        body: "Today's consumers expect personalized experiences, and AI chatbots excel at delivering just that — analyzing customer data and past interactions to tailor responses, recommend products, and resolve issues based on previous behavior.",
      },
      {
        body: "Summary: AI-powered chatbots are revolutionizing customer service. With 24/7 availability, personalized interactions, and cost-effective automation, these intelligent systems are reshaping how businesses engage with their customers.",
      },
    ],
  },
  {
    slug: "how-automation-improves-daily-operations",
    title: "How automation improves daily operations",
    author: "Noah Williams",
    date: "Jun 14, 2026",
    image: "/t/utomic/images/blog-3.png",
    avatar: "/t/utomic/images/blog-author-3.jpg",
    sections: [
      {
        heading: "Breaking Down Barriers to AI Access",
        body: "Historically, developing and implementing AI solutions required substantial expertise and resources. Modern platforms are dismantling these barriers by providing user-friendly tools that make AI accessible to non-experts, letting small businesses integrate sophisticated capabilities without a dedicated AI team.",
      },
      {
        heading: "Empowering Creativity and Innovation",
        body: "These tools are not just about making AI accessible — they're also about fostering creativity and innovation, enabling writers, developers, and entrepreneurs to explore new ideas and build solutions that were previously beyond reach.",
      },
      {
        heading: "Enhancing Education and Research",
        body: "Access to cutting-edge AI models is helping students, researchers, and educators explore new concepts and conduct experiments without needing expensive infrastructure, accelerating learning and discovery across fields.",
      },
      {
        body: "Summary: AI is being democratized through accessible tools, a focus on creativity and innovation, and a commitment to inclusivity — opening new possibilities for innovation, education, and collaboration.",
      },
    ],
  },
];

export const pricingPlans = [
  {
    name: "AI starter plan",
    description:
      "Perfect for startups and small teams looking to automate daily workflows with practical AI solutions.",
    price: "$299.00",
    period: "/month",
    features: [
      "AI workflow automation",
      "Smart chatbot setup",
      "Real-time data insights",
      "AI content generation",
      "Basic system integration",
    ],
  },
  {
    name: "AI scaling plan",
    description:
      "Built for modern businesses needing advanced automation, intelligent insights, and scalable AI operations.",
    price: "$799.00",
    period: "/month",
    features: [
      "Everything in starter plan",
      "Advanced workflow systems",
      "Predictive business analytics",
      "Custom AI model training",
      "CRM and API integration",
      "Priority support access",
      "Performance optimization",
      "Dedicated AI strategist",
    ],
  },
];

export const faqs = [
  {
    question: "What services do you offer?",
    answer:
      "We deliver end-to-end AI and software solutions, from automation and data analysis to machine learning and custom AI products.",
  },
  {
    question: "What industries do you work with?",
    answer:
      "Yes. We support early-stage startups looking to build MVPs as well as established enterprises aiming to scale or modernize their AI capabilities.",
  },
  {
    question: "Can you integrate with existing tools?",
    answer:
      "Absolutely. We specialize in embedding AI modules into current apps, dashboards, CRMs, or internal tools without disrupting your existing workflow.",
  },
  {
    question: "How long does a project take to complete?",
    answer:
      "Project timelines vary based on complexity, but most AI prototypes take 2–6 weeks, while full production systems may take 1–3 months.",
  },
  {
    question: "Do you build custom solutions?",
    answer:
      "We create bespoke solutions tailored to each client's unique objectives and requirements. Our specialties include website development, mobile app design, and innovative digital marketing approaches.",
  },
];

export const testimonials = [
  {
    quote:
      "Working with the team completely transformed how we manage automation. Tasks that once took hours are now handled in minutes with consistent accuracy.",
    stat: "120+",
    statLabel: "Workflow automations",
    name: "Ethan Carter",
    role: "Operations Director",
    avatar: "/t/utomic/images/testimonial-avatar-1.png",
  },
  {
    quote:
      "Their AI systems helped us simplify complex processes while improving team productivity across multiple departments without adding unnecessary operational overhead.",
    stat: undefined,
    statLabel: undefined,
    name: "Sophia Miller",
    role: "Product Strategy Lead",
    avatar: "/t/utomic/images/testimonial-avatar-2.png",
  },
  {
    quote:
      "What stood out most was their ability to build scalable AI workflows that integrated perfectly with our existing systems while maintaining speed, flexibility, and long-term reliability.",
    stat: "96%",
    statLabel: "Workflow accuracy",
    name: "Daniel Brooks",
    role: "Marketing Manager",
    avatar: "/t/utomic/images/testimonial-avatar-3.png",
  },
];

export const teamMembers = [
  { name: "Mia Collins", role: "Product interface designer", image: "/t/utomic/images/team-member-1.jpg" },
  { name: "Lucas Meyer", role: "AI systems engineer", image: "/t/utomic/images/team-member-2.jpg" },
  { name: "Sophia Turner", role: "UX experience designer", image: "/t/utomic/images/team-member-3.jpg" },
  { name: "Ethan Brooks", role: "Automation workflow lead", image: "/t/utomic/images/team-member-1.jpg" },
];

export const awards = [
  {
    year: "2026",
    title: "Global Innovation Award",
    description:
      "Recognized for building next-gen automation systems that scale digital workflows.",
    icon: "/t/utomic/images/award-icon-1.svg",
  },
  {
    year: "2025",
    title: "AI Automation Award",
    description: "Honored for delivering efficient, scalable automation across industries.",
    icon: "/t/utomic/images/award-icon-2.svg",
  },
  {
    year: "2023",
    title: "UX Systems Award",
    description: "Awarded for intelligent UX that blends design and automation seamlessly.",
    icon: "/t/utomic/images/award-icon-3.svg",
  },
  {
    year: "2021",
    title: "Product Design Award",
    description: "Recognized for clean, high-performance interface design focused on usability.",
    icon: "/t/utomic/images/award-icon-4.svg",
  },
];

export const companyStats = [
  { value: "98%", label: "High-accuracy real-time system outputs." },
  { value: "240+", label: "Autonomous workflows with minimal interruption." },
  { value: "12.6M+", label: "Real-time data interpreted into actionable insights." },
];

export const storyMilestones = [
  {
    range: "2018 — 2022",
    body: "Premon launched its first automation platform, partnered with 40+ startups, and built scalable systems for smarter digital operations.",
  },
  {
    range: "2023 — 2026",
    body: "Premon processed 18M+ workflows, expanded across 12 industries, and improved operational efficiency through advanced AI systems.",
  },
];

export const homeWhyChoose = [
  {
    value: "80%",
    label: "Efficiency boost",
    description:
      "AI-powered automation systems designed to reduce repetitive work and improve operational speed across daily processes.",
  },
  {
    value: "10M+",
    label: "Task automated",
    description:
      "Scalable AI workflows successfully managing millions of actions with consistent accuracy and real-time execution.",
  },
  {
    value: "2.2x",
    label: "Faster scaling",
    description:
      "Flexible intelligent systems helping businesses expand faster without increasing manual workload or complexity.",
  },
];

export const controlFeatures = [
  {
    title: "Real-time system control",
    description: "Monitor and manage AI workflows instantly with live updates.",
  },
  {
    title: "Seamless device access",
    description: "Access your AI tools on mobile and desktop anywhere.",
  },
  {
    title: "Unified AI dashboard",
    description: "All automation and data in one simple unified interface.",
  },
];

export const contactInfo = {
  phone: "+1 (415) 684-2917",
  email: "contact@gmail.com",
  location: "San Francisco, California",
  footerPhone: "(917) 339-6416",
  footerEmailInfo: "info@synthetixlabs.com",
  footerEmailSupport: "support@synthetixlabs.com",
};
