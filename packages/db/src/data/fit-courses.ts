/**
 * FIT Institute knowledge base seed.
 *
 * ┌───────────────────────────────────────────────────────────────────────────┐
 * │ COURSE NAMES, CATEGORIES AND CONTACT DETAILS are taken from the live site │
 * │ https://fitiedu.com — these are real.                                     │
 * │                                                                           │
 * │ FEES, DURATIONS, INTAKE DATES AND CLASS TIMES ARE PLACEHOLDERS.           │
 * │ They are marked `placeholder: true` and must be replaced with FIT's actual │
 * │ figures before any customer-facing use. Quoting invented fees to a         │
 * │ prospective student is worse than saying "let me check that for you".     │
 * │ Until replaced, the AI is configured to hedge on price (see PRICING_NOTE). │
 * └───────────────────────────────────────────────────────────────────────────┘
 */

import type { Skill } from '@superdemo/contracts';

export const INSTITUTE = {
  name: 'FIT Institute',
  legalNote: 'KHDA-approved training provider',
  address: 'Oaks Liwa Heights, Cluster W, Office #3505, Jumeirah Lake Towers, Dubai, UAE',
  email: 'admissiont@fitiedu.com',
  phone: '+971528876388',
  whatsapp: '+97145709603',
  website: 'https://fitiedu.com',
  timezone: 'Asia/Dubai',
  officeHours: 'Sunday to Thursday, 9:00 AM – 6:00 PM Gulf Standard Time',
} as const;

/**
 * The AI must not invent prices. Injected into every system prompt.
 */
export const PRICING_NOTE =
  'Fee figures in your knowledge base are provisional. When asked about price, give the ' +
  'range if you have one but always add that the admissions team will confirm the exact ' +
  'current fee and any available payment plan. Never state a fee as final or guaranteed.';

export interface CourseSeed {
  title: string;
  category: Skill;
  /** Real: taken from fitiedu.com */
  awarding?: string;
  /** Placeholder unless verified with FIT. */
  durationWeeks: number;
  feeAedFrom: number;
  feeAedTo: number;
  schedule: string;
  outcomes: string[];
  audience: string;
  placeholder: true;
}

/**
 * 20+ programmes across the four categories FIT publishes. Student counts on
 * their site: Education 1,376 · Language 912 · Management 783 · Finance 685.
 */
