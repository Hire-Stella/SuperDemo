/**
 * Demo content per vertical.
 *
 * A newly onboarded centre arrives with queues, an assistant and a number, and
 * nothing else — which is correct for a real client on day one and useless for
 * showing anyone what the product does. These packs are what `demo-data.ts`
 * pours into a centre so its live board, inbox and analytics have shape.
 *
 * Kept as data rather than code so adding a vertical is writing sentences, not
 * branching logic. Everything here is invented sample content: no real business,
 * no real person, no real price.
 */

import { COURSES, FAQS } from './fit-courses';

/* ------------------------------ caller names ------------------------------ */
/*
 * Declared before the packs, which reference them at module load.
 */

/** Tamil first/last names, so the seeded callers match the store's customers. */
export const TAMIL_FIRST = [
  'Arun', 'Bhavani', 'Chandran', 'Deepa', 'Elango', 'Gayathri', 'Hari', 'Indira',
  'Jayanthi', 'Kavitha', 'Lokesh', 'Malathi', 'Nandini', 'Prakash', 'Radhika',
  'Saravanan', 'Thenmozhi', 'Umesh', 'Vasanthi', 'Yamini', 'Ganesh', 'Priya',
  'Muthu', 'Shanthi', 'Rajesh', 'Kalaivani',
];

export const TAMIL_LAST = [
  'Subramaniam', 'Krishnan', 'Rajan', 'Murugan', 'Pillai', 'Nadar', 'Chettiar',
  'Iyer', 'Sundaram', 'Balakrishnan', 'Venkatesh', 'Annamalai', 'Devi',
  'Ramachandran', 'Selvaraj', 'Thangavelu', 'Kandasamy', 'Ponnusamy',
];

/** The mix that rings a Dubai training institute. Same lists as `seed.ts`. */
export const FIT_FIRST = [
  'Ahmed', 'Fatima', 'Priya', 'Rajesh', 'Sara', 'Mohammed', 'Aisha', 'Karan',
  'Layla', 'Omar', 'Nadia', 'James', 'Chen', 'Ivan', 'Marie', 'Yusuf', 'Zahra',
  'Deepak', 'Hana', 'Tariq', 'Sofia', 'Bilal', 'Meera', 'Khalid',
];

export const FIT_LAST = [
  'Al Mansouri', 'Nair', 'Kumar', 'Ibrahim', 'Siddiqui', 'Rahman', 'Mehta',
  'Hassan', 'Khalil', 'Whitfield', 'Wei', 'Petrov', 'Dubois', 'Farouk',
  'Sharma', 'Ahmadi', 'Bakr', 'Iqbal', 'Menon', 'Haddad', 'Saleh', 'Roy',
  'Aziz', 'Fernandes',
];

export interface DemoStaff {
  name: string;
  email: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'AGENT';
  location: 'DUBAI' | 'INDIA' | 'EGYPT';
  skills: string[];
  ext: string;
  colour: string;
}

export interface DemoExchange {
  /** What the customer says. */
  caller: string;
  /** What the assistant answers, when it can. */
  ai: string;
  /** Routing slot this belongs to. */
  skill: 'EDUCATION' | 'FINANCE' | 'MANAGEMENT' | 'LANGUAGE' | 'GENERAL';
  /** True when this question normally needs a person. */
  escalates: boolean;
  /**
   * Why it handed off. Varies per question on purpose: the breakdown chart is
   * meant to tell an admin what to fix, and every bar saying "human-only topic"
   * would make it decorative.
   */
  reason?: 'CALLER_REQUESTED' | 'LOW_CONFIDENCE' | 'OUT_OF_SCOPE' | 'NEGATIVE_SENTIMENT' | 'MAX_TURNS' | 'HUMAN_ONLY_INTENT';
  /** What came of the call. Mirrors the `Disposition` enum. */
  disposition:
    | 'LEAD_QUALIFIED'
    | 'ENROLMENT_INTEREST'
    | 'INFO_PROVIDED'
    | 'CALLBACK_REQUESTED'
    | 'FEE_ENQUIRY'
    | 'EXISTING_STUDENT_SUPPORT'
    | 'NOT_INTERESTED'
    | 'WRONG_NUMBER'
    | 'SPAM';
}

export interface DemoPack {
  /** Names the assistant and knowledge base talk about. */
  interests: string[];
  staff: DemoStaff[];
  knowledge: { title: string; category: string; content: string }[];
  exchanges: DemoExchange[];
  whatsapp: { caller: string; ai: string }[];
  outbound: { name: string; opener: string; replies: string[]; followUp: string }[];
  tags: string[];
  /** Local-time hours where traffic concentrates. */
  peakHours: [number, number];
  /**
   * Calls per day, `[min, max]`. Per pack because the weekly shape is the first
   * thing anyone reads off the traffic chart, and it is not the same shape
   * twice: a grocery's busiest day is Saturday, an admissions office's is
   * Monday. Weekend here means Friday and Saturday, as elsewhere in the seeds.
   */
  volume: { weekday: [number, number]; weekend: [number, number] };
  /**
   * Names for the generated callers. Per pack because the caller base is part
   * of the story: a Tamil provisions store in Karama and a Dubai training
   * institute serving 200 nationalities do not get the same phone book, and a
   * demo where every caller is called Muthu Pillai stops reading as real the
   * moment the audience is the wrong client.
   */
  callerNames: { first: string[]; last: string[] };
}

/* ------------------------------ Tamil Mart -------------------------------- */
/**
 * A Tamil grocery in Dubai. Written specifically rather than as generic retail
 * because the whole point of the demo is that it reads like a real business:
 * the questions are the ones a provisions store actually gets — is the curry
 * leaf fresh today, can you deliver to Karama, do you do Pongal hampers.
 */
