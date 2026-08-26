import type { EscalationRules } from './dto';
import type { Industry, Skill } from './enums';

/**
 * Provisioning templates, one per vertical.
 *
 * A contact centre is a contact centre: calls arrive, an AI answers what it can,
 * a human takes the rest. What changes between a clinic and a restaurant is the
 * vocabulary, the queues and what the AI is briefed to say — so that is exactly
 * what a template carries, and nothing else. There are no per-industry code
 * paths anywhere in the API.
 *
 * The Industry enum and the category labels live in enums.ts, since dto.ts needs
 * them and this file needs dto.ts.
 */

export interface IndustryTemplate {
  /** Shown on the onboarding form so the operator knows what they are creating. */
  summary: string;
  queues: { name: string; requiredSkill: Skill; slaSeconds: number }[];
  aiAgent: {
    name: string;
    greeting: string;
    /** `{{ORG}}` is replaced with the centre's name at provisioning time. */
    systemPrompt: string;
    escalationRules: EscalationRules;
    defaultQueueSkill: Skill;
  };
  /** Placeholders, explicitly marked as such — a client replaces them. */
  knowledge: { title: string; category: Skill; content: string }[];
  numberLabel: string;
}

/** Escalation defaults every vertical starts from. Tuned per template below. */
const BASE_ESCALATION: EscalationRules = {
  handoffKeywords: [
    'human',
    'agent',
    'person',
    'representative',
    'speak to someone',
    'real person',
    'manager',
  ],
  confidenceFloor: 0.35,
  maxTurns: 6,
  sentimentFloor: -0.5,
  humanOnlyIntents: [],
};

