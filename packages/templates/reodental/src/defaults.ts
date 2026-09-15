// Single source of truth for all copy/content used across the site.
// Anything flagged below with "TODO(owner)" is a placeholder carried over
// from the source template and should be reviewed before launch — see NOTES.md.

export const BRAND_NAME = "Lumina Dental";
export const BRAND_TAGLINE =
  "A boutique dental studio delivering gentle, modern care since 2008.";

// Real brand email — used consistently across the whole site.
export const CONTACT_EMAIL = "hello@luminadental.com";

/**
 * TODO(owner): The source template's raw markup contained one leftover
 * contact-icon link pointing at `mailto:hello@lumendentalstudio.com` — an
 * artifact from "Lumen Dental Studio", a different template this one was
 * apparently derived from. That address is NOT used anywhere in this build;
 * `CONTACT_EMAIL` (hello@reodental.com) is used everywhere instead. Kept
 * here only as a documented fingerprint so nobody re-introduces it by
 * copy-pasting from the original template. See NOTES.md.
 * (Note: this deprecated address happens to resemble the current
 * "Lumina Dental" brand name — that's coincidental; it is unrelated
 * leftover template cruft and must stay unused.)
 */
export const DEPRECATED_TEMPLATE_EMAIL_DO_NOT_USE =
  "hello@lumendentalstudio.com";

// TODO(owner): placeholder template phone number/address — replace with the
// real clinic's details before launch.
export const CONTACT_PHONE = "(555) 642-5863";
export const CONTACT_PHONE_HREF = "tel:+15556425863";
export const CONTACT_ADDRESS = "220 Harborview Lane, Suite 4B";
export const CONTACT_HOURS = "Mon–Fri 8am–6pm, Sat 9am–2pm";

/**
 * TODO(owner): "Designed by Reovan" is the template studio's real credit
 * from the live template. Decide whether to keep it (attribution), replace
 * it with your own studio's credit, or remove it entirely before launch.
 */
export const TEMPLATE_CREDIT = "Designed by Reovan";

export const COPYRIGHT = "© 2026 Lumina Dental. All rights reserved.";