export const COURSES: CourseSeed[] = [
  /* ───────────────────────────── Education ───────────────────────────────── */
  {
    title: 'Early Childhood Education Diploma',
    category: 'EDUCATION',
    durationWeeks: 16,
    feeAedFrom: 4500,
    feeAedTo: 6500,
    schedule: 'Weekday evenings 6:30–9:00 PM, or Saturday full-day',
    audience: 'Nursery and KG teachers, teaching assistants, parents entering the sector',
    outcomes: [
      'Plan age-appropriate learning activities for ages 0–6',
      'Apply the EYFS framework in a UAE nursery setting',
      'Meet KHDA expectations for early-years staff',
    ],
    placeholder: true,
  },
  {
    title: 'Special Educational Needs (SEN) Diploma',
    category: 'EDUCATION',
    durationWeeks: 14,
    feeAedFrom: 4800,
    feeAedTo: 7000,
    schedule: 'Weekday evenings, twice weekly',
    audience: 'Classroom teachers, learning support staff, shadow teachers',
    outcomes: [
      'Identify and document common learning differences',
      'Write and review Individual Education Plans',
      'Adapt lessons for inclusive classrooms',
    ],
    placeholder: true,
  },
  {
    title: 'Applied Behaviour Analysis (ABA) Certification',
    category: 'EDUCATION',
    durationWeeks: 12,
    feeAedFrom: 5500,
    feeAedTo: 8500,
    schedule: 'Weekend intensive, Saturdays 9:00 AM – 4:00 PM',
    audience: 'Therapists, SEN staff, parents of children with autism',
    outcomes: [
      'Apply ABA principles to behaviour intervention',
      'Collect and interpret behavioural data',
      'Prepare for further RBT/BCaBA study',
    ],
    placeholder: true,
  },
  {
    title: 'Learning Support Assistant Certificate',
    category: 'EDUCATION',
    durationWeeks: 8,
    feeAedFrom: 2800,
    feeAedTo: 4000,
    schedule: 'Weekday mornings 10:00 AM – 12:30 PM',
    audience: 'Entry-level candidates seeking school support roles in Dubai',
    outcomes: [
      'Support a lead teacher in a mainstream classroom',
      'Understand safeguarding and child protection basics',
      'Apply for LSA roles at KHDA-registered schools',
    ],
    placeholder: true,
  },
  {
    title: 'Phonics Teacher Training',
    category: 'EDUCATION',
    durationWeeks: 6,
    feeAedFrom: 2200,
    feeAedTo: 3200,
    schedule: 'Saturdays, half-day',
    audience: 'Primary teachers and tutors teaching early reading',
    outcomes: [
      'Deliver systematic synthetic phonics lessons',
      'Assess phonemic awareness and decoding',
      'Support EAL learners with phonics',
    ],
    placeholder: true,
  },
  {
    title: 'Montessori Diploma',
    category: 'EDUCATION',
    durationWeeks: 20,
    feeAedFrom: 5200,
    feeAedTo: 7800,
    schedule: 'Blended: online theory plus monthly in-person practicals',
    audience: 'Early-years educators pursuing the Montessori method',
    outcomes: [
      'Prepare a Montessori learning environment',
      'Use the core Montessori materials across the five areas',
      'Observe and record child-led progress',
    ],
    placeholder: true,
  },
  {
    title: 'International Behaviour Therapist Programme',
    category: 'EDUCATION',
    durationWeeks: 18,
    feeAedFrom: 6500,
    feeAedTo: 9500,
    schedule: 'Weekend, with supervised practical hours',
    audience: 'Practising therapists seeking an international credential',
    outcomes: [
      'Design and supervise behaviour intervention plans',
      'Work ethically within scope of practice',
      'Build a supervised-hours portfolio',
    ],
    placeholder: true,
  },

  /* ───────────────────────────── Management ──────────────────────────────── */
  {
    title: 'Human Resources Management Diploma',
    category: 'MANAGEMENT',
    durationWeeks: 12,
    feeAedFrom: 4200,
    feeAedTo: 6200,
    schedule: 'Weekday evenings, twice weekly',
    audience: 'HR coordinators and administrators moving into HR management',
    outcomes: [
      'Run recruitment and onboarding end to end',
      'Apply UAE Labour Law to everyday HR decisions',
      'Build compensation and performance frameworks',
    ],
    placeholder: true,
  },
  {
    title: 'Hospital Management & Healthcare Diploma',
    category: 'MANAGEMENT',
    durationWeeks: 16,
    feeAedFrom: 5000,
    feeAedTo: 7500,
    schedule: 'Weekend, Saturdays full-day',
    audience: 'Clinic administrators, healthcare coordinators, DHA-licensed staff moving to admin',
    outcomes: [
      'Manage patient flow and clinic operations',
      'Understand DHA/MOH regulatory requirements',
      'Handle medical records, billing and insurance workflows',
    ],
    placeholder: true,
  },
  {
    title: 'Digital Marketing Diploma',
    category: 'MANAGEMENT',
    durationWeeks: 10,
    feeAedFrom: 3800,
    feeAedTo: 5800,
    schedule: 'Weekday evenings 7:00–9:30 PM',
    audience: 'Marketing executives, small-business owners, career changers',
    outcomes: [
      'Plan and run paid campaigns on Meta and Google',
      'Measure performance with GA4 and attribution basics',
      'Build an SEO and content plan for a UAE audience',
    ],
    placeholder: true,
  },
  {
    title: 'Hospitality & Management Diploma',
    category: 'MANAGEMENT',
    durationWeeks: 14,
    feeAedFrom: 4400,
    feeAedTo: 6400,
    schedule: 'Weekday evenings or weekend',
    audience: 'Hotel and F&B staff progressing to supervisory roles',
    outcomes: [
      'Manage front-office and housekeeping operations',
      'Apply revenue and cost control to F&B',
      'Lead a service team to brand standards',
    ],
    placeholder: true,
  },
  {
    title: 'Fashion Design Diploma',
    category: 'MANAGEMENT',
    durationWeeks: 18,
    feeAedFrom: 5500,
    feeAedTo: 8500,
    schedule: 'Weekday afternoons, studio-based',
    audience: 'Aspiring designers and boutique owners',
    outcomes: [
      'Develop a design concept into a technical pack',
      'Pattern-cut and construct core garments',
      'Present a small collection portfolio',
    ],
    placeholder: true,
  },

  /* ────────────────────────────── Finance ────────────────────────────────── */
  {
    title: 'Banking & Finance Diploma',
    category: 'FINANCE',
    durationWeeks: 14,
    feeAedFrom: 4600,
    feeAedTo: 6800,
    schedule: 'Weekday evenings, twice weekly',
    audience: 'Bank staff and finance graduates',
    outcomes: [
      'Read and interpret core financial statements',
      'Assess credit and basic risk exposure',
      'Understand UAE retail and corporate banking products',
    ],
    placeholder: true,
  },
  {
    title: 'CPA (Certified Public Accountant) Preparation',
    category: 'FINANCE',
    durationWeeks: 24,
    feeAedFrom: 9000,
    feeAedTo: 14000,
    schedule: 'Weekend intensive plus recorded sessions',
    audience: 'Qualified accountants pursuing US CPA licensure',
    outcomes: [
      'Cover all four CPA exam sections',
      'Practise under exam conditions',
      'Plan an exam sitting schedule and eligibility route',
    ],
    placeholder: true,
  },
  {
    title: 'CMA (Certified Management Accountant) Preparation',
    category: 'FINANCE',
    durationWeeks: 20,
    feeAedFrom: 7500,
    feeAedTo: 11500,
    schedule: 'Weekend, Saturdays 9:00 AM – 3:00 PM',
    audience: 'Management accountants and finance analysts',
    outcomes: [
      'Cover CMA Parts 1 and 2',
      'Apply cost management and internal control concepts',
      'Prepare for the essay sections',
    ],
    placeholder: true,
  },
  {
    title: 'FTA Tax Agent Preparation',
    category: 'FINANCE',
    durationWeeks: 8,
    feeAedFrom: 4200,
    feeAedTo: 6500,
    schedule: 'Weekend, half-day',
    audience: 'Tax professionals seeking FTA Tax Agent registration',
    outcomes: [
      'Meet FTA Tax Agent knowledge requirements',
      'Handle client registration and filing obligations',
      'Apply UAE VAT and Corporate Tax legislation',
    ],
    placeholder: true,
  },
  {
    title: 'Anti-Money Laundering (AML) Certification',
    category: 'FINANCE',
    durationWeeks: 6,
    feeAedFrom: 3000,
    feeAedTo: 4800,
    schedule: 'Weekday evenings, one week intensive available',
    audience: 'Compliance officers, banking and exchange-house staff',
    outcomes: [
      'Apply UAE AML/CFT obligations and reporting duties',
      'Run customer due diligence and risk scoring',
      'Recognise and escalate suspicious activity',
    ],
    placeholder: true,
  },
  {
    title: 'UAE Corporate Tax Course',
    category: 'FINANCE',
    durationWeeks: 5,
    feeAedFrom: 2800,
    feeAedTo: 4500,
    schedule: 'Weekday evenings, twice weekly',
    audience: 'Accountants and business owners adapting to Corporate Tax',
    outcomes: [
      'Determine taxable income and applicable rates',
      'Handle registration, filing and record keeping',
      'Understand free-zone and small-business relief',
    ],
    placeholder: true,
  },
  {
    title: 'UAE VAT Course',
    category: 'FINANCE',
    durationWeeks: 4,
    feeAedFrom: 2200,
    feeAedTo: 3600,
    schedule: 'Weekend, two Saturdays',
    audience: 'Bookkeepers, accountants, finance administrators',
    outcomes: [
      'Apply VAT treatment to common transactions',
      'Prepare and file a VAT return',
      'Handle input recovery and record retention',
    ],
    placeholder: true,
  },
  {
    title: 'IFRS Diploma',
    category: 'FINANCE',
    durationWeeks: 16,
    feeAedFrom: 6500,
    feeAedTo: 9800,
    schedule: 'Weekend, Saturdays full-day',
    audience: 'Qualified accountants and financial reporting staff',
    outcomes: [
      'Apply major IFRS standards to reporting',
      'Prepare IFRS-compliant financial statements',
      'Handle transition and disclosure requirements',
    ],
    placeholder: true,
  },

  /* ───────────────────────────── Languages ──────────────────────────────── */
  {
    title: 'Arabic Language Course',
    category: 'LANGUAGE',
    durationWeeks: 10,
    feeAedFrom: 2000,
    feeAedTo: 3500,
    schedule: 'Levels from Beginner to Advanced; weekday evening and weekend groups',
    audience: 'Residents and professionals wanting practical Gulf Arabic or MSA',
    outcomes: [
      'Hold everyday conversations in Arabic',
      'Read and write the Arabic script',
      'Handle workplace and government-office interactions',
    ],
    placeholder: true,
  },
  {
    title: 'English Language Course',
    category: 'LANGUAGE',
    durationWeeks: 10,
    feeAedFrom: 1800,
    feeAedTo: 3400,
    schedule: 'Levels A1–C1; morning, evening and weekend groups',
    audience: 'Professionals and students improving workplace or academic English',
    outcomes: [
      'Communicate confidently in a professional setting',
      'Improve business writing and email',
      'Prepare for IELTS-style assessment',
    ],
    placeholder: true,
  },
  {
    title: 'French Language Course',
    category: 'LANGUAGE',
    durationWeeks: 10,
    feeAedFrom: 2000,
    feeAedTo: 3600,
    schedule: 'Levels A1–B2; weekday evening groups',
    audience: 'Professionals, students and francophone-bound travellers',
    outcomes: [
      'Hold everyday French conversations',
      'Reach DELF-aligned competence',
      'Read and write at your level',
    ],
    placeholder: true,
  },
  {
    title: 'Spanish Language Course',
    category: 'LANGUAGE',
    durationWeeks: 10,
    feeAedFrom: 2000,
    feeAedTo: 3600,
    schedule: 'Levels A1–B2; weekend groups',
    audience: 'Beginners and travellers, plus professionals in LATAM-facing roles',
    outcomes: [
      'Hold everyday Spanish conversations',
      'Reach DELE-aligned competence',
      'Read and write at your level',
    ],
    placeholder: true,
  },
];

