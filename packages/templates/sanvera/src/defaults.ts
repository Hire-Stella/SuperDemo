// Single source of truth for all copy/content used across the site.
// Cloned from https://sanvera.framer.website/ (a Framer wellness/coaching
// template). The template's own placeholder brand text alternated between
// "Sanvera" (template product name) and "Serenova" (demo business name used
// in the body copy) -- both have been replaced everywhere with our own
// original brand, Amberwell. See reference/ for the recon captures.

export const BRAND_NAME = "Amberwell";
export const BRAND_TAGLINE =
  "A wellness studio based in London helping people restore balance.";

export const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Process", href: "#process" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Contact", href: "#faq" },
  { label: "FAQ", href: "#faq" },
];

export const HERO = {
  headline: [
    "WELLNESS STUDIO",
    "BASED IN LONDON",
    "HELPING PEOPLE",
    "RESTORE BALANCE",
  ],
  subhead:
    "Helping individuals reconnect with themselves through mindful coaching, restorative treatments, and personalized wellness experiences designed for balance.",
  cta: "Book a Session",
  giantText: "AMBERWELL",
  // Transparent cutout subject -- floats directly over the maroon backdrop,
  // no rectangular frame/crop, matching the source's treatment exactly.
  image: "/t/sanvera/images/hero-subject.png",
};

export const ABOUT = {
  eyebrow: "About Us",
  heading:
    "REDISCOVER BALANCE THROUGH PERSONALIZED WELLNESS EXPERIENCES FOR MIND AND BODY EVERY SINGLE DAY.",
  cta: "Explore Services",
  thumb: "/t/sanvera/images/about-thumb.png",
  paragraph:
    "At Amberwell, we combine mindful coaching, therapeutic treatments, and holistic wellness practices to help you restore balance, reduce stress, and build a healthier lifestyle that lasts.",
  stats: [
    { value: 12, suffix: "+", label: "Expertise" },
    { value: 5, suffix: "K+", label: "Happy Clients" },
    { value: 98, suffix: "%", label: "Client Satisfaction" },
  ],
};

export type Service = {
  number: string;
  title: string;
  description?: string;
};

export const SERVICES: Service[] = [
  {
    number: "001",
    title: "Personal Wellness Coaching",
    description:
      "Receive personalized guidance designed to strengthen your mindset, restore emotional balance, and support long-term wellbeing.",
  },
  { number: "002", title: "Holistic Wellness" },
  { number: "003", title: "Stress Relief Therapy" },
  { number: "004", title: "Meditation & Breathwork" },
  { number: "005", title: "Life Balance Coaching" },
  { number: "006", title: "Personal Wellness Coaching" },
];

export const SERVICES_EYEBROW = "Services";
export const SERVICES_CTA = "Book a Session";
export const SERVICES_GALLERY = [
  "/t/sanvera/images/service-main.png",
  "/t/sanvera/images/service-side-1.png",
  "/t/sanvera/images/service-side-2.png",
];

export const WHY_CHOOSE = {
  eyebrow: "Why Choose Us",
  heading: "EMBRACE A HEALTHIER, MORE BALANCED LIFESTYLE.",
  paragraph:
    "We combine mindful coaching, evidence-informed practices, and compassionate support to help you feel calmer, stronger, and more connected every day.",
  cta: "Learn More",
  image: "/t/sanvera/images/why-choose-image.png",
  stats: [
    { value: 5, suffix: "K+", label: "Wellness Sessions" },
    { value: 15, suffix: "+", label: "Certified Specialists" },
    { value: 95, suffix: "%", label: "Returning Clients" },
    { value: 12, suffix: "+", label: "Years of Trusted Care" },
  ],
};

export type ProcessStep = {
  number: string;
  title: string;
  description: string;
  bullets: string[];
  icon: string;
};

export const PROCESS = {
  eyebrow: "Our Process",
  heading: "A SIMPLE PATH TO LASTING WELLNESS.",
  subhead:
    "Our step-by-step approach is designed to understand your needs, create a personalized plan, and support progress with expert guidance.",
  steps: [
    {
      number: "01",
      title: "Discover",
      description:
        "We begin by understanding your goals, challenges, and vision for a healthier life.",
      bullets: [
        "Identify your wellness goals.",
        "Understand your current lifestyle.",
        "Create a strong foundation.",
      ],
      icon: "/t/sanvera/images/icon-discover.png",
    },
    {
      number: "02",
      title: "Assess",
      description:
        "A thoughtful assessment helps us identify the practices that fit your unique journey.",
      bullets: [
        "Review your wellbeing.",
        "Evaluate your priorities.",
        "Define key focus areas.",
      ],
      icon: "/t/sanvera/images/icon-assess.png",
    },
    {
      number: "03",
      title: "Plan",
      description:
        "We build a personalized wellness plan tailored to your lifestyle, goals, and growth.",
      bullets: [
        "Develop a custom roadmap.",
        "Set realistic milestones.",
        "Establish healthy routines.",
      ],
      icon: "/t/sanvera/images/icon-plan.png",
    },
    {
      number: "04",
      title: "Practice",
      description:
        "Put your plan into action through guided coaching and consistent support.",
      bullets: [
        "Apply mindful techniques.",
        "Build lasting habits.",
        "Stay motivated.",
      ],
      icon: "/t/sanvera/images/icon-practice.png",
    },
    {
      number: "05",
      title: "Transform",
      description:
        "Experience meaningful progress as healthier habits become part of life.",
      bullets: [
        "Track your progress.",
        "Celebrate achievements.",
        "Maintain lifelong balance.",
      ],
      icon: "/t/sanvera/images/icon-transform.png",
    },
  ] as ProcessStep[],
};

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  photo: string;
};

