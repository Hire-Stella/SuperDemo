/**
 * Scripted call scenarios for the `simulated` telephony driver.
 *
 * Each scenario is a caller-side script. The simulator feeds the utterances to
 * the real AI orchestrator on a realistic timeline — the AI's replies are NOT
 * scripted, they come from the actual scripted-brain retrieval over the FIT
 * knowledge base. That means a broken KB or a broken escalation rule shows up
 * in the demo, which is the point.
 *
 * `escalates` records the *expected* outcome so tests can assert on it, but the
 * orchestrator decides for real at runtime.
 */

import type { EscalationReason, Skill } from '@superdemo/contracts';

export interface ScenarioTurn {
  /** What the caller says. */
  text: string;
  /** Delay before this utterance, ms (scaled by the simulator's speed factor). */
  delayMs: number;
}

export interface CallScenario {
  id: string;
  title: string;
  description: string;
  skill: Skill;
  /** Expected: does this end with a human? */
  escalates: boolean;
  expectedReason: EscalationReason | null;
  callerName: string;
  /** Country code prefix used when generating the caller's number. */
  callerCountry: string;
  turns: ScenarioTurn[];
  /** Caller hangs up rather than waiting, when queued. Tests abandonment. */
  abandonsInQueueAfterMs?: number;
}

export const SCENARIOS: CallScenario[] = [
  {
    id: 'aba-fees',
    title: 'ABA certification — fees then handoff',
    description:
      'Parent asks about the ABA course, gets details from the KB, then asks for a human to discuss payment plans. The canonical demo call.',
    skill: 'EDUCATION',
    escalates: true,
    expectedReason: 'CALLER_REQUESTED',
    callerName: 'Fatima Al Mansouri',
    callerCountry: '+971',
    turns: [
      { text: 'Hi, I want to ask about the ABA certification course', delayMs: 2600 },
      { text: 'How long is the course and when does it start?', delayMs: 5200 },
      { text: 'And how much does it cost?', delayMs: 4800 },
      {
        text: 'Okay, can I speak to someone about the payment plan please?',
        delayMs: 5000,
      },
    ],
  },
  {
    id: 'montessori-schedule',
    title: 'Montessori diploma — schedule, AI contained',
    description:
      'Working teacher asks about Montessori timings and format. Fully answered by the AI, no human needed. Demonstrates containment.',
    skill: 'EDUCATION',
    escalates: false,
    expectedReason: null,
    callerName: 'Priya Nair',
    callerCountry: '+971',
    turns: [
      { text: 'Hello, I am asking about the Montessori diploma', delayMs: 2400 },
      { text: 'I work full time, are there weekend classes?', delayMs: 5400 },
      { text: 'Is it online or do I have to come to the centre?', delayMs: 5000 },
      { text: 'Where exactly are you located?', delayMs: 4600 },
      { text: 'Perfect, that is all I needed. Thank you very much', delayMs: 4200 },
    ],
  },
  {
    id: 'cma-enrolment',
    title: 'CMA preparation — enrolment steps, AI contained',
    description: 'Finance professional asks what documents are needed to enrol. AI handles it.',
    skill: 'FINANCE',
    escalates: false,
    expectedReason: null,
    callerName: 'Ahmed Hassan',
    callerCountry: '+971',
    turns: [
      { text: 'Good morning, I want to enrol for the CMA course', delayMs: 2500 },
      { text: 'What documents do I need to bring?', delayMs: 5000 },
      { text: 'How long does the whole programme take?', delayMs: 4800 },
      { text: 'Great, I will come to the office this week. Thanks', delayMs: 4400 },
    ],
  },
  {
    id: 'corporate-tax-group',
    title: 'Corporate Tax — corporate group booking, escalates',
    description:
      'Finance manager wants to book eight staff onto Corporate Tax training. Group pricing needs a human. Shows HUMAN_ONLY_INTENT-style routing to Finance queue.',
    skill: 'FINANCE',
    escalates: true,
    expectedReason: 'CALLER_REQUESTED',
    callerName: 'Rajesh Kumar',
    callerCountry: '+971',
    turns: [
      { text: 'Hi, I am calling from a company in Business Bay', delayMs: 2600 },
      {
        text: 'We need corporate tax training for our finance team, about eight people',
        delayMs: 5600,
      },
      { text: 'Can you do it at our office?', delayMs: 4800 },
      { text: 'I need to discuss pricing, can you put me through to someone', delayMs: 5200 },
    ],
  },
  {
    id: 'refund-complaint',
    title: 'Refund request — immediate escalation',
    description:
      'Existing student wants a refund. The AI is configured never to handle refunds alone — escalates on HUMAN_ONLY_INTENT at the first turn.',
    skill: 'GENERAL',
    escalates: true,
    expectedReason: 'HUMAN_ONLY_INTENT',
    callerName: 'Mohammed Siddiqui',
    callerCountry: '+971',
    turns: [
      { text: 'I need a refund for my course, I cannot continue', delayMs: 2400 },
    ],
  },
  {
    id: 'frustrated-caller',
    title: 'Frustrated caller — sentiment escalation',
    description:
      'Caller has already phoned twice. Negative sentiment triggers escalation before the AI wastes more of their time.',
    skill: 'GENERAL',
    escalates: true,
    expectedReason: 'NEGATIVE_SENTIMENT',
    callerName: 'Sara Ibrahim',
    callerCountry: '+971',
    turns: [
      { text: 'I have called three times already and nobody has helped me', delayMs: 2300 },
      { text: 'This is really frustrating, I am very annoyed', delayMs: 4600 },
    ],
  },
  {
    id: 'arabic-placement',
    title: 'Arabic course — placement test question, AI contained',
    description: 'Caller asks about Arabic levels and the placement test. Answered from the KB.',
    skill: 'LANGUAGE',
    escalates: false,
    expectedReason: null,
    callerName: 'James Whitfield',
    callerCountry: '+44',
    turns: [
      { text: 'Hi there, I want to learn Arabic. I am a complete beginner', delayMs: 2700 },
      { text: 'Do I need to take a test first?', delayMs: 5000 },
      { text: 'And what are the class timings?', delayMs: 4600 },
      { text: 'Lovely, thanks for your help', delayMs: 4200 },
    ],
  },
  {
    id: 'hr-diploma-evening',
    title: 'HR diploma — evening classes, AI contained',
    description: 'Caller checks whether HR diploma fits around a full-time job.',
    skill: 'MANAGEMENT',
    escalates: false,
    expectedReason: null,
    callerName: 'Nadia Farouk',
    callerCountry: '+20',
    turns: [
      { text: 'Hello, I am interested in the HR management diploma', delayMs: 2500 },
      { text: 'I work nine to six, can I do evening classes?', delayMs: 5200 },
      { text: 'How many evenings per week?', delayMs: 4400 },
      { text: 'That works for me, thank you', delayMs: 4000 },
    ],
  },
  {
    id: 'visa-question',
    title: 'Visa question — escalates, out of AI scope',
    description:
      'Caller asks whether the course gets them a visa. Configured as a human-only intent — the AI must not guess at immigration matters.',
    skill: 'GENERAL',
    escalates: true,
    expectedReason: 'HUMAN_ONLY_INTENT',
    callerName: 'Ivan Petrov',
    callerCountry: '+971',
    turns: [
      { text: 'If I join a diploma will you sponsor my residence visa?', delayMs: 2600 },
    ],
  },
  {
    id: 'unknown-course',
    title: 'Course we do not offer — low confidence escalation',
    description:
      'Caller asks about a programme FIT does not run. The KB returns nothing relevant, confidence falls below the floor, and the AI hands off rather than inventing an answer. Important to demo: it shows the AI knows what it does not know.',
    skill: 'GENERAL',
    escalates: true,
    expectedReason: 'LOW_CONFIDENCE',
    callerName: 'Chen Wei',
    callerCountry: '+971',
    turns: [
      { text: 'Do you offer a commercial pilot licence training programme?', delayMs: 2500 },
      { text: 'What about aircraft maintenance engineering?', delayMs: 4800 },
    ],
  },
  {
    id: 'abandoned-in-queue',
    title: 'Caller abandons in queue',
    description:
      'Escalates but hangs up before an agent answers. Produces an abandonment data point so the SLA dashboard is not artificially perfect.',
    skill: 'FINANCE',
    escalates: true,
    expectedReason: 'CALLER_REQUESTED',
    callerName: 'Unknown caller',
    callerCountry: '+92',
    turns: [
      { text: 'I want to speak to a person about the CPA course fees', delayMs: 2400 },
    ],
    abandonsInQueueAfterMs: 22_000,
  },
  {
    id: 'aml-banking',
    title: 'AML certification — banking compliance officer, AI contained',
    description: 'Compliance officer asks about the AML course content and duration.',
    skill: 'FINANCE',
    escalates: false,
    expectedReason: null,
    callerName: 'Layla Ahmadi',
    callerCountry: '+971',
    turns: [
      { text: 'I am a compliance officer at an exchange house', delayMs: 2600 },
      { text: 'Tell me about your anti money laundering certification', delayMs: 5000 },
      { text: 'Is there an intensive option? I need it quickly', delayMs: 4800 },
      { text: 'Excellent. I will email admissions. Thank you', delayMs: 4200 },
    ],
  },
];