export const TAMIL_MART_PACK: DemoPack = {
  interests: [
    'Fresh curry leaves & greens',
    'Idli / dosa batter',
    'Gingelly & coconut oil',
    'Sona Masoori rice (25kg)',
    'Filter coffee powder',
    'Pongal festival hamper',
    'Sweets & savouries platter',
    'Bulk order — restaurant',
    'Home delivery',
    'Puja items',
  ],

  staff: [
    { name: 'Meena Sundaram',   email: 'meena@tamilmart.example',   role: 'ADMIN',      location: 'DUBAI', skills: ['GENERAL', 'EDUCATION', 'MANAGEMENT'], ext: '101', colour: '#c2410c' },
    { name: 'Karthik Raman',    email: 'karthik@tamilmart.example', role: 'SUPERVISOR', location: 'DUBAI', skills: ['MANAGEMENT', 'FINANCE', 'GENERAL'],   ext: '102', colour: '#7c3aed' },
    { name: 'Anitha Selvam',    email: 'anitha@tamilmart.example',  role: 'AGENT',      location: 'DUBAI', skills: ['EDUCATION', 'GENERAL'],               ext: '103', colour: '#0891b2' },
    { name: 'Vignesh Kumar',    email: 'vignesh@tamilmart.example', role: 'AGENT',      location: 'DUBAI', skills: ['EDUCATION', 'LANGUAGE'],              ext: '104', colour: '#16a34a' },
    { name: 'Lakshmi Iyer',     email: 'lakshmi@tamilmart.example', role: 'AGENT',      location: 'DUBAI', skills: ['FINANCE', 'GENERAL'],                 ext: '105', colour: '#db2777' },
    { name: 'Suresh Balan',     email: 'suresh@tamilmart.example',  role: 'AGENT',      location: 'DUBAI', skills: ['MANAGEMENT', 'GENERAL'],              ext: '106', colour: '#ca8a04' },
    { name: 'Divya Natarajan',  email: 'divya@tamilmart.example',   role: 'AGENT',      location: 'INDIA', skills: ['LANGUAGE', 'EDUCATION'],              ext: '201', colour: '#4f46e5' },
    { name: 'Ravi Chandran',    email: 'ravi@tamilmart.example',    role: 'AGENT',      location: 'INDIA', skills: ['GENERAL', 'FINANCE'],                 ext: '202', colour: '#0d9488' },
  ],

  knowledge: [
    {
      title: 'Store hours, branches and parking',
      category: 'GENERAL',
      content: [
        'SAMPLE CONTENT — replace with your real details.',
        '',
        'Karama branch: open daily 7am to 11pm, including public holidays.',
        'Al Quoz branch: open daily 8am to 10pm.',
        'Both branches have free customer parking for the first ninety minutes.',
        'The Karama branch is a five minute walk from ADCB metro station.',
        'The store is busiest on Friday evenings and the first weekend after payday.',
      ].join('\n'),
    },
    {
      title: 'Home delivery areas, charges and timings',
      category: 'EDUCATION',
      content: [
        'SAMPLE CONTENT — replace with your real policy.',
        '',
        'We deliver across Dubai and Sharjah. Orders placed before 2pm are delivered the same day;',
        'later orders go out the next morning.',
        'Delivery is free on orders over AED 150. Below that a flat AED 12 charge applies.',
        'Karama, Bur Dubai, Satwa and Al Nahda are same-day. Jebel Ali and Sharjah are next-day.',
        'Fresh items — curry leaves, greens, batter — are packed on the morning of dispatch, never the night before.',
        'A driver calls fifteen minutes before arriving.',
      ].join('\n'),
    },
    {
      title: 'Fresh stock and what arrives when',
      category: 'EDUCATION',
      content: [
        'SAMPLE CONTENT — replace with your real schedule.',
        '',
        'Fresh greens, curry leaves, drumsticks and banana leaf arrive Tuesday and Friday mornings.',
        'Idli and dosa batter is made daily and sold the same day.',
        'Fresh fish arrives Wednesday and Saturday before 8am.',
        'If an item is out of stock we can reserve it from the next delivery — ask at the counter or on the phone.',
      ].join('\n'),
    },
    {
      title: 'Bulk and wholesale orders for restaurants',
      category: 'MANAGEMENT',
      content: [
        'SAMPLE CONTENT — replace with your real terms.',
        '',
        'We supply restaurants, canteens and caterers across the Emirates.',
        'Wholesale pricing starts at 25kg for rice and flour, and 5kg for spices.',
        'A trade account needs a copy of the trade licence and takes one working day to open.',
        'Standing weekly orders can be scheduled for a fixed delivery day.',
        'Bulk enquiries are handled by a member of the team, not by the assistant.',
      ].join('\n'),
    },
    {
      title: 'Festival hampers — Pongal, Diwali, Tamil New Year',
      category: 'MANAGEMENT',
      content: [
        'SAMPLE CONTENT — replace with your real offering.',
        '',
        'Festival hampers are made to order for Pongal, Diwali and Tamil New Year.',
        'Standard hampers include rice, jaggery, ghee, sweets and a set of puja items.',
        'Corporate hampers can be branded and delivered to a single address in bulk.',
        'Orders for festival week should be placed at least five days ahead — the kitchen fills up.',
      ].join('\n'),
    },
    {
      title: 'Returns, refunds and damaged items',
      category: 'FINANCE',
      content: [
        'SAMPLE CONTENT — replace with your real policy.',
        '',
        'Packaged goods can be returned within seven days with the receipt, unopened.',
        'Fresh produce, batter and cut items cannot be returned, but tell us the same day if',
        'something arrived spoiled and we will replace it or refund it.',
        'Refunds go back to the original payment method within five working days.',
        'Damaged deliveries should be reported with a photo on the day of delivery.',
      ].join('\n'),
    },
    {
      title: 'Payment methods and the loyalty card',
      category: 'FINANCE',
      content: [
        'SAMPLE CONTENT — replace with your real details.',
        '',
        'We accept cash, all major cards, Apple Pay and bank transfer for trade accounts.',
        'The loyalty card earns one point per AED 10 spent; 500 points is AED 25 off.',
        'Loyalty points can be checked at the till or over the phone with the registered number.',
      ].join('\n'),
    },
    {
      title: 'Speaking to us in Tamil, Malayalam or English',
      category: 'LANGUAGE',
      content: [
        'SAMPLE CONTENT — replace with your real staffing.',
        '',
        'Our counter and phone staff speak Tamil, Malayalam, Hindi and English.',
        'If the assistant cannot help, ask for a person and the call is transferred to a colleague',
        'who speaks your language.',
      ].join('\n'),
    },
  ],

  exchanges: [
    { caller: 'Do you have fresh curry leaves today?', ai: 'Yes — fresh greens and curry leaves arrive Tuesday and Friday mornings, so today’s stock is in. Would you like it added to a delivery?', skill: 'EDUCATION', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'What time do you close tonight?', ai: 'The Karama branch is open until 11pm every day, and Al Quoz until 10pm.', skill: 'GENERAL', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'Do you deliver to Al Nahda?', ai: 'Yes, Al Nahda is same-day if you order before 2pm. Delivery is free over AED 150, otherwise AED 12.', skill: 'EDUCATION', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'Is the idli batter made today?', ai: 'The batter is made fresh every morning and sold the same day — nothing carried over.', skill: 'EDUCATION', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'How much is a 25kg bag of Sona Masoori?', ai: 'Let me check today’s price for you — rice pricing moves with the shipment, so I will put you through to the counter.', skill: 'FINANCE', escalates: true, disposition: 'FEE_ENQUIRY', reason: 'LOW_CONFIDENCE' },
    { caller: 'I want to open a trade account for my restaurant.', ai: 'Wholesale accounts need a copy of your trade licence and open in about a day. Let me hand you to the team who set those up.', skill: 'MANAGEMENT', escalates: true, disposition: 'CALLBACK_REQUESTED', reason: 'HUMAN_ONLY_INTENT' },
    { caller: 'My delivery arrived with a broken bottle of oil.', ai: 'I am sorry about that. Damaged items are replaced or refunded the same day — let me get someone to sort it out with you now.', skill: 'FINANCE', escalates: true, disposition: 'EXISTING_STUDENT_SUPPORT', reason: 'NEGATIVE_SENTIMENT' },
    { caller: 'Can you make twenty Pongal hampers for our office?', ai: 'Corporate hampers can be branded and delivered together. That needs the team to price it — putting you through.', skill: 'MANAGEMENT', escalates: true, disposition: 'ENROLMENT_INTEREST', reason: 'HUMAN_ONLY_INTENT' },
    { caller: 'Where is my order? It was supposed to come this morning.', ai: 'Let me check that for you — I will pass you to someone who can see the driver’s route.', skill: 'EDUCATION', escalates: true, disposition: 'EXISTING_STUDENT_SUPPORT', reason: 'OUT_OF_SCOPE' },
    { caller: 'Do you have banana leaf for a function on Saturday?', ai: 'Banana leaf comes in with the Friday delivery, so Saturday is fine. Shall I ask the counter to keep some aside?', skill: 'EDUCATION', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'How many loyalty points do I have?', ai: 'I can check that with your registered mobile number — one moment.', skill: 'FINANCE', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'Do you have parking at Karama?', ai: 'Yes, free customer parking for the first ninety minutes at both branches.', skill: 'GENERAL', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'Is anyone there who speaks Tamil?', ai: 'Of course — let me put you through to a colleague who speaks Tamil.', skill: 'LANGUAGE', escalates: true, disposition: 'INFO_PROVIDED', reason: 'CALLER_REQUESTED' },
    { caller: 'Do you sell puja items for Ayudha Pooja?', ai: 'Yes, we keep a full puja range and put festival sets together closer to the date.', skill: 'GENERAL', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'Can I return a rice bag I opened by mistake?', ai: 'Opened packages cannot be returned, but let me get a colleague to look at it with you.', skill: 'FINANCE', escalates: true, disposition: 'NOT_INTERESTED', reason: 'MAX_TURNS' },
    // Qualified, not merely interested: the caller named the volume, the branch
    // and the timeline, so there is enough for the wholesale team to act on.
    { caller: 'I run a canteen in Al Quoz and need 200kg of rice and 40 litres of oil every fortnight — can you quote that?', ai: 'That is a standing wholesale order, and Al Quoz is on our fortnightly route. I have your volumes and branch — the trade team will price it and call you back today.', skill: 'MANAGEMENT', escalates: true, disposition: 'LEAD_QUALIFIED', reason: 'HUMAN_ONLY_INTENT' },
    { caller: 'We are catering a 300-guest wedding in March and want one supplier for the dry goods.', ai: 'Bulk catering orders go through the wholesale desk and we can hold stock for a date. I have the guest count and the month — let me get the team to build you a quote.', skill: 'MANAGEMENT', escalates: true, disposition: 'LEAD_QUALIFIED', reason: 'HUMAN_ONLY_INTENT' },
    // The junk any published number gets. Short, closed out by the assistant,
    // and here so the inbox's outcome filter has rows behind every option.
    { caller: 'Is this the tailor next to the Karama branch?', ai: 'No, this is Tamil Mart — the tailor has their own line. Sorry about that.', skill: 'GENERAL', escalates: false, disposition: 'WRONG_NUMBER' },
    { caller: 'I am calling about a parcel for flat 402.', ai: 'This is Tamil Mart, a grocery — nothing to do with parcel deliveries, I am afraid.', skill: 'GENERAL', escalates: false, disposition: 'WRONG_NUMBER' },
    { caller: 'Congratulations, your business has been selected for a free marketing audit —', ai: 'Thank you, but we are not interested in cold sales calls. Ending the call now.', skill: 'GENERAL', escalates: false, disposition: 'SPAM' },
    { caller: 'This is a final notice about your card machine contract.', ai: 'We have no contract with you and this line is for customer orders. Ending the call.', skill: 'GENERAL', escalates: false, disposition: 'SPAM' },
  ],

  whatsapp: [
    { caller: 'Hi, do you have fresh drumsticks today?', ai: 'Yes, drumsticks came in this morning. Would you like some kept aside?' },
    { caller: 'What’s the delivery charge to Bur Dubai?', ai: 'Free over AED 150, otherwise AED 12. Bur Dubai is same-day before 2pm.' },
    { caller: 'Are you open on the public holiday?', ai: 'Yes, Karama is open 7am to 11pm including public holidays.' },
    { caller: 'Do you have gingelly oil in 5 litre?', ai: 'We stock 1L and 5L gingelly oil. Shall I reserve a 5L for you?' },
    { caller: 'Can I pay on delivery?', ai: 'Yes — cash or card at the door, both are fine.' },
  ],

  outbound: [
    {
      name: 'Weekly order reminder',
      opener: 'Hello, this is Tamil Mart calling about your usual weekly order. Would you like the same list this week?',
      replies: ['Yes please, same as always.', 'Add two litres of oil this time.', 'Not this week, thank you.'],
      followUp: 'Noted. We will have it packed and delivered on your usual day — anything else to add?',
    },
    {
      name: 'Festival hamper follow-up',
      opener: 'Hello, Tamil Mart here about the Pongal hamper you asked about last week. Shall I go through the options?',
      replies: ['Yes, tell me the sizes.', 'How much for twenty?', 'I have already ordered elsewhere.'],
      followUp: 'We can do standard or corporate hampers, and delivery to one address for bulk orders.',
    },
    {
      name: 'Trade account activation',
      opener: 'Hello, this is Tamil Mart. Your wholesale account is nearly set up — we just need a copy of the trade licence.',
      replies: ['I will send it today.', 'Which email do I send it to?', 'Can someone collect it?'],
      followUp: 'Perfect — once it is in, standing weekly orders can start from the following week.',
    },
    {
      name: 'Order ready for collection',
      opener: 'Hello, Tamil Mart calling — your bulk order is packed and ready for collection at the Karama branch.',
      replies: ['I will come this evening.', 'Can you deliver instead?', 'Hold it until tomorrow please.'],
      followUp: 'No problem. We will keep it aside at the counter under your name.',
    },
  ],

  tags: ['regular-customer', 'wholesale', 'delivery', 'festival', 'follow-up'],
  // A grocery's phone rings from early morning to late evening, unlike an office.
  peakHours: [8, 21],
  // Busiest at the weekend, and busier again the first weekend after payday.
  volume: { weekday: [10, 22], weekend: [18, 30] },
  callerNames: { first: TAMIL_FIRST, last: TAMIL_LAST },
};