export const TESTIMONIALS_EYEBROW = "Testimonials";
export const TESTIMONIALS_HEADING = "REAL STORIES OF BALANCE, GROWTH, AND WELLBEING.";
export const TESTIMONIALS_SUBHEAD =
  "Discover how personalized coaching and mindful wellness practices have helped our clients reduce stress, build healthier habits, and create lasting positive change.";

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Amberwell gave me the guidance and support I needed to slow down, reduce stress, and feel more balanced in my daily life.",
    name: "Emma Collins",
    role: "Marketing Manager",
    photo: "/t/sanvera/images/testimonial-1.png", // kahrurJetynWzny80IDOtefhCg
  },
  {
    quote:
      "Every session felt thoughtful and personal. I've become more confident, focused, and connected with myself than ever before.",
    name: "Daniel Carter",
    role: "Entrepreneur",
    photo: "/t/sanvera/images/testimonial-2.png",
  },
  {
    quote:
      "The personalized wellness plan transformed my routine. I now approach each day with greater energy and a calmer mindset.",
    name: "Sophia Bennett",
    role: "Creative Designer",
    photo: "/t/sanvera/images/testimonial-3.png",
  },
  {
    quote:
      "From the very first session, I felt supported and understood. The experience has been truly life-changing.",
    name: "Olivia Brooks",
    role: "Business Consultant",
    photo: "/t/sanvera/images/testimonial-4.png",
  },
  {
    quote:
      "The combination of mindfulness coaching and practical guidance helped me create healthy habits that actually last.",
    name: "James Walker",
    role: "Software Engineer",
    photo: "/t/sanvera/images/testimonial-5.png",
  },
  {
    quote:
      "I found exactly what I was looking for -- a peaceful space, expert guidance, and lasting results that continue to improve my wellbeing.",
    name: "Isabella Moore",
    role: "Healthcare Professional",
    photo: "/t/sanvera/images/testimonial-6.png",
  },
];

export type FaqItem = { question: string; answer: string };

export const FAQ_HEADING = "HAVE QUESTIONS? WE'RE HERE TO HELP.";
export const FAQ_CTA = "Contact Us";
export const FAQ_IMAGE = "/t/sanvera/images/faq-image.png";

export const FAQS: FaqItem[] = [
  {
    question: "What services do you offer?",
    answer:
      "We provide personalized wellness coaching, mindfulness sessions, stress management programs, meditation guidance, and holistic wellbeing support tailored to your goals.",
  },
  {
    question: "How do I book a session?",
    answer:
      "Simply click any \"Book a Session\" button on the site, choose a time that works for you, and you'll receive a confirmation with everything you need to get started.",
  },
  {
    question: "Are your programs suitable for beginners?",
    answer:
      "Yes. Every program starts with an assessment so we can tailor the pace and practices to your experience level, whether you're brand new to wellness coaching or have years of practice.",
  },
  {
    question: "Do you offer online sessions?",
    answer:
      "We offer both in-studio sessions in London and live online sessions, so you can build your practice wherever you are.",
  },
  {
    question: "How many sessions do I need?",
    answer:
      "It depends on your goals. Many clients see meaningful change within a few sessions, while others prefer ongoing monthly support -- we'll recommend a plan after your first consultation.",
  },
  {
    question: "Can I reschedule or cancel my appointment?",
    answer:
      "Yes, you can reschedule or cancel up to 24 hours before your session at no charge through your confirmation email.",
  },
];

export const JOURNEY_CTA = {
  heading: "YOUR WELLNESS JOURNEY STARTS TODAY.",
  subhead:
    "Discover personalized coaching and holistic wellness experiences that help you feel more balanced, focused, and confident every day.",
  cta: "Book Your Session",
  image: "/t/sanvera/images/cta-journey-bg.png",
};

export const FOOTER = {
  image: "/t/sanvera/images/footer-image.png",
  copyright: `© 2026 ${BRAND_NAME}. Crafted for mindful living and lasting wellbeing.`,
  socials: [
    { label: "LinkedIn", href: "#" },
    { label: "Google", href: "#" },
    { label: "Instagram", href: "#" },
    { label: "Facebook", href: "#" },
  ],
};
