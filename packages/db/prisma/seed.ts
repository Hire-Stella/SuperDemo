/**
 * Seed SuperDemo with a realistic starting state:
 *   · 12 agents matching the client's actual team (Dubai 8, India 2, Egypt 2)
 *   · 4 queues mapped to FIT's published course categories
 *   · the FIT knowledge base (real course names, placeholder fees)
 *   · their two published phone numbers plus mock DID inventory
 *   · ~45 days of historical calls so the analytics pages have real shape
 *
 * Deterministic: a fixed PRNG seed means the demo numbers are the same every
 * time the database is rebuilt. Nobody wants the containment rate to move
 * between the rehearsal and the call.
 */
import { PrismaClient, type Prisma } from '@prisma/client';
import argon2 from 'argon2';
import {
  COURSES,
  FAQS,
  INSTITUTE,
  PRICING_NOTE,
  AE_NUMBER_STOCK,
  FIT_OWNED_NUMBERS,
  SCENARIOS,
} from '../src/data/index';
import { chunk, embed, keywordsOf } from '../src/embedding';
import { withOrg } from '../src/tenant';

/** Unscoped: resets, the Organization row itself, and the superadmin. */
const rawPrisma = new PrismaClient();

/**
 * Rebound to an org-pinned client as soon as the tenant exists, so the ~40
 * creates below stay exactly as they were written — the extension supplies
 * every orgId. Reassignment rather than a second name: this is what keeps the
 * seed readable as a description of one contact centre.
 */
let prisma = rawPrisma;

/* ----------------------------- deterministic RNG -------------------------- */

let seedState = 0x2f6e2b1;
function rnd(): number {
  // mulberry32
  seedState = (seedState + 0x6d2b79f5) | 0;
  let t = seedState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]!;
const int = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const chance = (p: number) => rnd() < p;

/*
 * The junk a real phone line gets: a wrong number, or a recorded sales call the
 * assistant closes out. Two lines each, and deliberately not in SCENARIOS — the
 * simulator's scenario list should stay a list of calls worth demoing.
 *
 * Rare in the mix, but present: the inbox's outcome filter offers "Wrong number"
 * and "Spam", and a filter option that never matches a row reads as a broken
 * screen rather than a clean quarter.
 */
const JUNK_CALLS = [
  {
    disposition: 'WRONG_NUMBER',
    intent: 'wrong_number',
    caller: 'Is this the dental clinic on the ground floor?',
    reply: `No, this is ${INSTITUTE.name} — I think you want the clinic's own line. Sorry about that.`,
    summary: 'Wrong number. Caller was looking for a different business; no action needed.',
  },
  {
    disposition: 'WRONG_NUMBER',
    intent: 'wrong_number',
    caller: 'I am calling about a parcel delivery for flat 402.',
    reply: `This is ${INSTITUTE.name}, a training institute — nothing to do with deliveries, I am afraid.`,
    summary: 'Wrong number. Caller wanted a courier; ended politely.',
  },
  {
    disposition: 'SPAM',
    intent: 'spam',
    caller: 'Congratulations, your business has been selected for a free marketing audit —',
    reply: 'Thank you, but we are not interested in cold sales calls. Ending the call now.',
    summary: 'Unsolicited sales call. Closed out by the assistant; no follow-up.',
  },
  {
    disposition: 'SPAM',
    intent: 'spam',
    caller: 'This is a final notice regarding your vehicle insurance policy.',
    reply: 'This is a training institute and we have no vehicle policy with you. Ending the call.',
    summary: 'Recorded sales call. Closed out by the assistant; no follow-up.',
  },
] as const;

/* --------------------------------- agents -------------------------------- */

const AGENTS = [
  // Dubai — 8 agents
  { name: 'Layla Haddad',     email: 'layla@fitiedu.com',    location: 'DUBAI', role: 'ADMIN',      skills: ['EDUCATION', 'GENERAL', 'MANAGEMENT'], ext: '101', colour: '#2563eb' },
  { name: 'Omar Sheikh',      email: 'omar@fitiedu.com',     location: 'DUBAI', role: 'SUPERVISOR', skills: ['FINANCE', 'MANAGEMENT', 'GENERAL'],   ext: '102', colour: '#7c3aed' },
  { name: 'Mariam Youssef',   email: 'mariam@fitiedu.com',   location: 'DUBAI', role: 'AGENT',      skills: ['EDUCATION', 'GENERAL'],               ext: '103', colour: '#db2777' },
  { name: 'Hassan Al Balushi',email: 'hassan@fitiedu.com',   location: 'DUBAI', role: 'AGENT',      skills: ['FINANCE', 'GENERAL'],                 ext: '104', colour: '#0891b2' },
  { name: 'Reem Abdullah',    email: 'reem@fitiedu.com',     location: 'DUBAI', role: 'AGENT',      skills: ['LANGUAGE', 'GENERAL'],                ext: '105', colour: '#ea580c' },
  { name: 'Zainab Qureshi',   email: 'zainab@fitiedu.com',   location: 'DUBAI', role: 'AGENT',      skills: ['EDUCATION', 'LANGUAGE'],              ext: '106', colour: '#16a34a' },
  { name: 'Yousef Kamal',     email: 'yousef@fitiedu.com',   location: 'DUBAI', role: 'AGENT',      skills: ['MANAGEMENT', 'GENERAL'],              ext: '107', colour: '#ca8a04' },
  { name: 'Noura Al Fahim',   email: 'noura@fitiedu.com',    location: 'DUBAI', role: 'AGENT',      skills: ['FINANCE', 'MANAGEMENT'],              ext: '108', colour: '#4f46e5' },
  // India — 2 agents (remote; currently paying roaming on physical SIMs)
  { name: 'Anjali Verma',     email: 'anjali@fitiedu.com',   location: 'INDIA', role: 'AGENT',      skills: ['FINANCE', 'GENERAL'],                 ext: '201', colour: '#0d9488' },
  { name: 'Rohit Deshpande',  email: 'rohit@fitiedu.com',    location: 'INDIA', role: 'AGENT',      skills: ['MANAGEMENT', 'EDUCATION'],            ext: '202', colour: '#be123c' },
  // Egypt — 2 agents (remote)
  { name: 'Yasmin El Sayed',  email: 'yasmin@fitiedu.com',   location: 'EGYPT', role: 'AGENT',      skills: ['LANGUAGE', 'EDUCATION'],              ext: '301', colour: '#9333ea' },
  { name: 'Karim Mostafa',    email: 'karim@fitiedu.com',    location: 'EGYPT', role: 'AGENT',      skills: ['GENERAL', 'MANAGEMENT'],              ext: '302', colour: '#059669' },
] as const;