/** WhatsApp scenarios for the mock messaging driver. */
export interface WhatsAppScenario {
  id: string;
  title: string;
  callerName: string;
  callerCountry: string;
  skill: Skill;
  escalates: boolean;
  messages: { text: string; delayMs: number }[];
}

export const WHATSAPP_SCENARIOS: WhatsAppScenario[] = [
  {
    id: 'wa-sen-diploma',
    title: 'SEN diploma enquiry',
    callerName: 'Aisha Rahman',
    callerCountry: '+971',
    skill: 'EDUCATION',
    escalates: false,
    messages: [
      { text: 'Hi, is the SEN diploma still open for registration?', delayMs: 1500 },
      { text: 'What are the timings?', delayMs: 6000 },
      { text: 'Thanks!', delayMs: 5000 },
    ],
  },
  {
    id: 'wa-vat-fee',
    title: 'VAT course fee, wants a human',
    callerName: 'Karan Mehta',
    callerCountry: '+971',
    skill: 'FINANCE',
    escalates: true,
    messages: [
      { text: 'how much is the VAT course', delayMs: 1400 },
      { text: 'can someone call me please, I want to register today', delayMs: 5500 },
    ],
  },
  {
    id: 'wa-english-levels',
    title: 'English course levels',
    callerName: 'Marie Dubois',
    callerCountry: '+971',
    skill: 'LANGUAGE',
    escalates: false,
    messages: [
      { text: 'Good afternoon, do you have English classes for intermediate level?', delayMs: 1600 },
      { text: 'And is there a placement test?', delayMs: 6200 },
      { text: 'Perfect thank you', delayMs: 4800 },
    ],
  },
  {
    id: 'wa-certificate-attestation',
    title: 'Certificate attestation — escalates',
    callerName: 'Omar Khalil',
    callerCountry: '+971',
    skill: 'GENERAL',
    escalates: true,
    messages: [
      {
        text: 'I finished the hospital management diploma last year. I need the certificate attested for MOH. Who can help?',
        delayMs: 1500,
      },
    ],
  },
];