export const INDUSTRY_TEMPLATES: Record<Industry, IndustryTemplate> = {
  EDUCATION: {
    summary: 'Admissions, fees and course enquiries, with a corporate-training queue.',
    queues: [
      { name: 'Admissions', requiredSkill: 'EDUCATION', slaSeconds: 20 },
      { name: 'Fees & payments', requiredSkill: 'FINANCE', slaSeconds: 30 },
      { name: 'General', requiredSkill: 'GENERAL', slaSeconds: 30 },
    ],
    aiAgent: {
      name: 'Admissions assistant',
      greeting: 'Thank you for calling {{ORG}}. How can I help you today?',
      systemPrompt:
        'You are the admissions assistant for {{ORG}}. Answer questions about courses, ' +
        'schedules, fees and enrolment using only the knowledge base. Never invent a price, ' +
        'a start date or an accreditation. Hand off to a human for anything requiring a ' +
        'decision, a discount, or a complaint.',
      escalationRules: { ...BASE_ESCALATION, humanOnlyIntents: ['refund', 'complaint'] },
      defaultQueueSkill: 'EDUCATION',
    },
    knowledge: [
      {
        title: 'Opening hours and location (placeholder)',
        category: 'GENERAL',
        content:
          'PLACEHOLDER — replace with your real details.\n\n' +
          'We are open Sunday to Thursday, 9am to 6pm, and closed on Friday and Saturday. ' +
          'Our campus address and directions go here. Callers often ask about parking and ' +
          'the nearest metro station, so answer both.',
      },
      {
        title: 'Enrolment process (placeholder)',
        category: 'EDUCATION',
        content:
          'PLACEHOLDER — replace with your real process.\n\n' +
          'Enrolment takes three steps: choose a course, submit documents, pay the deposit. ' +
          'List the documents you require and how long approval takes.',
      },
    ],
    numberLabel: 'Main line',
  },

  CLINIC: {
    summary: 'Appointment booking, billing and insurance, with clinical calls sent to staff.',
    queues: [
      { name: 'Appointments', requiredSkill: 'EDUCATION', slaSeconds: 20 },
      { name: 'Billing & insurance', requiredSkill: 'FINANCE', slaSeconds: 30 },
      { name: 'Reception', requiredSkill: 'GENERAL', slaSeconds: 25 },
    ],
    aiAgent: {
      name: 'Clinic receptionist',
      greeting: 'Thank you for calling {{ORG}}. Are you calling to book an appointment?',
      systemPrompt:
        'You are the receptionist for {{ORG}}, a healthcare clinic. You may help with ' +
        'opening hours, locations, what to bring, insurance accepted, and booking or ' +
        'rescheduling an appointment. You must NEVER give medical advice, interpret ' +
        'symptoms, comment on medication, or suggest whether something is urgent — ' +
        'transfer to a member of staff instead. If a caller describes an emergency, tell ' +
        'them to hang up and call emergency services immediately.',
      // Lower tolerance than the other verticals: a wrong answer here has
      // consequences a wrong course fee does not.
      escalationRules: {
        ...BASE_ESCALATION,
        confidenceFloor: 0.5,
        maxTurns: 5,
        humanOnlyIntents: ['symptom', 'medication', 'test result', 'emergency', 'complaint'],
      },
      defaultQueueSkill: 'EDUCATION',
    },
    knowledge: [
      {
        title: 'Clinic hours and location (placeholder)',
        category: 'GENERAL',
        content:
          'PLACEHOLDER — replace with your real details.\n\n' +
          'Consultation hours are Monday to Saturday, 9am to 8pm. Sunday is closed. ' +
          'Include your address, parking, and which entrance to use after 6pm.',
      },
      {
        title: 'Booking and cancelling an appointment (placeholder)',
        category: 'EDUCATION',
        content:
          'PLACEHOLDER — replace with your real policy.\n\n' +
          'Appointments can be booked by phone or online. Please arrive ten minutes early ' +
          'and bring photo ID and your insurance card. Cancellations need 24 hours notice.',
      },
      {
        title: 'Insurance and payment (placeholder)',
        category: 'FINANCE',
        content:
          'PLACEHOLDER — replace with your accepted insurers.\n' +
          'List the insurers you accept, whether you bill directly, what a self-pay ' +
          'consultation costs, and which payment methods reception takes.',
      },
    ],
    numberLabel: 'Reception line',
  },

  RESTAURANT: {
    summary: 'Reservations, takeaway and events, with complaints going straight to a manager.',
    queues: [
      { name: 'Reservations', requiredSkill: 'EDUCATION', slaSeconds: 15 },
      { name: 'Events & catering', requiredSkill: 'MANAGEMENT', slaSeconds: 30 },
      { name: 'Front of house', requiredSkill: 'GENERAL', slaSeconds: 20 },
    ],
    aiAgent: {
      name: 'Reservations assistant',
      greeting: 'Thanks for calling {{ORG}}! Would you like to make a reservation?',
      systemPrompt:
        'You are the reservations assistant for {{ORG}}, a restaurant. Help with opening ' +
        'hours, location, the menu, dietary options, table availability and group bookings. ' +
        'Never promise a specific table, a discount, or a time you have not confirmed. ' +
        'Pass complaints, large events and anything about an allergy to a human immediately.',
      escalationRules: {
        ...BASE_ESCALATION,
        maxTurns: 5,
        humanOnlyIntents: ['allergy', 'complaint', 'large group', 'private hire'],
      },
      defaultQueueSkill: 'EDUCATION',
    },
    knowledge: [
      {
        title: 'Opening hours and location (placeholder)',
        category: 'GENERAL',
        content:
          'PLACEHOLDER — replace with your real details.\n\n' +
          'Lunch is served 12pm to 3pm and dinner 6pm to 11pm, seven days a week. ' +
          'Include the address, nearest landmark and whether you have parking or valet.',
      },
      {
        title: 'Reservations policy (placeholder)',
        category: 'EDUCATION',
        content:
          'PLACEHOLDER — replace with your real policy.\n\n' +
          'Tables are held for fifteen minutes. Groups of eight or more need a deposit. ' +
          'State how far ahead you take bookings and your cancellation window.',
      },
      {
        title: 'Menu and dietary options (placeholder)',
        category: 'GENERAL',
        content:
          'PLACEHOLDER — replace with your real menu.\n' +
          'Summarise your cuisine, price range, and which vegetarian, vegan, halal and ' +
          'gluten-free options exist. Allergy questions must go to a human.',
      },
    ],
    numberLabel: 'Bookings line',
  },

  RETAIL: {
    summary: 'Order tracking, returns and refunds, with a wholesale queue.',
    queues: [
      { name: 'Orders & tracking', requiredSkill: 'EDUCATION', slaSeconds: 20 },
      { name: 'Refunds & payments', requiredSkill: 'FINANCE', slaSeconds: 30 },
      { name: 'Customer service', requiredSkill: 'GENERAL', slaSeconds: 25 },
    ],
    aiAgent: {
      name: 'Customer service assistant',
      greeting: 'Thanks for calling {{ORG}}. Are you calling about an order?',
      systemPrompt:
        'You are the customer service assistant for {{ORG}}, a retailer. Help with ' +
        'delivery times, store hours, stock questions, returns and the refund policy. ' +
        'Never confirm a refund amount or promise a delivery date you cannot see. Hand ' +
        'off anything about a damaged item, a chargeback or a complaint.',
      escalationRules: {
        ...BASE_ESCALATION,
        humanOnlyIntents: ['damaged', 'chargeback', 'complaint', 'wholesale'],
      },
      defaultQueueSkill: 'EDUCATION',
    },
    knowledge: [
      {
        title: 'Store hours and delivery (placeholder)',
        category: 'GENERAL',
        content:
          'PLACEHOLDER — replace with your real details.\n\n' +
          'Stores open 10am to 10pm daily. Standard delivery takes two to four working ' +
          'days; next-day cut-off is 4pm. Include your delivery charges.',
      },
      {
        title: 'Returns and refunds (placeholder)',
        category: 'FINANCE',
        content:
          'PLACEHOLDER — replace with your real policy.\n\n' +
          'Unworn items can be returned within fourteen days with a receipt. Refunds go ' +
          'back to the original payment method within five working days.',
      },
    ],
    numberLabel: 'Customer service line',
  },

  FITNESS: {
    summary: 'Memberships, class bookings and billing, with PT enquiries queued separately.',
    queues: [
      { name: 'Memberships & classes', requiredSkill: 'EDUCATION', slaSeconds: 20 },
      { name: 'Billing', requiredSkill: 'FINANCE', slaSeconds: 30 },
      { name: 'Front desk', requiredSkill: 'GENERAL', slaSeconds: 25 },
    ],
    aiAgent: {
      name: 'Membership assistant',
      greeting: 'Thanks for calling {{ORG}}. Are you interested in joining or booking a class?',
      systemPrompt:
        'You are the membership assistant for {{ORG}}, a gym. Help with opening hours, ' +
        'class timetables, membership tiers, joining fees and facilities. Never give ' +
        'training, injury or nutrition advice, and never quote a discount. Pass ' +
        'cancellations, freezes and injury questions to a human.',
      escalationRules: {
        ...BASE_ESCALATION,
        humanOnlyIntents: ['injury', 'cancel membership', 'freeze', 'complaint'],
      },
      defaultQueueSkill: 'EDUCATION',
    },
    knowledge: [
      {
        title: 'Opening hours and facilities (placeholder)',
        category: 'GENERAL',
        content:
          'PLACEHOLDER — replace with your real details.\n\n' +
          'Open 6am to 11pm on weekdays and 8am to 8pm at weekends. List your facilities: ' +
          'weights floor, studios, pool, sauna, parking.',
      },
      {
        title: 'Membership tiers (placeholder)',
        category: 'EDUCATION',
        content:
          'PLACEHOLDER — replace with your real pricing.\n\n' +
          'Describe each tier, what it includes, the joining fee and the minimum term.',
      },
    ],
    numberLabel: 'Main line',
  },

  PROFESSIONAL: {
    summary: 'New enquiries and invoices, with existing matters routed to their owner.',
    queues: [
      { name: 'New enquiries', requiredSkill: 'EDUCATION', slaSeconds: 25 },
      { name: 'Accounts', requiredSkill: 'FINANCE', slaSeconds: 30 },
      { name: 'Reception', requiredSkill: 'GENERAL', slaSeconds: 25 },
    ],
    aiAgent: {
      name: 'Reception assistant',
      greeting: 'Good day, {{ORG}}. How may I direct your call?',
      systemPrompt:
        'You are the reception assistant for {{ORG}}, a professional services firm. You ' +
        'may give opening hours, the office address, the services offered and how to book ' +
        'a consultation. You must NEVER give legal, financial or tax advice, discuss an ' +
        'existing matter, or confirm whether someone is a client. Transfer those.',
      escalationRules: {
        ...BASE_ESCALATION,
        confidenceFloor: 0.45,
        humanOnlyIntents: ['advice', 'existing matter', 'confidential', 'complaint'],
      },
      defaultQueueSkill: 'EDUCATION',
    },
    knowledge: [
      {
        title: 'Office hours and location (placeholder)',
        category: 'GENERAL',
        content:
          'PLACEHOLDER — replace with your real details.\n\n' +
          'The office is open Monday to Friday, 9am to 6pm. Consultations are by ' +
          'appointment. Include the address, floor and visitor access.',
      },
      {
        title: 'Services and consultations (placeholder)',
        category: 'EDUCATION',
        content:
          'PLACEHOLDER — replace with your real services.\n\n' +
          'List your practice areas, whether the first consultation is chargeable, and ' +
          'what a caller should prepare.',
      },
    ],
    numberLabel: 'Main line',
  },

  GENERIC: {
    summary: 'A neutral sales, billing and support setup to shape later.',
    queues: [
      { name: 'Sales & enquiries', requiredSkill: 'EDUCATION', slaSeconds: 20 },
      { name: 'Billing', requiredSkill: 'FINANCE', slaSeconds: 30 },
      { name: 'Support', requiredSkill: 'GENERAL', slaSeconds: 25 },
    ],
    aiAgent: {
      name: 'Virtual receptionist',
      greeting: 'Thank you for calling {{ORG}}. How can I help?',
      systemPrompt:
        'You are the virtual receptionist for {{ORG}}. Answer only from the knowledge ' +
        'base — opening hours, location, services and prices that are written down. Never ' +
        'invent a detail. Hand off to a human whenever you are unsure or the caller asks.',
      escalationRules: BASE_ESCALATION,
      defaultQueueSkill: 'EDUCATION',
    },
    knowledge: [
      {
        title: 'Opening hours and location (placeholder)',
        category: 'GENERAL',
        content:
          'PLACEHOLDER — replace this with your real details before taking calls.\n\n' +
          'State your opening hours, address and how to reach you.',
      },
    ],
    numberLabel: 'Main line',
  },
};