const TIMEZONES: Record<string, string> = {
  DUBAI: 'Asia/Dubai',
  INDIA: 'Asia/Kolkata',
  EGYPT: 'Africa/Cairo',
};

const QUEUES = [
  { name: 'Education Enquiries',  requiredSkill: 'EDUCATION',  slaSeconds: 20 },
  { name: 'Finance & Tax',        requiredSkill: 'FINANCE',    slaSeconds: 20 },
  { name: 'Management Courses',   requiredSkill: 'MANAGEMENT', slaSeconds: 25 },
  { name: 'Language Courses',     requiredSkill: 'LANGUAGE',   slaSeconds: 25 },
  { name: 'General & Admissions', requiredSkill: 'GENERAL',    slaSeconds: 15 },
] as const;

/* ------------------------------- caller pool ------------------------------ */

/* --------------------------- outbound AI campaigns ------------------------ */
/**
 * The outbound work an institute actually has, and none of it cold-calling:
 * every one of these is a follow-up to someone who already made contact, which
 * is also what keeps it defensible under UAE marketing-consent rules.
 */
const OUTBOUND_CAMPAIGNS = [
  {
    name: 'Enquiry follow-up',
    opener:
      'Hello, this is the FIT Institute assistant calling about the course enquiry you made with us. Is now a good time?',
    replies: ['Yes, go ahead.', 'Sure, briefly.', 'I was still deciding, actually.'],
    followUp:
      'The next intake still has seats. Would you like me to talk you through the schedule and what you need to enrol?',
  },
  {
    name: 'Intake reminder',
    opener:
      'Hello, the FIT Institute assistant here — your course starts next week and I wanted to confirm you are still joining.',
    replies: ['Yes, I will be there.', 'What time does it start?', 'I might need to defer.'],
    followUp:
      'Noted. Classes run at our JLT centre — shall I send the joining details on WhatsApp as well?',
  },
  {
    name: 'Incomplete enrolment',
    opener:
      'Hello, this is the FIT Institute assistant. Your enrolment is nearly complete — a couple of documents are still outstanding.',
    replies: ['Which ones?', 'I thought I sent everything.', 'Can I bring them in person?'],
    followUp:
      'I can list exactly what is missing and how to send it. Would that help?',
  },
  {
    name: 'Certificate ready',
    opener:
      'Hello, the FIT Institute assistant calling — your certificate is ready for collection at our JLT centre.',
    replies: ['That is good news.', 'Can it be couriered?', 'What are the opening hours?'],
    followUp:
      'Reception is open Sunday to Thursday. Would you like me to check the courier option for you?',
  },
] as const;

const FIRST = ['Ahmed','Fatima','Priya','Rajesh','Sara','Mohammed','Aisha','Karan','Layla','Omar','Nadia','James','Chen','Ivan','Marie','Yusuf','Zahra','Deepak','Hana','Tariq','Sofia','Bilal','Meera','Khalid'];
const LAST  = ['Al Mansouri','Nair','Kumar','Ibrahim','Siddiqui','Rahman','Mehta','Hassan','Khalil','Whitfield','Wei','Petrov','Dubois','Farouk','Sharma','Ahmadi','Bakr','Iqbal','Menon','Haddad','Saleh','Roy','Aziz','Fernandes'];

function makeCallerNumber(): string {
  const prefixes = ['50', '52', '54', '55', '56', '58'];
  return `+971${pick(prefixes)}${int(1000000, 9999999)}`;
}

/* ---------------------------------- main --------------------------------- */