/**
 * FIT Institute — the education vertical, and the centre the main seed builds.
 *
 * Its courses, contact details and knowledge base already live in
 * `fit-courses.ts`, so the interests and the knowledge are taken from there
 * rather than re-typed: a pack that drifts from the knowledge base produces
 * calls asking about courses the assistant has never heard of. What is written
 * out by hand is the part that does not exist anywhere else — the questions
 * admissions actually gets, and what the assistant can say back.
 *
 * `demo-data.ts` is additive, so this doubles as the way to give the existing
 * FIT centre more history:
 *
 *   pnpm demo:seed --slug fit-ai --days 45
 */
export const FIT_PACK: DemoPack = {
  // The real programme names. `contact.courseInterest` is shown on the screen
  // pop and the contact record, so it has to be something FIT actually teaches.
  interests: COURSES.map((c) => c.title),

  // FIT's own team, by the addresses the main seed uses — so a top-up run
  // against the existing centre reuses them and creates nobody.
  staff: [
    { name: 'Layla Haddad',      email: 'layla@fitiedu.com',  role: 'ADMIN',      location: 'DUBAI', skills: ['EDUCATION', 'GENERAL', 'MANAGEMENT'], ext: '101', colour: '#2563eb' },
    { name: 'Omar Sheikh',       email: 'omar@fitiedu.com',   role: 'SUPERVISOR', location: 'DUBAI', skills: ['FINANCE', 'MANAGEMENT', 'GENERAL'],   ext: '102', colour: '#7c3aed' },
    { name: 'Mariam Youssef',    email: 'mariam@fitiedu.com', role: 'AGENT',      location: 'DUBAI', skills: ['EDUCATION', 'GENERAL'],               ext: '103', colour: '#db2777' },
    { name: 'Hassan Al Balushi', email: 'hassan@fitiedu.com', role: 'AGENT',      location: 'DUBAI', skills: ['FINANCE', 'GENERAL'],                 ext: '104', colour: '#0891b2' },
    { name: 'Reem Abdullah',     email: 'reem@fitiedu.com',   role: 'AGENT',      location: 'DUBAI', skills: ['LANGUAGE', 'GENERAL'],                ext: '105', colour: '#ea580c' },
    { name: 'Zainab Qureshi',    email: 'zainab@fitiedu.com', role: 'AGENT',      location: 'DUBAI', skills: ['EDUCATION', 'LANGUAGE'],              ext: '106', colour: '#16a34a' },
    { name: 'Yousef Kamal',      email: 'yousef@fitiedu.com', role: 'AGENT',      location: 'DUBAI', skills: ['MANAGEMENT', 'GENERAL'],              ext: '107', colour: '#ca8a04' },
    { name: 'Noura Al Fahim',    email: 'noura@fitiedu.com',  role: 'AGENT',      location: 'DUBAI', skills: ['FINANCE', 'MANAGEMENT'],              ext: '108', colour: '#4f46e5' },
    { name: 'Anjali Verma',      email: 'anjali@fitiedu.com', role: 'AGENT',      location: 'INDIA', skills: ['FINANCE', 'GENERAL'],                 ext: '201', colour: '#0d9488' },
    { name: 'Rohit Deshpande',   email: 'rohit@fitiedu.com',  role: 'AGENT',      location: 'INDIA', skills: ['MANAGEMENT', 'EDUCATION'],            ext: '202', colour: '#be123c' },
    { name: 'Yasmin El Sayed',   email: 'yasmin@fitiedu.com', role: 'AGENT',      location: 'EGYPT', skills: ['LANGUAGE', 'EDUCATION'],              ext: '301', colour: '#9333ea' },
    { name: 'Karim Mostafa',     email: 'karim@fitiedu.com',  role: 'AGENT',      location: 'EGYPT', skills: ['GENERAL', 'MANAGEMENT'],              ext: '302', colour: '#059669' },
  ],

  // The published FAQs, verbatim. Course pages are seeded separately by
  // `seed.ts`; these are what a caller asks about that is not a single course.
  knowledge: FAQS.map((f) => ({ title: f.title, category: f.category, content: f.content })),

  /*
   * Admissions calls, by the routing slot they belong to.
   *
   * The AI never quotes a fee as final — PRICING_NOTE is in its system prompt
   * for a reason — so every price question either hedges or hands over, and the
   * replies here do the same. Escalation reasons vary per question because the
   * handoff-reason chart is meant to tell an admin what to fix.
   */
  exchanges: [
    /* ── education ── */
    { caller: 'What does the Early Childhood Education Diploma actually cover?', ai: 'It runs over several weeks across child development, classroom practice and observation, with a practical placement element. I can send the full outline by WhatsApp if that helps.', skill: 'EDUCATION', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'When does the next Montessori Diploma intake start?', ai: 'Intakes for the Montessori Diploma run regularly, and admissions confirm the exact next start date when you register — dates do move.', skill: 'EDUCATION', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'Do you have the Phonics Teacher Training on weekday evenings?', ai: 'Yes — weekday evenings from about 6:30pm, twice a week, and there is a weekend group as well.', skill: 'EDUCATION', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'Is the ABA certification something I can do while working full time?', ai: 'Most students on the ABA certification are working — it is built around evening and weekend sessions with blended theory.', skill: 'EDUCATION', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'How much is the ABA certification, and can I pay it in instalments?', ai: 'Instalments are available on the longer programmes. I do not want to quote you a figure that has changed — let me put you through to admissions for the current fee and the schedule.', skill: 'EDUCATION', escalates: true, disposition: 'FEE_ENQUIRY', reason: 'LOW_CONFIDENCE' },
    // Qualified, not merely interested: the programme, the group and the timing
    // are all settled, which is what makes it worth an advisor's time.
    { caller: 'I am a nursery teacher in Al Barsha and I want the SEN Diploma on the weekend group starting next intake — can someone confirm a seat for me?', ai: 'That is the weekend SEN group, and I have your role and the intake you want. Putting you through to an advisor who can hold the seat and take your documents.', skill: 'EDUCATION', escalates: true, disposition: 'LEAD_QUALIFIED', reason: 'HUMAN_ONLY_INTENT' },
    // Interested, not qualified: no group, no timing, nothing an advisor can
    // act on yet. The distinction is the whole point of having both outcomes.
    { caller: 'I am thinking about retraining into early years teaching at some point — what would I need?', ai: 'The Early Childhood Education Diploma is the usual route, and the Learning Support Assistant certificate is a shorter start. Would you like an advisor to talk through which fits?', skill: 'EDUCATION', escalates: false, disposition: 'ENROLMENT_INTEREST' },
    { caller: 'A friend did the Montessori Diploma here and said it was good. I might do it next year.', ai: 'Good to hear. Intakes run through the year, so nothing is lost by deciding later — shall I have an advisor send you the outline to keep?', skill: 'EDUCATION', escalates: false, disposition: 'ENROLMENT_INTEREST' },
    { caller: 'I have asked three times now and I still cannot work out which course I need.', ai: 'I am clearly not getting you to the right answer. Let me hand you to an advisor who can go through it properly with you.', skill: 'EDUCATION', escalates: true, disposition: 'CALLBACK_REQUESTED', reason: 'MAX_TURNS' },

    /* ── finance & tax ── */
    { caller: 'Is the AML certification recognised by the exchange houses here?', ai: 'The AML certification is delivered under FIT’s KHDA approval and is widely taken by banking and exchange-house staff in the UAE.', skill: 'FINANCE', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'What is the difference between the CMA and the CPA if I work in industry?', ai: 'Broadly, CMA leans towards management accounting inside a business and CPA towards audit and public practice. Both are prepared for here.', skill: 'FINANCE', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'Is the IFRS Diploma available online?', ai: 'IFRS runs in a blended format — theory online, with sessions on site at the JLT office.', skill: 'FINANCE', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'Does the CPA preparation fee include the exam fees themselves?', ai: 'The exam fees are charged separately by the awarding body, and the programme fee changes by intake — admissions will confirm both figures rather than have me guess.', skill: 'FINANCE', escalates: true, disposition: 'FEE_ENQUIRY', reason: 'LOW_CONFIDENCE' },
    { caller: 'Can someone call me back tomorrow about the FTA Tax Agent programme? I am driving.', ai: 'Of course — I have your number and I have put you down for a callback tomorrow about the FTA Tax Agent programme. Drive safely.', skill: 'FINANCE', escalates: false, disposition: 'CALLBACK_REQUESTED' },
    { caller: 'I am the finance manager at a Deira trading company and four of us need the UAE Corporate Tax course before the next filing deadline.', ai: 'Four seats before the filing deadline is a group booking, and I have your company and the timing. Let me get you to the team who can price it and confirm dates.', skill: 'FINANCE', escalates: true, disposition: 'LEAD_QUALIFIED', reason: 'HUMAN_ONLY_INTENT' },

    /* ── management & corporate ── */
    { caller: 'Does the HR Management Diploma cover UAE labour law?', ai: 'Yes — UAE labour law and end-of-service calculations are part of the HR Management Diploma.', skill: 'MANAGEMENT', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'We want AML training for twelve staff, delivered at our own office in Deira.', ai: 'Corporate delivery on your own premises is something we do regularly. Twelve staff needs group pricing — putting you through to the corporate team now.', skill: 'MANAGEMENT', escalates: true, disposition: 'LEAD_QUALIFIED', reason: 'HUMAN_ONLY_INTENT' },
    { caller: 'Can you invoice my employer directly for the Digital Marketing Diploma?', ai: 'Yes, invoices can be issued to a sponsoring company. An advisor needs your company details to raise it — let me pass you across.', skill: 'MANAGEMENT', escalates: true, disposition: 'CALLBACK_REQUESTED', reason: 'HUMAN_ONLY_INTENT' },
    { caller: 'I am not going ahead with the Fashion Design Diploma — I found something closer to home.', ai: 'Understood, and thank you for letting us know. I have noted it so nobody keeps calling you about it.', skill: 'MANAGEMENT', escalates: false, disposition: 'NOT_INTERESTED' },
    { caller: 'Is the Hospital Management Diploma any use for someone already working in a clinic?', ai: 'It is taken by clinic and hospital administrators as well as people moving into the field — the operations and compliance modules are the draw.', skill: 'MANAGEMENT', escalates: false, disposition: 'INFO_PROVIDED' },

    /* ── languages ── */
    { caller: 'Do I need a placement test for the English Language Course?', ai: 'Yes, a short placement test sets your starting level. It takes about half an hour and can be done at the office.', skill: 'LANGUAGE', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'Is there anyone there I can speak to in Arabic?', ai: 'Of course — let me put you through to a colleague who speaks Arabic.', skill: 'LANGUAGE', escalates: true, disposition: 'INFO_PROVIDED', reason: 'CALLER_REQUESTED' },
    { caller: 'I want the French Language Course on the evening group and I can pay the registration on Sunday.', ai: 'Evening French, and you are ready to register on Sunday — I have that. Transferring you to an advisor to take the placement test booking and your documents.', skill: 'LANGUAGE', escalates: true, disposition: 'LEAD_QUALIFIED', reason: 'HUMAN_ONLY_INTENT' },
    { caller: 'How long does the Spanish course run for?', ai: 'The Spanish course runs over several weeks per level, with two sessions a week. Admissions confirm the level and the dates when you enrol.', skill: 'LANGUAGE', escalates: false, disposition: 'INFO_PROVIDED' },

    /* ── general & admissions ── */
    { caller: 'Where exactly is the office and is there parking?', ai: 'Oaks Liwa Heights in Cluster W, JLT — office 3505. JLT metro is about ten minutes on foot, and there is paid parking in the building.', skill: 'GENERAL', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'Are your certificates KHDA approved?', ai: 'FIT Institute is a KHDA-approved training provider, and completion certificates are issued under that approval.', skill: 'GENERAL', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'I need my certificate attested for the DHA — how do I do that?', ai: 'Attestation depends on which body is asking, and DHA has its own requirements. Let me get someone who handles attestations to talk you through it.', skill: 'GENERAL', escalates: true, disposition: 'EXISTING_STUDENT_SUPPORT', reason: 'OUT_OF_SCOPE' },
    { caller: 'Do you sponsor a student visa for the diploma programmes?', ai: 'Visa and residency questions depend on your current status, so those are always handled by an advisor rather than by me. Putting you through.', skill: 'GENERAL', escalates: true, disposition: 'INFO_PROVIDED', reason: 'HUMAN_ONLY_INTENT' },
    { caller: 'An advisor promised me a call three days ago and nobody rang.', ai: 'I am sorry — that should not have happened. I am taking you straight to a supervisor rather than putting you back in a queue.', skill: 'GENERAL', escalates: true, disposition: 'EXISTING_STUDENT_SUPPORT', reason: 'NEGATIVE_SENTIMENT' },
    { caller: 'I finished the Learning Support Assistant certificate last year and I need a duplicate certificate.', ai: 'Duplicate certificates are issued from the student record, which I cannot open. Let me get someone from admissions on to it.', skill: 'GENERAL', escalates: true, disposition: 'EXISTING_STUDENT_SUPPORT', reason: 'OUT_OF_SCOPE' },
    { caller: 'Can I defer my Montessori intake to the next one? Something has come up.', ai: 'Deferrals are reviewed case by case and the earlier you ask the more options there are. Passing you to admissions now.', skill: 'GENERAL', escalates: true, disposition: 'EXISTING_STUDENT_SUPPORT', reason: 'HUMAN_ONLY_INTENT' },

    /* ── the junk any published number gets ── */
    { caller: 'Is this the dental clinic on the ground floor?', ai: 'No, this is FIT Institute — the clinic has its own line. Sorry about that.', skill: 'GENERAL', escalates: false, disposition: 'WRONG_NUMBER' },
    { caller: 'I am calling about a parcel delivery for office 3502.', ai: 'This is FIT Institute, a training institute — nothing to do with deliveries, I am afraid.', skill: 'GENERAL', escalates: false, disposition: 'WRONG_NUMBER' },
    { caller: 'Congratulations, your business has been selected for a free marketing audit —', ai: 'Thank you, but we are not interested in cold sales calls. Ending the call now.', skill: 'GENERAL', escalates: false, disposition: 'SPAM' },
    { caller: 'This is a final notice regarding your vehicle insurance policy.', ai: 'This is a training institute and we have no policy with you. Ending the call.', skill: 'GENERAL', escalates: false, disposition: 'SPAM' },
  ],

  whatsapp: [
    { caller: 'Hi, is registration still open for the ABA certification?', ai: 'Registration is open for the next intake. Would you like an advisor to confirm the start date and hold a seat?' },
    { caller: 'What documents do I need to enrol?', ai: 'Passport copy, Emirates ID if you are a resident, a passport photo and your highest certificate. Registration fee confirms the seat.' },
    { caller: 'Are the weekend classes full day or half day?', ai: 'Weekend groups are usually Saturday, either full day or half day depending on the programme.' },
    { caller: 'Do you have anything for someone who wants to teach phonics?', ai: 'Yes — the Phonics Teacher Training, weekday evenings or weekends. Shall I send you the outline?' },
    { caller: 'Can I pay the fee in instalments?', ai: 'Instalments are available on most longer programmes. Admissions confirm the schedule when you register.' },
    { caller: 'Is the office open on Saturday?', ai: 'Office hours are Sunday to Thursday, 9am to 6pm. Weekend classes still run, and WhatsApp is answered on Saturdays.' },
  ],

  outbound: [
    {
      name: 'Intake reminder — enquired last month',
      opener: 'Hello, this is FIT Institute. You enquired about a programme with us last month and the next intake is opening — shall I go through the dates?',
      replies: ['Yes please, which dates?', 'I am still deciding.', 'I have enrolled somewhere else, thank you.'],
      followUp: 'The next intake has both a weekday evening and a weekend group, and an advisor can hold a seat while you decide.',
    },
    {
      name: 'Document follow-up',
      opener: 'Hello, FIT Institute here — your registration is nearly complete, we are just waiting on your highest educational certificate.',
      replies: ['I will email it today.', 'Which address do I send it to?', 'Can I bring it in person?'],
      followUp: 'Perfect. Once it is on file your seat is confirmed and you will get the joining details for the intake.',
    },
    {
      name: 'Corporate training follow-up',
      opener: 'Hello, this is FIT Institute calling about the corporate training you asked us to quote for your team.',
      replies: ['Yes, what is the pricing?', 'Send it to me by email.', 'We have put it on hold for now.'],
      followUp: 'Group pricing depends on headcount and whether it runs at your site or ours — an advisor can put both options together.',
    },
    {
      name: 'Waiting list — intake opened',
      opener: 'Hello, FIT Institute here. You asked to be told when registration opened for the next intake, and it has.',
      replies: ['Great, I want to register.', 'How much is it now?', 'I am not looking any more.'],
      followUp: 'Seats on the waiting list are released in order, so an advisor can take your details now and confirm today.',
    },
  ],

  tags: ['hot-lead', 'follow-up', 'corporate', 'returning-student', 'waiting-list'],
  // Admissions is a Sunday-to-Thursday office, and the phone is busiest around
  // the working day rather than the evening.
  peakHours: [10, 19],
  // The opposite shape to the grocery: the weekend is nearly silent.
  volume: { weekday: [14, 26], weekend: [3, 9] },
  // FIT's students come from over 200 nationalities; the caller list reflects
  // the Gulf and South Asian mix that actually rings admissions.
  callerNames: { first: FIT_FIRST, last: FIT_LAST },
};