export const NAV_LINKS = [
  { label: "Services", href: "#services" },
  { label: "Why Us", href: "#benefits" },
  { label: "Reviews", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
];

export const HERO = {
  eyebrow: "DENTAL TREATMENTS",
  titleLines: ["Repair your smile.", "Restore your confidence."],
  subhead:
    "From whitening and fillings to implants, veneers, and crowns, we provide modern dental treatments designed around the result you want.",
  primaryCta: "Book an appointment",
  secondaryCta: "Emergency Call",
  emergencyNote: "Emergency call available!",
  socialProof: "4.9 average rating from 1,200+ patients",
};

export const TREATMENT_CHIPS = [
  "Teeth Whitening",
  "Dental Implants",
  "Tooth Fillings",
  "Veneers",
  "Tartar Removal",
  "Crowns & Bridges",
];

export type Service = {
  number: string;
  name: string;
  description: string;
  before: string;
  after: string;
  assumedCopy?: boolean;
};

export const SERVICES: Service[] = [
  {
    number: "01",
    name: "Teeth Whitening",
    description:
      "Professional whitening that safely lifts stains and reveals a brighter, more confident smile.",
    before: "/t/reodental/images/service-whitening-before.png",
    after: "/t/reodental/images/service-whitening-after.png",
  },
  {
    number: "02",
    name: "Dental Implants",
    description:
      "Replace missing teeth with durable, natural-looking implants designed for everyday life.",
    before: "/t/reodental/images/service-implants-before.png",
    after: "/t/reodental/images/service-implants-after.png",
  },
  {
    number: "03",
    name: "Tooth Fillings",
    description:
      "Repair cavities and minor damage with tooth-colored fillings that restore strength and blend naturally.",
    before: "/t/reodental/images/service-fillings-before.png",
    after: "/t/reodental/images/service-fillings-after.png",
  },
  {
    number: "05",
    name: "Tartar Removal",
    description:
      "Remove built-up plaque and tartar to support healthier gums and a cleaner smile.",
    before: "/t/reodental/images/service-tartar-before.png",
    after: "/t/reodental/images/service-tartar-after.png",
  },
];

export const STATS = [
  { value: 1200, suffix: "+", label: "Smiles treated" },
  { value: 18, suffix: " yrs", label: "In practice" },
];

export const DIFFERENCE_STEPS = [
  { number: "01", title: "Initial consultation" },
  { number: "02", title: "Digital diagnostics" },
  { number: "03", title: "Personalized treatment plans" },
  { number: "04", title: "Natural-looking results" },
];

export type TeamMember = {
  name: string;
  role: string;
  photo: string;
};

export const TEAM: TeamMember[] = [
  { name: "Dr. Marcus Chen, DDS", role: "Lead Dentist", photo: "/t/reodental/images/team-marcus-chen.png" },
  { name: "Priya Nair, RDH", role: "Dental Hygienist", photo: "/t/reodental/images/team-priya-nair.png" },
  { name: "Dr. Amara Osei, DMD", role: "General Dentist", photo: "/t/reodental/images/team-amara-osei.png" },
  { name: "Sofia Ramirez", role: "Patient Coordinator", photo: "/t/reodental/images/team-sofia-ramirez.png" },
];

export type Testimonial = {
  category: string;
  rating: string;
  quote: string;
  name: string;
  role: string;
  photo: string;
};

// NOTE: only one testimonial photo asset (Sofia Martinez's) survived the
// crawl. It's reused as a neutral stand-in photo for the other 4 real
// testimonials below — flagged as a limitation in NOTES.md. The quote text
// for all 5 is real, recovered copy from clicking through the live carousel.
export const TESTIMONIALS: Testimonial[] = [
  {
    category: "WHITENING",
    rating: "5.0/5.0",
    quote:
      "I finally did the whitening treatment I'd been putting off for years. It was quick, painless, and I'm still catching myself smiling at photos now.",
    name: "Sofia Martinez",
    role: "Whitening patient",
    photo: "/t/reodental/images/testimonial-sofia-martinez.jpg",
  },
  {
    category: "PREVENTIVE CARE",
    rating: "4.9/5.0",
    quote:
      "My check-ups used to feel rushed elsewhere. Here, they actually walk me through what they're seeing and why it matters. I've never felt more informed about my own care.",
    name: "James Whitfield",
    role: "Preventive care patient",
    photo: "/t/reodental/images/testimonial-sofia-martinez.jpg",
  },
  {
    category: "IMPLANTS",
    rating: "5.0/5.0",
    quote:
      "I put off getting an implant for two years because I dreaded the process. It ended up being far more comfortable than I expected, and the result feels completely natural.",
    name: "Maya Chen",
    role: "Implant patient",
    photo: "/t/reodental/images/testimonial-sofia-martinez.jpg",
  },
  {
    category: "EMERGENCY",
    rating: "4.9/5.0",
    quote:
      "Chipped a tooth on a Saturday and they got me in that same afternoon. Calm, quick, and painless — exactly what you want when you're panicking.",
    name: "Ryan Coleman",
    role: "Emergency patient",
    photo: "/t/reodental/images/testimonial-sofia-martinez.jpg",
  },
  {
    category: "INVISALIGN",
    rating: "5.0/5.0",
    quote:
      "Started Invisalign a year ago and honestly forgot I was wearing them half the time. The check-ins were quick and the team was great about adjusting the plan as I went.",
    name: "Elena Vasquez",
    role: "Invisalign patient",
    photo: "/t/reodental/images/testimonial-sofia-martinez.jpg",
  },
];

export type FaqItem = {
  question: string;
  answer: string;
  assumedCopy?: boolean;
};

// Real recovered copy — clicking through the live accordion revealed the
// true answer text for all 7 entries (previously assumed unrecoverable).
export const FAQS: FaqItem[] = [
  {
    question: "How much does teeth whitening cost?",
    answer:
      "Every whitening plan starts with a quick exam so we can give you an exact price up front — most patients are treated in a single visit.",
  },
  {
    question: "How long does a dental implant take?",
    answer:
      "From placement to final crown, most implants take three to six months to fully integrate, with a temporary tooth in place the entire time.",
  },
  {
    question: "Are veneers right for me?",
    answer:
      "If you're looking to change the shape, color, or spacing of your front teeth, veneers are usually a great fit — we'll confirm during a short consultation.",
  },
  {
    question: "What happens during a tooth filling?",
    answer:
      "We numb the area, remove the decay, and shape a tooth-colored composite to match your bite — most fillings take under an hour.",
  },
  {
    question: "How often should I have tartar removed?",
    answer:
      "Most patients benefit from a professional cleaning every six months, though some need more frequent visits depending on their gum health.",
  },
  {
    question: "How long do crowns and bridges last?",
    answer:
      "With good care, a well-fitted crown or bridge typically lasts ten to fifteen years or more.",
  },
  {
    question: "How do I know which treatment is right for me?",
    answer:
      "Book a consultation and we'll walk you through your options, timelines, and costs before you commit to anything.",
  },
];

export const FOOTER_SERVICES = [
  "Teeth Whitening",
  "Dental Implants",
  "Tooth Fillings",
  "Tartar Removal",
  "Crowns & Bridges",
  "Veneers",
];

export const FOOTER_STUDIO_LINKS = [
  { label: "Services", href: "#services" },
  { label: "Why Us", href: "#benefits" },
  { label: "Reviews", href: "#testimonials" },
  { label: "Book Appointment", href: "/book-appointment" },
  { label: "FAQ", href: "#faq" },
];

export const BOOKING_SERVICE_OPTIONS = [
  "General Inquiry",
  "Teeth Whitening",
  "Dental Implants",
  "Tooth Fillings",
  "Veneers",
  "Tartar Removal",
  "Crowns & Bridges",
];