async function main() {
  console.log('▸ resetting');
  // Order matters: children before parents.
  await rawPrisma.$transaction([
    rawPrisma.transcriptSegment.deleteMany(),
    rawPrisma.recording.deleteMany(),
    rawPrisma.callParticipant.deleteMany(),
    rawPrisma.call.deleteMany(),
    rawPrisma.message.deleteMany(),
    rawPrisma.aiSession.deleteMany(),
    rawPrisma.conversation.deleteMany(),
    rawPrisma.knowledgeChunk.deleteMany(),
    rawPrisma.knowledgeDoc.deleteMany(),
    rawPrisma.phoneNumber.deleteMany(),
    rawPrisma.aiAgent.deleteMany(),
    rawPrisma.queueMembership.deleteMany(),
    rawPrisma.queue.deleteMany(),
    rawPrisma.agentStateEvent.deleteMany(),
    rawPrisma.agentState.deleteMany(),
    rawPrisma.refreshToken.deleteMany(),
    rawPrisma.auditLog.deleteMany(),
    rawPrisma.contact.deleteMany(),
    rawPrisma.user.deleteMany(),
    rawPrisma.callMetricsDaily.deleteMany(),
    rawPrisma.crmSyncLog.deleteMany(),
    rawPrisma.outboxEvent.deleteMany(),
    rawPrisma.processedWebhook.deleteMany(),
    rawPrisma.setting.deleteMany(),
    // After users: User.orgId references Organization without a cascade.
    rawPrisma.organization.deleteMany(),
  ]);

  /* ------------------------------ the platform ---------------------------- */
  // One superadmin, belonging to no centre. This is the account that creates
  // the others, so it has to exist before any tenant does.
  console.log('▸ platform operator');
  const platformPasswordHash = await argon2.hash('Password123!', { type: argon2.argon2id });
  await rawPrisma.user.create({
    data: {
      orgId: null,
      email: 'super@hirestella.com',
      name: 'HireStella Operator',
      passwordHash: platformPasswordHash,
      role: 'SUPERADMIN',
      location: 'DUBAI',
      timezone: 'Asia/Dubai',
      skills: ['GENERAL'],
      avatarColor: '#0f172a',
    },
  });

  /* ------------------------------ tenant #1 ------------------------------- */
  console.log(`▸ organisation: ${INSTITUTE.name}`);
  const org = await rawPrisma.organization.create({
    data: {
      name: INSTITUTE.name,
      slug: 'fit-ai',
      industry: 'EDUCATION',
      timezone: INSTITUTE.timezone,
    },
  });

  // Everything from here on belongs to that org, without saying so 40 times.
  prisma = withOrg(rawPrisma, org.id);

  /* -------------------------------- settings ------------------------------ */
  await prisma.setting.create({
    data: {
      // Named explicitly: Setting.orgId is a real foreign key rather than a
      // defaulted column, so Prisma requires it at the type level.
      orgId: org.id,
      instituteName: INSTITUTE.name,
      instituteTimezone: INSTITUTE.timezone,
      agentHourlyCostUsd: '12.00',
    },
  });

  /* --------------------------------- users -------------------------------- */
  console.log('▸ users (12 agents: Dubai 8, India 2, Egypt 2)');
  // One shared dev password. Documented in README; never ships to production.
  const passwordHash = await argon2.hash('Password123!', { type: argon2.argon2id });

  const users = [];
  for (const a of AGENTS) {
    users.push(
      await prisma.user.create({
        data: {
          email: a.email,
          name: a.name,
          passwordHash,
          role: a.role as Prisma.UserCreateInput['role'],
          location: a.location as Prisma.UserCreateInput['location'],
          timezone: TIMEZONES[a.location]!,
          skills: a.skills as unknown as Prisma.UserCreateInput['skills'],
          extension: a.ext,
          avatarColor: a.colour,
          // Nested create: the extension only sees the top-level model.
          presence: { create: { orgId: org.id, status: 'OFFLINE', since: new Date() } },
        },
      }),
    );
  }
  const byEmail = new Map(users.map((u) => [u.email, u]));

  /* -------------------------------- queues -------------------------------- */
  console.log('▸ queues mapped to FIT course categories');
  const queues = [];
  for (const q of QUEUES) {
    const created = await prisma.queue.create({
      data: {
        name: q.name,
        requiredSkill: q.requiredSkill as Prisma.QueueCreateInput['requiredSkill'],
        slaSeconds: q.slaSeconds,
        strategy: 'LONGEST_IDLE',
      },
    });
    queues.push(created);
    // Membership follows skills — an agent belongs to the queues they can serve.
    const members = users.filter((u) => (u.skills as string[]).includes(q.requiredSkill));
    for (const m of members) {
      await prisma.queueMembership.create({
        data: { queueId: created.id, userId: m.id, priority: 1 },
      });
    }
  }
  const queueBySkill = new Map(queues.map((q) => [q.requiredSkill as string, q]));
  const generalQueue = queueBySkill.get('GENERAL')!;

  /* ------------------------------- AI agent ------------------------------- */
  console.log('▸ AI voice agent');
  const systemPrompt = [
    `You are the admissions assistant for ${INSTITUTE.name}, a ${INSTITUTE.legalNote} in Dubai.`,
    '',
    'Your job is to answer prospective and current students\' questions about courses,',
    'schedules, enrolment and the institute itself, using only the knowledge provided to you.',
    '',
    'Rules:',
    '- Be warm, brief and clear. Two or three sentences is usually right for a phone call.',
    '- Never invent a fact. If the knowledge base does not cover it, say so and offer a human.',
    `- ${PRICING_NOTE}`,
    '- Hand off to a human immediately for refunds, complaints, visa or residency matters,',
    '  certificate attestation, and corporate group pricing.',
    '- If the caller asks for a person, transfer without argument.',
    `- Office hours are ${INSTITUTE.officeHours}. The institute is at ${INSTITUTE.address}.`,
  ].join('\n');

  const aiAgent = await prisma.aiAgent.create({
    data: {
      name: 'FIT Admissions Assistant',
      greeting:
        `Thank you for calling ${INSTITUTE.name}. You're speaking with our admissions assistant. ` +
        `How can I help you today?`,
      systemPrompt,
      voice: 'en-GB',
      language: 'en',
      defaultQueueId: generalQueue.id,
      escalationRules: {
        handoffKeywords: [
          'human','agent','person','representative','speak to someone','real person','manager',
          'talk to somebody','put me through','transfer me',
        ],
        confidenceFloor: 0.45,
        maxTurns: 12,
        sentimentFloor: -0.5,
        humanOnlyIntents: ['refund','complaint','visa','residency','attestation','corporate_pricing','legal'],
      } satisfies Prisma.InputJsonValue,
      isActive: true,
    },
  });

  /* ------------------------------ phone numbers --------------------------- */
  console.log('▸ phone numbers (2 published + mock DID inventory)');
  for (const n of FIT_OWNED_NUMBERS) {
    await prisma.phoneNumber.create({
      data: {
        e164: n.e164,
        label: n.label,
        region: n.region,
        provider: n.provider,
        monthlyCostUsd: String(n.monthlyCostUsd),
        status: 'ASSIGNED',
        inboundQueueId: generalQueue.id,
        aiAgentId: aiAgent.id,
        purchasedAt: new Date(Date.now() - 400 * 864e5),
      },
    });
  }
  // A couple of pre-purchased mock DIDs so the routing UI isn't empty.
  for (const [i, stock] of AE_NUMBER_STOCK.slice(0, 3).entries()) {
    const q = queues[i % queues.length]!;
    await prisma.phoneNumber.create({
      data: {
        e164: stock.e164,
        label: `${q.name} direct line`,
        region: stock.region,
        provider: 'mock',
        monthlyCostUsd: String(stock.monthlyCostUsd),
        status: 'ASSIGNED',
        inboundQueueId: q.id,
        aiAgentId: aiAgent.id,
        purchasedAt: new Date(Date.now() - int(10, 90) * 864e5),
      },
    });
  }

  /* ----------------------------- knowledge base --------------------------- */
  console.log('▸ knowledge base');
  let chunkCount = 0;

  async function addDoc(title: string, category: string, source: string, content: string) {
    const doc = await prisma.knowledgeDoc.create({
      data: {
        title,
        category: category as Prisma.KnowledgeDocCreateInput['category'],
        source,
        content,
      },
    });
    const pieces = chunk(content);
    for (const [ordinal, piece] of pieces.entries()) {
      // Prefix the title into the embedded text: a caller says "ABA course",
      // which must match the ABA document even if the body never repeats it.
      const embedText = `${title}\n${piece}`;
      await prisma.knowledgeChunk.create({
        data: {
          docId: doc.id,
          ordinal,
          content: piece,
          embedding: embed(embedText),
          keywords: keywordsOf(embedText),
        },
      });
      chunkCount++;
    }
  }

  for (const c of COURSES) {
    const body = [
      `${c.title} is offered by ${INSTITUTE.name} in the ${c.category.toLowerCase()} category.`,
      `Duration: approximately ${c.durationWeeks} weeks.`,
      `Schedule: ${c.schedule}.`,
      `Who it is for: ${c.audience}.`,
      `Indicative fee: AED ${c.feeAedFrom.toLocaleString()} to AED ${c.feeAedTo.toLocaleString()}. ` +
        `This figure is indicative only — the admissions team confirms the exact current fee, ` +
        `any promotion, and available instalment plans.`,
      '',
      `What you will be able to do:`,
      ...c.outcomes.map((o) => `- ${o}`),
    ].join('\n');
    await addDoc(c.title, c.category, 'fitiedu.com/courses', body);
  }

  for (const f of FAQS) {
    await addDoc(f.title, f.category, 'fitiedu.com', f.content);
  }
  console.log(`  ${COURSES.length} courses + ${FAQS.length} FAQs → ${chunkCount} chunks`);

  /* --------------------------- historical traffic ------------------------- */
  console.log('▸ 45 days of historical conversations');

  const agentUsers = users.filter((u) => u.role === 'AGENT' || u.role === 'SUPERVISOR');
  const dailyMetrics = new Map<string, {
    day: Date; queueId: string; agentId: string;
    calls: number; aiContained: number; escalated: number; abandoned: number;
    answeredWithinSla: number; talkMs: number; handleMs: number; queueWaitMs: number;
    wrapMs: number; answered: number;
  }>();

  function bump(day: Date, queueId: string, agentId: string, patch: Partial<{
    calls: number; aiContained: number; escalated: number; abandoned: number;
    answeredWithinSla: number; talkMs: number; handleMs: number; queueWaitMs: number;
    wrapMs: number; answered: number;
  }>) {
    const key = `${day.toISOString().slice(0, 10)}|${queueId}|${agentId}`;
    const row = dailyMetrics.get(key) ?? {
      day, queueId, agentId,
      calls: 0, aiContained: 0, escalated: 0, abandoned: 0, answeredWithinSla: 0,
      talkMs: 0, handleMs: 0, queueWaitMs: 0, wrapMs: 0, answered: 0,
    };
    // noUncheckedIndexedAccess makes the index read possibly-undefined; the keys
    // always exist on `row`, but be explicit rather than assert it away.
    const counters = row as unknown as Record<string, number>;
    for (const [k, v] of Object.entries(patch)) {
      counters[k] = (counters[k] ?? 0) + (v as number);
    }
    dailyMetrics.set(key, row);
  }

  const DAYS = 45;
  let totalCalls = 0;
  let totalWhatsApp = 0;
  let totalOutbound = 0;

  for (let d = DAYS; d >= 1; d--) {
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    dayStart.setUTCDate(dayStart.getUTCDate() - d);
    const weekday = dayStart.getUTCDay(); // 0 = Sunday

    // Friday/Saturday are the UAE weekend → much lighter traffic.
    const isWeekend = weekday === 5 || weekday === 6;
    const volume = isWeekend ? int(3, 9) : int(14, 26);

    for (let i = 0; i < volume; i++) {
      // Business-hours bias, in institute local time (UTC+4).
      const hourLocal = chance(0.82) ? int(9, 18) : int(7, 21);
      const startedAt = new Date(dayStart);
      startedAt.setUTCHours(hourLocal - 4, int(0, 59), int(0, 59), 0);

      const scenario = pick(SCENARIOS);
      const skill = scenario.skill;
      const queue = queueBySkill.get(skill) ?? generalQueue;

      // Contact: reuse an existing one sometimes so history looks real.
      const callerName = `${pick(FIRST)} ${pick(LAST)}`;
      const phone = makeCallerNumber();
      // findFirst + create rather than upsert: phoneE164 is unique per org now,
      // and the scoped read already answers "does this centre know this caller".
      const contact =
        (await prisma.contact.findFirst({ where: { phoneE164: phone } })) ??
        (await prisma.contact.create({
          data: {
            phoneE164: phone,
            name: callerName,
            courseInterest: chance(0.6) ? pick(COURSES).title : null,
            bitrixEntity: chance(0.75) ? 'lead' : null,
            bitrixId: chance(0.75) ? String(int(1000, 9999)) : null,
            bitrixSyncedAt: chance(0.75) ? startedAt : null,
          },
        }));

      /* --- 15% of the traffic is WhatsApp so the unified inbox looks real --- */
      if (chance(0.15)) {
        const escalated = chance(0.35);
        const handler = escalated ? pick(agentUsers) : null;
        const endedAt = new Date(startedAt.getTime() + int(120, 1800) * 1000);
        const conv = await prisma.conversation.create({
          data: {
            channel: 'WHATSAPP',
            direction: 'INBOUND',
            status: 'CLOSED',
            contactId: contact.id,
            queueId: escalated ? queue.id : null,
            handledById: handler?.id ?? null,
            startedAt,
            endedAt,
            aiContained: !escalated,
            disposition: escalated
              ? pick(['LEAD_QUALIFIED', 'CALLBACK_REQUESTED', 'EXISTING_STUDENT_SUPPORT'] as const)
              : pick(['INFO_PROVIDED', 'INFO_PROVIDED', 'FEE_ENQUIRY', 'ENROLMENT_INTEREST'] as const),
          },
        });
        const turns = int(2, 5);
        for (let t = 0; t < turns; t++) {
          await prisma.message.create({
            data: {
              conversationId: conv.id,
              role: t % 2 === 0 ? 'CALLER' : 'AI',
              text:
                t % 2 === 0
                  ? pick(['What are the fees?', 'Is registration open?', 'What are the timings?', 'Do you have weekend classes?'])
                  : 'Happy to help — let me get that for you.',
              createdAt: new Date(startedAt.getTime() + t * 40_000),
            },
          });
        }
        totalWhatsApp++;
        continue;
      }

      /* ------------------------ outbound AI campaigns ------------------------
         Outbound is AI-first, same as inbound: the assistant places the call,
         opens the conversation, and hands to a human only when the contact asks
         for one or goes past what it can answer. That is the whole commercial
         argument — 12 agents cannot dial a follow-up list, an assistant can.

         Containment is modelled lower than inbound (~55% vs ~76%): an outbound
         contact did not choose to call, so they interrupt, ask for a person, and
         push into fees and dates far more readily than someone who dialled in.
         Overstating outbound containment would be the easiest number to get
         wrong in a proposal.                                                   */
      if (chance(0.12)) {
        const campaign = pick(OUTBOUND_CAMPAIGNS);
        const answered = chance(0.62); // the rest ring out or hit voicemail
        const escalates = answered && chance(0.45);
        const handler = escalates
          ? pick(agentUsers.filter((u) => (u.skills as string[]).includes(skill)) ?? agentUsers)
          : null;

        const aiTalkMs = answered ? int(25_000, 90_000) : int(6000, 14_000);
        const agentTalkMs = escalates ? int(70_000, 300_000) : 0;
        const endedAt = new Date(startedAt.getTime() + aiTalkMs + agentTalkMs);

        const conv = await prisma.conversation.create({
          data: {
            channel: 'VOICE',
            direction: 'OUTBOUND',
            status: 'CLOSED',
            contactId: contact.id,
            queueId: escalates ? queue.id : null,
            handledById: handler?.id ?? null,
            startedAt,
            endedAt,
            // Answered and never passed to a human = the AI handled it alone.
            // escalationReason lives on Call, not Conversation — the handoff
            // reason is a property of the call leg, not the thread.
            aiContained: answered && !escalates,
            // No NO_ANSWER in the Disposition enum, and inventing one would be
            // wrong: a call nobody picked up genuinely has no outcome to record.
            // These are the rows the "missing disposition" report should flag.
            disposition: answered
              ? escalates
                ? pick(['ENROLMENT_INTEREST', 'CALLBACK_REQUESTED', 'LEAD_QUALIFIED'] as const)
                : // A dialled list goes stale: some of these numbers have moved
                  // on to somebody else entirely.
                  pick(['INFO_PROVIDED', 'NOT_INTERESTED', 'NOT_INTERESTED', 'ENROLMENT_INTEREST', 'WRONG_NUMBER'] as const)
              : null,
          },
        });

        /* An outbound call is still an AI session, so it needs one — otherwise
           it has a transcript but no summary, no intent, no cost, and nothing
           for the screen-pop to show. Unanswered attempts get a session too:
           "we dialled and nobody picked up" is the outcome, and omitting it
           would quietly drop those calls out of the AI cost reporting. */
        await prisma.aiSession.create({
          data: {
            conversationId: conv.id,
            aiAgentId: aiAgent.id,
            driverStt: 'web-speech',
            driverLlm: 'scripted',
            driverTts: 'web-speech',
            turns: answered ? (escalates ? 3 : 2) : 0,
            escalated: escalates,
            escalationReason: escalates ? 'CALLER_REQUESTED' : null,
            detectedIntent: answered ? 'outbound_follow_up' : null,
            courseOfInterest: contact.courseInterest,
            sentiment: answered ? Number((rnd() * 1.2 - 0.3).toFixed(2)) : null,
            summary: answered
              ? `Outbound ${campaign.name.toLowerCase()} for ${contact.courseInterest ?? 'their enquiry'}. ` +
                (escalates
                  ? 'Contact asked to speak to an advisor; transferred.'
                  : 'Handled by the assistant; no advisor needed.')
              : `Outbound ${campaign.name.toLowerCase()} — no answer. Worth retrying.`,
            avgLatencyMs: answered ? int(380, 900) : null,
          },
        });

        if (answered) {
          const lines: [string, 'AI' | 'CALLER' | 'HUMAN_AGENT'][] = [
            [campaign.opener, 'AI'],
            [pick(campaign.replies), 'CALLER'],
            [campaign.followUp, 'AI'],
          ];
          if (escalates) {
            lines.push(
              ['Can I speak to someone about it?', 'CALLER'],
              ['Of course — putting you through to an advisor now.', 'AI'],
              [`Hello, ${handler!.name} here — I can help with that.`, 'HUMAN_AGENT'],
            );
          }
          let offset = 0;
          for (const [text, role] of lines) {
            await prisma.message.create({
              data: {
                conversationId: conv.id,
                role,
                text,
                confidence: role === 'AI' ? Number((0.55 + rnd() * 0.4).toFixed(4)) : null,
                createdAt: new Date(startedAt.getTime() + offset),
              },
            });
            offset += int(9000, 24_000);
          }
        }
        totalOutbound++;
        continue;
      }

      /* ------------------------------ voice call ------------------------------ */
      const escalates = scenario.escalates;
      const abandons = escalates && chance(0.09);
      // Junk only ever lands on calls the assistant handled alone: nobody
      // transfers a robocall to an advisor.
      const junk = !escalates && chance(0.05) ? pick(JUNK_CALLS) : null;
      const aiTurns = junk ? 1 : int(2, 6);
      const aiTalkMs = junk ? int(9000, 22_000) : aiTurns * int(9000, 16000);
      const queueWaitMs = escalates ? int(3000, 55000) : 0;
      const agentTalkMs = escalates && !abandons ? int(90_000, 420_000) : 0;
      const wrapMs = escalates && !abandons ? int(8000, 45000) : 0;
      const totalMs = aiTalkMs + queueWaitMs + agentTalkMs;
      const endedAt = new Date(startedAt.getTime() + totalMs + wrapMs);
      const handler = escalates && !abandons ? pick(agentUsers.filter((u) => (u.skills as string[]).includes(skill)) ?? agentUsers) : null;
      const resolvedHandler = handler ?? (escalates && !abandons ? pick(agentUsers) : null);

      const aiContained = !escalates;
      const hangupCause = abandons
        ? 'ABANDONED_IN_QUEUE'
        : aiContained
          ? 'AI_RESOLVED'
          : chance(0.7)
            ? 'CALLER_HANGUP'
            : 'AGENT_HANGUP';

      const conv = await prisma.conversation.create({
        data: {
          channel: 'VOICE',
          direction: 'INBOUND',
          status: 'CLOSED',
          contactId: contact.id,
          queueId: escalates ? queue.id : null,
          handledById: resolvedHandler?.id ?? null,
          startedAt,
          endedAt,
          aiContained,
          /*
           * The outcome, not the handling. Weighted rather than uniform: an
           * institute's line is mostly people being told something, and a
           * qualified lead is the minority that matters — a flat spread would
           * make the outcomes chart say nothing and the "lead qualified" filter
           * return a third of the inbox.
           */
          disposition: abandons
            ? null
            : junk
              ? junk.disposition
              : aiContained
                ? pick([
                    'INFO_PROVIDED', 'INFO_PROVIDED', 'INFO_PROVIDED', 'INFO_PROVIDED',
                    'FEE_ENQUIRY', 'EXISTING_STUDENT_SUPPORT', 'LEAD_QUALIFIED',
                  ] as const)
                : pick([
                    'ENROLMENT_INTEREST', 'ENROLMENT_INTEREST', 'FEE_ENQUIRY', 'INFO_PROVIDED',
                    'CALLBACK_REQUESTED', 'EXISTING_STUDENT_SUPPORT', 'LEAD_QUALIFIED', 'LEAD_QUALIFIED',
                  ] as const),
          notes: resolvedHandler && chance(0.3) ? 'Caller asked to be contacted again next week.' : null,
          tags: chance(0.25) ? [pick(['hot-lead', 'follow-up', 'corporate', 'returning-student'])] : [],
        },
      });

      const call = await prisma.call.create({
        data: {
          conversationId: conv.id,
          providerCallId: `seed-${d}-${i}-${Math.floor(rnd() * 1e6)}`,
          driver: 'simulated',
          fromNumber: phone,
          toNumber: FIT_OWNED_NUMBERS[0]!.e164,
          state: 'COMPLETED',
          ringingAt: startedAt,
          aiAnsweredAt: new Date(startedAt.getTime() + int(600, 1400)),
          escalatedAt: escalates ? new Date(startedAt.getTime() + aiTalkMs) : null,
          queuedAt: escalates ? new Date(startedAt.getTime() + aiTalkMs) : null,
          agentRingingAt: escalates && !abandons ? new Date(startedAt.getTime() + aiTalkMs + queueWaitMs - 4000) : null,
          agentAnsweredAt: escalates && !abandons ? new Date(startedAt.getTime() + aiTalkMs + queueWaitMs) : null,
          wrapupStartedAt: escalates && !abandons ? new Date(startedAt.getTime() + aiTalkMs + queueWaitMs + agentTalkMs) : null,
          endedAt,
          hangupCause: hangupCause as Prisma.CallCreateInput['hangupCause'],
          escalationReason: escalates ? (scenario.expectedReason as Prisma.CallCreateInput['escalationReason']) : null,
          queueWaitMs: escalates ? queueWaitMs : null,
          aiTalkMs,
          agentTalkMs: agentTalkMs || null,
          wrapMs: wrapMs || null,
          totalMs,
          offerCount: escalates ? int(1, 2) : 0,
        },
      });

      await prisma.callParticipant.createMany({
        data: [
          { callId: call.id, kind: 'CALLER', joinedAt: startedAt, leftAt: endedAt },
          {
            callId: call.id,
            kind: 'AI_AGENT',
            joinedAt: new Date(startedAt.getTime() + 900),
            leftAt: escalates ? new Date(startedAt.getTime() + aiTalkMs) : endedAt,
          },
          ...(resolvedHandler
            ? [{
                callId: call.id,
                kind: 'HUMAN_AGENT' as const,
                userId: resolvedHandler.id,
                joinedAt: new Date(startedAt.getTime() + aiTalkMs + queueWaitMs),
                leftAt: endedAt,
              }]
            : []),
        ],
      });

      await prisma.aiSession.create({
        data: {
          conversationId: conv.id,
          aiAgentId: aiAgent.id,
          driverStt: 'web-speech',
          driverLlm: 'scripted',
          driverTts: 'web-speech',
          turns: aiTurns,
          escalated: escalates,
          escalationReason: escalates ? (scenario.expectedReason as Prisma.AiSessionCreateInput['escalationReason']) : null,
          detectedIntent: junk
            ? junk.intent
            : pick(['fee_enquiry', 'course_details', 'schedule_enquiry', 'enrolment_process', 'location_enquiry']),
          // A wrong number has no course of interest, whatever the contact row
          // happens to remember from a previous call.
          courseOfInterest: junk ? null : contact.courseInterest,
          sentiment: Number((rnd() * 1.4 - 0.4).toFixed(2)),
          summary: junk
            ? junk.summary
            : `Caller asked about ${contact.courseInterest ?? 'course options'}. ${escalates ? 'Transferred to an advisor.' : 'Query resolved by the assistant.'}`,
          avgLatencyMs: int(380, 900),
        },
      });

      /* --- transcript + messages ---------------------------------------
         Historical calls need a readable transcript: a supervisor clicking a
         past call must see the conversation, not an empty panel. Caller lines
         come from the scenario; the AI side is a short plausible reply per turn
         rather than live retrieval, which would mean 600 KB lookups at seed
         time. Real calls build their transcript turn-by-turn for real. */
      const AI_REPLIES = [
        `Thank you for calling ${INSTITUTE.name}. How can I help you today?`,
        'Of course — let me check that for you.',
        `That programme runs over several weeks, with both weekday evening and weekend groups.`,
        'The admissions team confirms the exact current fee and any instalment plan when you register.',
        'Is there anything else I can help you with?',
      ];

      let cursor = 1200;
      const turnsToSeed = junk ? [{ text: junk.caller }] : scenario.turns.slice(0, aiTurns);

      // Greeting first, as the live path does.
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          role: 'AI',
          text: AI_REPLIES[0]!,
          audioOffsetMs: 0,
          createdAt: startedAt,
        },
      });
      await prisma.transcriptSegment.create({
        data: { callId: call.id, speaker: 'AI_AGENT', startMs: 0, endMs: 1100, text: AI_REPLIES[0]! },
      });

      for (const [ti, turn] of turnsToSeed.entries()) {
        const callerStart = cursor;
        const callerEnd = callerStart + Math.max(900, turn.text.split(/\s+/).length * 400);
        const reply = junk ? junk.reply : AI_REPLIES[(ti % (AI_REPLIES.length - 1)) + 1]!;
        const aiEnd = callerEnd + Math.max(1200, reply.split(/\s+/).length * 380);

        await prisma.message.createMany({
          data: [
            {
              conversationId: conv.id,
              role: 'CALLER',
              text: turn.text,
              audioOffsetMs: callerStart,
              confidence: 0.94,
              createdAt: new Date(startedAt.getTime() + callerStart),
            },
            {
              conversationId: conv.id,
              role: 'AI',
              text: reply,
              audioOffsetMs: callerEnd,
              createdAt: new Date(startedAt.getTime() + callerEnd),
            },
          ],
        });
        await prisma.transcriptSegment.createMany({
          data: [
            { callId: call.id, speaker: 'CALLER', startMs: callerStart, endMs: callerEnd, text: turn.text, confidence: 0.94 },
            { callId: call.id, speaker: 'AI_AGENT', startMs: callerEnd, endMs: aiEnd, text: reply },
          ],
        });
        cursor = aiEnd + 700;
      }

      // Deliberately no Recording rows.
      //
      // Historical seed calls are simulated — there is no audio, and inventing a
      // row pointed at a file that doesn't exist gave the UI a play button that
      // 404s. A visibly absent recording is honest; a dead player is not.
      // Real audio arrives on browser and ElevenLabs calls, which do capture it.

      if (chance(0.4)) {
        await prisma.crmSyncLog.create({
          data: {
            direction: 'OUTBOUND_TO_BITRIX',
            method: 'telephony.externalcall.finish',
            entityType: 'call',
            localId: call.id,
            bitrixId: contact.bitrixId,
            status: chance(0.94) ? 'SUCCESS' : 'FAILED',
            request: { CALL_ID: call.id, DURATION: Math.floor(totalMs / 1000) },
            response: { result: true },
            error: null,
            attempts: 1,
            createdAt: endedAt,
          },
        });
      }

      bump(dayStart, queue.id, resolvedHandler?.id ?? '', {
        calls: 1,
        aiContained: aiContained ? 1 : 0,
        escalated: escalates ? 1 : 0,
        abandoned: abandons ? 1 : 0,
        answeredWithinSla: escalates && !abandons && queueWaitMs <= queue.slaSeconds * 1000 ? 1 : 0,
        answered: escalates && !abandons ? 1 : 0,
        talkMs: agentTalkMs,
        handleMs: agentTalkMs + wrapMs,
        queueWaitMs,
        wrapMs,
      });
      totalCalls++;
    }
  }

  console.log('▸ analytics rollups');
  for (const row of dailyMetrics.values()) {
    await prisma.callMetricsDaily.create({
      data: {
        day: row.day,
        queueId: row.queueId,
        agentId: row.agentId,
        calls: row.calls,
        aiContained: row.aiContained,
        escalated: row.escalated,
        abandoned: row.abandoned,
        answeredWithinSla: row.answeredWithinSla,
        answeredCount: row.answered,
        talkMsTotal: BigInt(row.talkMs),
        handleMsTotal: BigInt(row.handleMs),
        queueWaitMsTotal: BigInt(row.queueWaitMs),
        wrapMsTotal: BigInt(row.wrapMs),
      },
    });
  }

  /* --------------------------- agent state history ------------------------ */
  // Enough shift history for the occupancy/adherence columns to be non-empty.
  console.log('▸ agent shift history');
  for (const u of agentUsers) {
    for (let d = 7; d >= 1; d--) {
      const login = new Date();
      login.setUTCDate(login.getUTCDate() - d);
      login.setUTCHours(int(4, 6), int(0, 59), 0, 0);
      let cursor = login;
      const timeline: { to: string; ms: number }[] = [
        { to: 'AVAILABLE', ms: int(40, 90) * 60_000 },
        { to: 'ON_CALL', ms: int(5, 20) * 60_000 },
        { to: 'WRAPUP', ms: int(1, 3) * 60_000 },
        { to: 'AVAILABLE', ms: int(30, 70) * 60_000 },
        { to: 'BREAK', ms: int(15, 40) * 60_000 },
        { to: 'AVAILABLE', ms: int(60, 120) * 60_000 },
        { to: 'ON_CALL', ms: int(5, 25) * 60_000 },
        { to: 'OFFLINE', ms: 0 },
      ];
      let prev: string | null = 'OFFLINE';
      for (const step of timeline) {
        await prisma.agentStateEvent.create({
          data: {
            userId: u.id,
            from: prev as Prisma.AgentStateEventCreateInput['from'],
            to: step.to as Prisma.AgentStateEventCreateInput['to'],
            at: cursor,
            prevMs: step.ms || null,
          },
        });
        prev = step.to;
        cursor = new Date(cursor.getTime() + step.ms);
      }
    }
  }

  /* ------------------------------ live presence --------------------------- */
  // Put a realistic mix on shift so the live board is populated immediately.
  console.log('▸ live presence');
  const onShift = [
    ['layla@fitiedu.com', 'AVAILABLE'],
    ['omar@fitiedu.com', 'AVAILABLE'],
    ['mariam@fitiedu.com', 'AVAILABLE'],
    ['hassan@fitiedu.com', 'AVAILABLE'],
    ['reem@fitiedu.com', 'BREAK'],
    ['zainab@fitiedu.com', 'AVAILABLE'],
    ['yousef@fitiedu.com', 'AVAILABLE'],
    ['noura@fitiedu.com', 'OFFLINE'],
    ['anjali@fitiedu.com', 'AVAILABLE'],
    ['rohit@fitiedu.com', 'AVAILABLE'],
    ['yasmin@fitiedu.com', 'AVAILABLE'],
    ['karim@fitiedu.com', 'OFFLINE'],
  ] as const;
  for (const [email, status] of onShift) {
    const u = byEmail.get(email);
    if (!u) continue;
    await prisma.agentState.update({
      where: { userId: u.id },
      data: {
        status: status as Prisma.AgentStateUpdateInput['status'],
        since: new Date(Date.now() - int(5, 180) * 60_000),
        lastSeenAt: new Date(),
      },
    });
  }

  console.log(
    `\n✓ seeded\n` +
      `  ${users.length} users · ${queues.length} queues · ${chunkCount} KB chunks\n` +
      `  ${totalCalls} inbound voice · ${totalOutbound} outbound voice · ${totalWhatsApp} WhatsApp over ${DAYS} days\n` +
      `\n  Sign in with any address above, password: Password123!\n` +
      `  Admin: layla@fitiedu.com · Supervisor: omar@fitiedu.com · Agent: mariam@fitiedu.com\n` +
      `  Platform operator: super@hirestella.com — creates and manages contact centres\n`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
