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
  disposition:
    | 'ENROLMENT_INTEREST'
    | 'INFO_PROVIDED'
    | 'CALLBACK_REQUESTED'
    | 'FEE_ENQUIRY'
    | 'EXISTING_STUDENT_SUPPORT'
    | 'NOT_INTERESTED';
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
};

export const DEMO_PACKS: Record<string, DemoPack> = {
  RETAIL: TAMIL_MART_PACK,
};

/** Tamil first/last names, so the seeded callers match the customer base. */
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