/**
 * Non-course knowledge: the operational questions callers actually ask.
 * Marked separately because these are safe to state confidently.
 */
export interface FaqSeed {
  title: string;
  category: Skill;
  content: string;
}

export const FAQS: FaqSeed[] = [
  {
    title: 'Location and how to reach FIT Institute',
    category: 'GENERAL',
    content: `FIT Institute is located at ${INSTITUTE.address}. The nearest metro station is Jumeirah Lakes Towers (JLT) on the Red Line, about a ten-minute walk. Paid parking is available in the building and in the surrounding Cluster W area. You can reach admissions on ${INSTITUTE.phone}, on WhatsApp at ${INSTITUTE.whatsapp}, or by email at ${INSTITUTE.email}. Office hours are ${INSTITUTE.officeHours}.`,
  },
  {
    title: 'Accreditation and certificate recognition',
    category: 'GENERAL',
    content: `FIT Institute is a KHDA-approved training provider in Dubai. KHDA approval means the institute is licensed by the Knowledge and Human Development Authority to deliver training in Dubai, and course completion certificates are issued under that approval. If you need a certificate attested for a specific employer, a licensing body such as DHA or MOH, or for use outside the UAE, tell the admissions team which body requires it — attestation requirements differ by authority and by country, and the team will confirm what is possible for your specific programme.`,
  },
  {
    title: 'How to enrol',
    category: 'GENERAL',
    content: `Enrolment takes three steps. First, speak to an admissions advisor to confirm the programme, the next intake date and the fee. Second, submit your documents: a passport copy, Emirates ID if you are a UAE resident, a passport-size photograph, and your highest educational certificate. Third, pay the registration fee to confirm your seat. Some programmes have prerequisites or a short placement assessment, particularly the language courses, where a placement test determines your starting level. Registration can be completed in person at the JLT office or remotely by email.`,
  },
  {
    title: 'Payment plans and fee questions',
    category: 'GENERAL',
    content: `FIT Institute offers instalment options on most longer programmes. Fees vary by programme, by intake and by any promotion running at the time, so the admissions team confirms the exact current fee and the available payment schedule when you register. Payment is accepted by card, bank transfer and cash at the office. If a company is sponsoring your study, the team can issue an invoice addressed to your employer. Please ask an advisor for the current figure rather than relying on an indicative range.`,
  },
  {
    title: 'Class formats, timings and attendance',
    category: 'GENERAL',
    content: `Most programmes run in three formats: weekday evening sessions, typically two evenings a week from about 6:30 PM; weekend sessions, usually Saturday full-day or half-day; and blended delivery, where theory is completed online and practical sessions happen on site. Class sizes are kept small. If you miss a session, recorded material or a catch-up session is available on many programmes — confirm this for your specific course, as it varies. Attendance requirements apply to programmes leading to a certification.`,
  },
  {
    title: 'Intake dates and course start',
    category: 'GENERAL',
    content: `New intakes typically start monthly for the popular programmes and less frequently for specialised ones. Because dates shift, the admissions team confirms the next available start date for your chosen programme when you enquire. If the next intake does not suit you, ask to be added to the waiting list for the following one and you will be contacted when registration opens.`,
  },
  {
    title: 'Corporate and group training',
    category: 'MANAGEMENT',
    content: `FIT Institute delivers corporate training for companies in Dubai, either at the JLT premises or at the client's own site. Programmes can be tailored in length and content — common requests include AML for banking and exchange-house teams, UAE Corporate Tax and VAT for finance departments, HR and UAE Labour Law for people teams, and business English for mixed-nationality workforces. Group pricing applies, and invoices can be issued to the company. For corporate enquiries, an advisor will arrange a short scoping call to understand headcount, level and timing.`,
  },
  {
    title: 'Refunds, transfers and deferrals',
    category: 'GENERAL',
    content: `Refund, transfer and deferral requests are handled case by case according to the terms you accept at registration, and generally depend on how much of the programme has been delivered. Because the outcome depends on your specific circumstances and timing, these requests are always reviewed by a member of the admissions team rather than decided automatically. If you need to defer to a later intake or transfer to a different programme, contact admissions as early as possible — earlier requests have more options available.`,
  },
  {
    title: 'Who studies at FIT Institute',
    category: 'GENERAL',
    content: `FIT Institute's students represent over 200 nationalities. The largest programme areas by enrolment are the education courses, with around 1,376 students, the language courses with around 912, the management courses with around 783, and the finance courses with around 685. Students range from fresh graduates and career changers to experienced professionals pursuing a specific credential such as CPA, CMA or FTA Tax Agent registration. Courses are taught in English unless the programme is a language course.`,
  },
  {
    title: 'Visa, residency and student status',
    category: 'GENERAL',
    content: `FIT Institute delivers professional training and short certification programmes. Questions about student visas, residency sponsorship or immigration status are handled by a member of the admissions team rather than automatically, because the answer depends on your current visa status, nationality and the programme length. Please ask to speak to an advisor for anything involving visas or residency.`,
  },
];

/** Realistic UAE mobile prefixes for generated caller numbers. */
export const UAE_MOBILE_PREFIXES = ['50', '52', '54', '55', '56', '58'] as const;

/** Countries the institute's students commonly call from. */
export const CALLER_COUNTRY_CODES = [
  { code: '+971', weight: 70, label: 'UAE' },
  { code: '+91', weight: 10, label: 'India' },
  { code: '+20', weight: 5, label: 'Egypt' },
  { code: '+966', weight: 5, label: 'Saudi Arabia' },
  { code: '+92', weight: 4, label: 'Pakistan' },
  { code: '+63', weight: 3, label: 'Philippines' },
  { code: '+44', weight: 3, label: 'UK' },
] as const;