/* ----------------------------- car rental --------------------------------- */
/**
 * A Dubai car rental desk.
 *
 * The five routing slots carry different work here than in either other pack,
 * and that is the point of writing it out rather than reaching for "generic
 * retail": a rental company's phone is mostly bookings and rates, but its
 * *difficult* calls are fines, deposits and damage — and those are the ones
 * that reach a person. The escalation mix reflects that, because the handoff
 * chart is meant to tell an operator what to fix.
 *
 * Caller names are the FIT lists: a rental desk off Sheikh Zayed Road takes
 * calls from the same Gulf, South Asian and European mix, and inventing a
 * fourth phone book to say so would be noise.
 */
export const LEGEND_RENTAL_PACK: DemoPack = {
  interests: [
    'Economy hatchback — daily',
    'Mid-size sedan — weekly',
    'SUV (7-seater) — weekend',
    'Luxury / sports hire',
    'Monthly lease',
    'Corporate fleet account',
    'Airport pickup & drop',
    'Chauffeur service',
    'Long-term lease (12 months)',
    'Baby seat / additional driver',
  ],

  staff: [
    { name: 'Faisal Al Rashid',  email: 'faisal@legendrental.example',  role: 'ADMIN',      location: 'DUBAI', skills: ['GENERAL', 'MANAGEMENT', 'EDUCATION'], ext: '101', colour: '#1d4ed8' },
    { name: 'Rania Khoury',      email: 'rania@legendrental.example',   role: 'SUPERVISOR', location: 'DUBAI', skills: ['FINANCE', 'MANAGEMENT', 'GENERAL'],   ext: '102', colour: '#7c3aed' },
    { name: 'Imran Sheikh',      email: 'imran@legendrental.example',   role: 'AGENT',      location: 'DUBAI', skills: ['EDUCATION', 'GENERAL'],               ext: '103', colour: '#0891b2' },
    { name: 'Joanna Fernandes',  email: 'joanna@legendrental.example',  role: 'AGENT',      location: 'DUBAI', skills: ['EDUCATION', 'LANGUAGE'],              ext: '104', colour: '#db2777' },
    { name: 'Mahmoud Saleh',     email: 'mahmoud@legendrental.example', role: 'AGENT',      location: 'DUBAI', skills: ['FINANCE', 'GENERAL'],                 ext: '105', colour: '#ea580c' },
    { name: 'Tanya Petrova',     email: 'tanya@legendrental.example',   role: 'AGENT',      location: 'DUBAI', skills: ['EDUCATION', 'MANAGEMENT'],            ext: '106', colour: '#16a34a' },
    { name: 'Bilal Chaudhry',    email: 'bilal@legendrental.example',   role: 'AGENT',      location: 'DUBAI', skills: ['LANGUAGE', 'GENERAL'],                ext: '107', colour: '#ca8a04' },
    { name: 'Grace Mutua',       email: 'grace@legendrental.example',   role: 'AGENT',      location: 'DUBAI', skills: ['FINANCE', 'MANAGEMENT'],              ext: '108', colour: '#4f46e5' },
    { name: 'Sandeep Rao',       email: 'sandeep@legendrental.example', role: 'AGENT',      location: 'INDIA', skills: ['EDUCATION', 'FINANCE'],               ext: '201', colour: '#0d9488' },
    { name: 'Neha Kulkarni',     email: 'neha@legendrental.example',    role: 'AGENT',      location: 'INDIA', skills: ['GENERAL', 'LANGUAGE'],                ext: '202', colour: '#be123c' },
    { name: 'Ahmed Nabil',       email: 'ahmed.n@legendrental.example', role: 'AGENT',      location: 'EGYPT', skills: ['MANAGEMENT', 'GENERAL'],              ext: '301', colour: '#9333ea' },
    { name: 'Dina Shawky',       email: 'dina@legendrental.example',    role: 'AGENT',      location: 'EGYPT', skills: ['LANGUAGE', 'EDUCATION'],              ext: '302', colour: '#059669' },
  ],

  knowledge: [
    {
      title: 'Branches, opening hours and airport desks',
      category: 'GENERAL',
      content: [
        'SAMPLE CONTENT — replace with your real details.',
        '',
        'Head office on Sheikh Zayed Road: open daily 8am to 9pm.',
        'Deira branch: open daily 9am to 8pm.',
        'DXB Terminal 3 desk: staffed 24 hours.',
        'Free delivery of the vehicle to any Dubai address on rentals of three days or more.',
        'Collection from your address is free on monthly rentals, AED 75 otherwise.',
      ].join('\n'),
    },
    {
      title: 'What you need to rent — licence and documents',
      category: 'EDUCATION',
      content: [
        'SAMPLE CONTENT — replace with your real policy.',
        '',
        'UAE residents: Emirates ID and a valid UAE driving licence.',
        'Visitors: passport, visit visa page, home licence and an International Driving Permit.',
        'Licences from the GCC, UK, EU, US, Canada, Australia, Japan and South Africa are accepted directly.',
        'Minimum age is 22 for standard vehicles and 25 for luxury and sports models.',
        'The licence must have been held for at least one year.',
        'The card used for the deposit must belong to the driver named on the contract.',
      ].join('\n'),
    },
    {
      title: 'Rates, deposits and what is included',
      category: 'FINANCE',
      content: [
        'SAMPLE CONTENT — replace with your real pricing.',
        '',
        'Daily, weekly and monthly rates are quoted inclusive of comprehensive insurance and registration.',
        'A refundable security deposit is held on the card: AED 1,000 for economy and mid-size,',
        'AED 3,000 for SUVs, and AED 5,000 upwards for luxury models.',
        'The deposit is released 21 days after the vehicle is returned, once Salik and any fines have cleared.',
        'Mileage is capped at 250km a day, 1,750km a week and 4,500km a month. Excess is AED 0.50 per km.',
        'Salik tolls are charged at cost and added to the final invoice.',
        'Insurance excess is AED 1,200 on standard vehicles unless the damage waiver is taken.',
      ].join('\n'),
    },
    {
      title: 'Fines, Salik and traffic offences',
      category: 'FINANCE',
      content: [
        'SAMPLE CONTENT — replace with your real policy.',
        '',
        'Traffic fines reach us from the RTA up to 30 days after the offence date.',
        'Fines are charged to the card on file at cost plus an AED 50 administration fee per fine.',
        'A photograph of the fine notice is emailed to the driver before the card is charged.',
        'Salik crossings are AED 4 each and are billed at cost with no markup.',
        'Disputed fines can be contested through us, but the charge stands until the RTA reverses it.',
      ].join('\n'),
    },
    {
      title: 'Accidents, breakdowns and roadside assistance',
      category: 'LANGUAGE',
      content: [
        'SAMPLE CONTENT — replace with your real procedure.',
        '',
        'In any accident, however minor, call the police on 999 first and obtain a police report.',
        'Insurance will not cover damage without a police report — this is the single most common',
        'reason a claim is refused.',
        'Roadside assistance runs 24 hours: punctures, battery, lockouts and recovery.',
        'A replacement vehicle is provided within four hours anywhere in Dubai if the car is undriveable',
        'and the driver is not at fault.',
      ].join('\n'),
    },
    {
      title: 'Corporate accounts and long-term leasing',
      category: 'MANAGEMENT',
      content: [
        'SAMPLE CONTENT — replace with your real terms.',
        '',
        'Corporate accounts need a trade licence, VAT certificate and a signed leasing agreement.',
        'Leases run 12, 24 or 36 months and include registration, servicing, tyres and replacement vehicles.',
        'Fleets of five vehicles or more get a dedicated account manager and consolidated monthly invoicing.',
        'Drivers can be added or swapped on a corporate contract without re-signing.',
        'Early termination is charged at two months of the contracted rate.',
      ].join('\n'),
    },
  ],

  exchanges: [
    { caller: 'How much is a Nissan Sunny for three days?', ai: 'Our economy sedans start around AED 90 a day, and three days falls in the short-hire band. Rates include insurance and registration. Shall I check availability for your dates?', skill: 'EDUCATION', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'Do you have a 7-seater available this weekend?', ai: 'We keep several 7-seat SUVs. Weekends go quickly, so let me take your dates and hold one.', skill: 'EDUCATION', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'I am a tourist — can I drive on my UK licence?', ai: 'Yes. A UK licence is accepted directly alongside your passport and visit visa page. An International Driving Permit is recommended but not required for UK holders.', skill: 'EDUCATION', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'What deposit do you take on an SUV?', ai: 'AED 3,000, held on the card and released 21 days after return once Salik and any fines have cleared.', skill: 'FINANCE', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'Can you deliver the car to my hotel in Marina?', ai: 'Yes — delivery anywhere in Dubai is free on rentals of three days or more. What time suits you?', skill: 'EDUCATION', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'Is there a mileage limit?', ai: '250km a day, 1,750km a week, 4,500km a month. Beyond that it is AED 0.50 per kilometre.', skill: 'EDUCATION', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'I have been charged AED 700 for a fine I never got.', ai: 'I am sorry — fines reach us up to 30 days later and we email the notice before charging. Let me put you through to someone who can pull the RTA record.', skill: 'FINANCE', escalates: true, disposition: 'EXISTING_STUDENT_SUPPORT', reason: 'NEGATIVE_SENTIMENT' },
    { caller: 'My deposit still has not come back after a month.', ai: 'That is past our 21-day window and needs looking at properly. Transferring you to accounts now.', skill: 'FINANCE', escalates: true, disposition: 'EXISTING_STUDENT_SUPPORT', reason: 'NEGATIVE_SENTIMENT' },
    { caller: 'I have had a small accident in Al Quoz, what do I do?', ai: 'Call 999 for a police report first — insurance will not cover it without one. Staying on the line, I am connecting you to our team right now.', skill: 'LANGUAGE', escalates: true, disposition: 'EXISTING_STUDENT_SUPPORT', reason: 'HUMAN_ONLY_INTENT' },
    { caller: 'The car has a flat tyre on Emirates Road.', ai: 'Roadside assistance runs 24 hours and I am escalating this now so they can reach you.', skill: 'LANGUAGE', escalates: true, disposition: 'EXISTING_STUDENT_SUPPORT', reason: 'HUMAN_ONLY_INTENT' },
    { caller: 'Can I extend my rental by another week?', ai: 'Usually yes, subject to the car not being reserved after you. Let me check the booking with a colleague.', skill: 'EDUCATION', escalates: true, disposition: 'EXISTING_STUDENT_SUPPORT', reason: 'OUT_OF_SCOPE' },
    { caller: 'What is your best monthly price on a Pajero?', ai: 'Monthly rates on the larger SUVs are negotiated rather than listed. Putting you through to someone who can quote it.', skill: 'FINANCE', escalates: true, disposition: 'FEE_ENQUIRY', reason: 'LOW_CONFIDENCE' },
    { caller: 'Do you do chauffeur-driven hire?', ai: 'We do, hourly or daily, with an English or Arabic speaking driver. Let me get the chauffeur desk to price your trip.', skill: 'MANAGEMENT', escalates: true, disposition: 'ENROLMENT_INTEREST', reason: 'HUMAN_ONLY_INTENT' },
    /*
     * Not every corporate or roadside call needs a person, and a pack where they
     * all do reports 0% containment on those two queues — which reads as the
     * assistant being broken rather than as the work being genuinely human.
     */
    { caller: 'What is included in a long-term lease?', ai: 'Registration, servicing, tyres and a replacement vehicle if yours goes off-road, across 12, 24 or 36 months. Insurance is in the monthly rate too.', skill: 'MANAGEMENT', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'How many cars before we get an account manager?', ai: 'Five or more puts you on a dedicated account manager with consolidated monthly invoicing.', skill: 'MANAGEMENT', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'Can we swap which driver uses a leased car?', ai: 'Yes — drivers can be added or changed on a corporate contract without re-signing anything.', skill: 'MANAGEMENT', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'What documents do we need to open a corporate account?', ai: 'A trade licence, VAT certificate and the signed leasing agreement. Send them over and the account is usually open within a day.', skill: 'MANAGEMENT', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'Is roadside assistance included or extra?', ai: 'Included, 24 hours: punctures, batteries, lockouts and recovery, at no extra charge.', skill: 'LANGUAGE', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'The fuel light is on — do I return it full?', ai: 'Yes, same fuel level as collection. There is a refuelling charge plus the fuel cost if it comes back lower.', skill: 'LANGUAGE', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'How long for a replacement if the car breaks down?', ai: 'Within four hours anywhere in Dubai, provided the car is undriveable and you are not at fault.', skill: 'LANGUAGE', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'Where do I return the car at the airport?', ai: 'The Terminal 3 desk, staffed 24 hours. Park in the rental return bay and someone will meet you.', skill: 'LANGUAGE', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'Can I add my wife as a second driver?', ai: 'Yes — she needs to be present with her licence and Emirates ID at collection. There is a small additional-driver fee.', skill: 'GENERAL', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'Do you provide a baby seat?', ai: 'Baby and booster seats are available on request at AED 25 a day. Shall I add one to the booking?', skill: 'GENERAL', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'Is the airport desk open at 3am?', ai: 'Yes, our Terminal 3 desk is staffed 24 hours.', skill: 'GENERAL', escalates: false, disposition: 'INFO_PROVIDED' },
    { caller: 'Someone who speaks Arabic, please.', ai: 'Of course — connecting you to an Arabic-speaking colleague now.', skill: 'LANGUAGE', escalates: true, disposition: 'INFO_PROVIDED', reason: 'CALLER_REQUESTED' },
    { caller: 'I want to talk to a person, not a machine.', ai: 'No problem at all — putting you through to the desk now.', skill: 'GENERAL', escalates: true, disposition: 'INFO_PROVIDED', reason: 'CALLER_REQUESTED' },
    { caller: 'Your website quoted AED 1,400 a month but the desk said 1,900.', ai: 'That gap needs a person to look at the quote and the booking together — transferring you now.', skill: 'FINANCE', escalates: true, disposition: 'NOT_INTERESTED', reason: 'MAX_TURNS' },
    // Qualified: vehicle count, term and start date are all on the table, so the
    // fleet desk has something to quote rather than a conversation to restart.
    { caller: 'We are opening a Dubai office and need eight mid-size sedans on a 24-month lease from March.', ai: 'That is a corporate lease and eight vehicles puts you in the dedicated account-manager band, with servicing and replacements included. I have the count, term and start month — the fleet team will build a quote and call you today.', skill: 'MANAGEMENT', escalates: true, disposition: 'LEAD_QUALIFIED', reason: 'HUMAN_ONLY_INTENT' },
    { caller: 'Our hotel needs two 7-seaters on permanent standby for guest transfers, starting next month.', ai: 'Standing hospitality contracts run as a long-term lease with a named account manager and consolidated invoicing. I have the vehicles and the start — passing you to the fleet desk to price it.', skill: 'MANAGEMENT', escalates: true, disposition: 'LEAD_QUALIFIED', reason: 'HUMAN_ONLY_INTENT' },
    { caller: 'I need a car for six months for my staff, what does that cost?', ai: 'Six months sits in our long-term band and is quoted per vehicle and grade. Let me get the leasing team to work it out with you.', skill: 'MANAGEMENT', escalates: true, disposition: 'CALLBACK_REQUESTED', reason: 'HUMAN_ONLY_INTENT' },
    // The junk any published number gets, so the inbox outcome filter has rows
    // behind every option.
    { caller: 'Is this the Toyota service centre on Sheikh Zayed Road?', ai: 'No, this is Legend Rent A Car — the service centre has its own line. Sorry about that.', skill: 'GENERAL', escalates: false, disposition: 'WRONG_NUMBER' },
    { caller: 'I am calling about selling my car.', ai: 'We rent and lease rather than buy from the public, so we are not the right people for that.', skill: 'GENERAL', escalates: false, disposition: 'WRONG_NUMBER' },
    { caller: 'Your vehicle warranty is about to expire — press one to renew.', ai: 'This is a business line and we have no warranty with you. Ending the call.', skill: 'GENERAL', escalates: false, disposition: 'SPAM' },
    { caller: 'We can put your company at the top of Google for a small fee —', ai: 'Thank you, but we are not interested in cold sales calls. Ending the call now.', skill: 'GENERAL', escalates: false, disposition: 'SPAM' },
  ],

  whatsapp: [
    { caller: 'Hi, is the Corolla available from Thursday?', ai: 'Let me check Thursday for you — how many days would you need it?' },
    { caller: 'What deposit for an economy car?', ai: 'AED 1,000, refundable 21 days after return once Salik and fines clear.' },
    { caller: 'Can you drop the car at DXB Terminal 1?', ai: 'Yes, airport delivery is free on three days or more. What time is your flight in?' },
    { caller: 'Do I need an International Driving Permit?', ai: 'Not if your licence is from the UK, EU, US, GCC, Canada, Australia, Japan or South Africa.' },
    { caller: 'How much are Salik charges?', ai: 'AED 4 per crossing, billed at cost with no markup on the final invoice.' },
    { caller: 'Can I pay monthly by bank transfer?', ai: 'Yes, on monthly and corporate contracts. I can send the account details across.' },
  ],

  outbound: [
    {
      name: 'Booking confirmation callback',
      opener: 'Hello, this is Legend Rent A Car confirming your booking for tomorrow. Shall I run through the collection details?',
      replies: ['Yes please.', 'Can you deliver instead?', 'I need to change the date.'],
      followUp: 'Noted. Bring your licence and Emirates ID, and the deposit goes on the card at collection.',
    },
    {
      name: 'Rental ending — extend or return',
      opener: 'Hello, Legend Rent A Car here. Your rental ends on Friday — would you like to extend or arrange collection?',
      replies: ['Extend by a week.', 'Collect it from my office.', 'I will drop it at the branch.'],
      followUp: 'Perfect. I will update the contract and send the revised invoice by email.',
    },
    {
      name: 'Corporate lease follow-up',
      opener: 'Hello, this is Legend Rent A Car about the fleet quote we sent over. Did you have any questions on the terms?',
      replies: ['Send it to our finance team.', 'Can you do 36 months?', 'We have gone with someone else.'],
      followUp: 'Understood. Longer terms bring the monthly rate down, and servicing stays included either way.',
    },
    {
      name: 'Deposit released',
      opener: 'Hello, Legend Rent A Car calling — your security deposit has been released back to your card today.',
      replies: ['Thank you.', 'How long until it shows?', 'There was a fine deducted?'],
      followUp: 'It usually shows within three to five working days depending on your bank.',
    },
  ],

  tags: ['tourist', 'corporate', 'long-term', 'airport', 'follow-up'],
  // A rental desk peaks late morning and again as flights land in the evening.
  peakHours: [8, 22],
  // Weekends are the busiest: short leisure hires and airport pickups.
  volume: { weekday: [16, 30], weekend: [24, 40] },
  callerNames: { first: FIT_FIRST, last: FIT_LAST },
};

/**
 * Packs by key.
 *
 * Keyed loosely rather than by `Industry` because the two are not the same
 * question: a car rental desk and a grocery are both RETAIL-ish to the database
 * and share none of their questions. `demo-data.ts` defaults to the org's
 * industry and takes `--pack` to override, so a vertical can hold more than one
 * story without either of them having to be the "generic" one.
 */
export const DEMO_PACKS: Record<string, DemoPack> = {
  RETAIL: TAMIL_MART_PACK,
  EDUCATION: FIT_PACK,
  CAR_RENTAL: LEGEND_RENTAL_PACK,
};

