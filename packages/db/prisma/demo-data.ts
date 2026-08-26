/**
 * Fill one centre with demo traffic.
 *
 * Onboarding gives a new tenant queues, an assistant and a number — correct for
 * a real client on day one, and useless for showing anyone what the product
 * does: every board reads zero. This pours a vertical's demo pack into a centre
 * so the live board, inbox, agents page and analytics all have shape.
 *
 * Scoped to one org and additive — it never touches another tenant and never
 * wipes anything, so it is safe to run against a database that already has real
 * centres in it. That is the difference between this and `seed.ts`, which owns
 * the whole database and resets it.
 *
 *   pnpm demo:seed --slug tamil-mart --days 45
 *   pnpm demo:seed --slug tamil-mart --name "Tamil Mart" --industry RETAIL --create
 */
import { PrismaClient, type Prisma } from '@prisma/client';
import argon2 from 'argon2';
import { DEMO_PACKS, TAMIL_FIRST, TAMIL_LAST, type DemoPack } from '../src/data/demo-packs';
import { chunk, embed, keywordsOf } from '../src/embedding';
import { withOrg } from '../src/tenant';

const rawPrisma = new PrismaClient();

/* --------------------------- deterministic RNG ---------------------------- */
// Same generator as seed.ts: a demo whose numbers move between the rehearsal
// and the meeting is worse than no demo.
let seedState = 0x5ee2d17;
function rnd(): number {
  seedState = (seedState + 0x6d2b79f5) | 0;
  let t = seedState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]!;
const int = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const chance = (p: number) => rnd() < p;

/* ---------------------------------- args ---------------------------------- */
function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
}
const flag = (name: string) => process.argv.includes(`--${name}`);

const SLUG = arg('slug');
const NAME = arg('name');
const INDUSTRY = (arg('industry') ?? 'RETAIL') as Prisma.OrganizationCreateInput['industry'];
const DAYS = Number(arg('days', '45'));
const CREATE = flag('create');
/** Clear this centre's generated traffic first, so a re-run replaces rather than doubles. */
const RESET = flag('reset');

const TIMEZONES: Record<string, string> = {
  DUBAI: 'Asia/Dubai',
  INDIA: 'Asia/Kolkata',
  EGYPT: 'Africa/Cairo',
};

async function main() {
  if (!SLUG) throw new Error('--slug is required');

  const org =
    (await rawPrisma.organization.findUnique({ where: { slug: SLUG } })) ??
    (CREATE
      ? await rawPrisma.organization.create({
          data: {
            name: NAME ?? SLUG,
            slug: SLUG,
            industry: INDUSTRY,
            timezone: 'Asia/Dubai',
            themePreset: 'retail',
          },
        })
      : null);

  if (!org) {
    throw new Error(`No centre with slug "${SLUG}". Pass --create --name "…" to make one.`);
  }

  const pack: DemoPack | undefined = DEMO_PACKS[org.industry];
  if (!pack) throw new Error(`No demo pack for industry ${org.industry}`);

  console.log(`▸ ${org.name} (${org.industry}) — ${DAYS} days of demo traffic`);

  // Everything from here is written into that centre and nowhere else.
  const prisma = withOrg(rawPrisma, org.id);

  if (RESET) {
    // Only this centre's conversation history — staff, queues, numbers and the
    // knowledge base survive, because those are configuration rather than demo
    // traffic and re-creating them would churn ids the UI may be holding.
    const convIds = (
      await prisma.conversation.findMany({ select: { id: true } })
    ).map((c) => c.id);
    if (convIds.length) {
      await prisma.transcriptSegment.deleteMany({ where: { call: { conversationId: { in: convIds } } } });
      await prisma.recording.deleteMany({ where: { call: { conversationId: { in: convIds } } } });
      await prisma.callParticipant.deleteMany({ where: { call: { conversationId: { in: convIds } } } });
      await prisma.call.deleteMany({ where: { conversationId: { in: convIds } } });
      await prisma.message.deleteMany({ where: { conversationId: { in: convIds } } });
      await prisma.aiSession.deleteMany({ where: { conversationId: { in: convIds } } });
      await prisma.conversation.deleteMany({ where: { id: { in: convIds } } });
    }
    await prisma.callMetricsDaily.deleteMany({});
    await prisma.agentStateEvent.deleteMany({});
    console.log(`  reset: cleared ${convIds.length} existing conversations`);
  }
  const password = await argon2.hash('Password123!', { type: argon2.argon2id });

  /* -------------------------------- settings ------------------------------ */
  await rawPrisma.setting.upsert({
    where: { orgId: org.id },
    create: { orgId: org.id, instituteName: org.name, instituteTimezone: org.timezone },
    update: {},
  });

  /* --------------------------------- staff -------------------------------- */
  const users = [];
  for (const s of pack.staff) {
    const existing = await rawPrisma.user.findUnique({ where: { email: s.email } });
    if (existing) {
      users.push(existing);
      continue;
    }
    users.push(
      await prisma.user.create({
        data: {
          email: s.email,
          name: s.name,
          passwordHash: password,
          role: s.role as Prisma.UserCreateInput['role'],
          location: s.location as Prisma.UserCreateInput['location'],
          timezone: TIMEZONES[s.location]!,
          skills: s.skills as unknown as Prisma.UserCreateInput['skills'],
          extension: s.ext,
          avatarColor: s.colour,
          presence: { create: { orgId: org.id, status: 'OFFLINE', since: new Date() } },
        },
      }),
    );
  }
  const agents = users.filter((u) => u.role === 'AGENT' || u.role === 'SUPERVISOR');
  console.log(`  staff: ${users.length}`);

  /* -------------------------------- queues -------------------------------- */
  // Onboarding already made these; reuse rather than duplicate.
  let queues = await prisma.queue.findMany();
  if (queues.length === 0) {
    for (const [name, skill] of [
      ['Orders & delivery', 'EDUCATION'],
      ['Billing & returns', 'FINANCE'],
      ['Wholesale', 'MANAGEMENT'],
      ['Front desk', 'GENERAL'],
    ] as const) {
      await prisma.queue.create({
        data: { name, requiredSkill: skill, slaSeconds: 20 },
      });
    }
    queues = await prisma.queue.findMany();
  }

  // Onboarding creates three queues; a pack may route to a slot none of them
  // cover (wholesale, here). Add what is missing rather than quietly dumping
  // those calls into the general queue.
  const QUEUE_NAMES: Record<string, string> = {
    EDUCATION: 'Orders & delivery',
    FINANCE: 'Billing & returns',
    MANAGEMENT: 'Wholesale & trade',
    LANGUAGE: 'Tamil & Malayalam line',
    GENERAL: 'Front desk',
  };
  for (const skill of new Set(pack.exchanges.map((e) => e.skill))) {
    if (queues.some((q) => q.requiredSkill === skill)) continue;
    await prisma.queue.create({
      data: { name: QUEUE_NAMES[skill] ?? skill, requiredSkill: skill, slaSeconds: 25 },
    });
  }
  queues = await prisma.queue.findMany();

  const queueBySkill = new Map(queues.map((q) => [q.requiredSkill as string, q]));
  const generalQueue = queueBySkill.get('GENERAL') ?? queues[0]!;

  // Staff the queues, or every escalated call routes to nobody.
  for (const q of queues) {
    const eligible = agents.filter((a) => (a.skills as string[]).includes(q.requiredSkill));
    await prisma.queueMembership.createMany({
      data: (eligible.length ? eligible : agents).map((a) => ({ queueId: q.id, userId: a.id })),
      skipDuplicates: true,
    });
  }

  /* ------------------------------- AI agent ------------------------------- */
  let aiAgent = await prisma.aiAgent.findFirst();
  if (!aiAgent) {
    aiAgent = await prisma.aiAgent.create({
      data: {
        name: 'Store assistant',
        greeting: `Thank you for calling ${org.name}. How can I help you today?`,
        systemPrompt: `You are the phone assistant for ${org.name}. Answer from the knowledge base only.`,
        escalationRules: {
          handoffKeywords: ['human', 'person', 'manager', 'speak to someone'],
          confidenceFloor: 0.35,
          maxTurns: 6,
          sentimentFloor: -0.5,
          humanOnlyIntents: ['complaint', 'refund', 'wholesale'],
        },
        defaultQueueId: generalQueue.id,
      },
    });
  }

  /* ------------------------------ knowledge ------------------------------- */
  const existingDocs = await prisma.knowledgeDoc.count();
  if (existingDocs < pack.knowledge.length) {
    for (const doc of pack.knowledge) {
      const already = await prisma.knowledgeDoc.findFirst({ where: { title: doc.title } });
      if (already) continue;
      const created = await prisma.knowledgeDoc.create({
        data: {
          title: doc.title,
          category: doc.category as Prisma.KnowledgeDocCreateInput['category'],
          source: 'demo',
          content: doc.content,
        },
      });
      const pieces = chunk(doc.content);
      await prisma.knowledgeChunk.createMany({
        data: pieces.map((piece, ordinal) => {
          const embedText = `${doc.title}\n${piece}`;
          return {
            docId: created.id,
            ordinal,
            content: piece,
            embedding: embed(embedText),
            keywords: keywordsOf(embedText),
          };
        }),
      });
    }
  }
  console.log(`  knowledge: ${await prisma.knowledgeDoc.count()} docs`);

  /* -------------------------------- numbers ------------------------------- */
  if ((await prisma.phoneNumber.count()) < 2) {
    for (const [label, e164] of [
      ['Main line', `+9714${int(2000000, 2999999)}`],
      ['Orders & delivery', `+9714${int(3000000, 3999999)}`],
    ] as const) {
      await prisma.phoneNumber.create({
        data: {
          e164,
          label,
          provider: 'mock',
          status: 'ASSIGNED',
          inboundQueueId: generalQueue.id,
          aiAgentId: aiAgent.id,
          purchasedAt: new Date(),
        },
      });
    }
  }

  /* ------------------------------- history -------------------------------- */
  const dailyMetrics = new Map<
    string,
    {
      day: Date; queueId: string; agentId: string; calls: number; aiContained: number;
      escalated: number; abandoned: number; answeredWithinSla: number; answered: number;
      talkMs: number; handleMs: number; queueWaitMs: number; wrapMs: number;
    }
  >();
  const bump = (
    day: Date, queueId: string, agentId: string,
    d: Omit<NonNullable<ReturnType<typeof dailyMetrics.get>>, 'day' | 'queueId' | 'agentId'>,
  ) => {
    const key = `${day.toISOString()}|${queueId}|${agentId}`;
    const row = dailyMetrics.get(key) ?? {
      day, queueId, agentId, calls: 0, aiContained: 0, escalated: 0, abandoned: 0,
      answeredWithinSla: 0, answered: 0, talkMs: 0, handleMs: 0, queueWaitMs: 0, wrapMs: 0,
    };
    for (const k of Object.keys(d) as (keyof typeof d)[]) row[k] += d[k];
    dailyMetrics.set(key, row);
  };

  let voice = 0;
  let whatsapp = 0;
  let outbound = 0;
  const [peakFrom, peakTo] = pack.peakHours;

  // Down to 0, not 1: without today's traffic every "today" tile on the live
  // board reads zero, which is the first thing anyone looks at and makes a
  // populated centre look dead.
  for (let d = DAYS; d >= 0; d--) {
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    dayStart.setUTCDate(dayStart.getUTCDate() - d);
    const weekday = dayStart.getUTCDay();

    // A grocery is busiest at the weekend — the opposite of an office, and the
    // shape of the traffic chart is the first thing anyone looks at.
    const isWeekend = weekday === 5 || weekday === 6;
    const full = isWeekend ? int(18, 30) : int(10, 22);

    // Today is only partly over, so scale to the hours actually elapsed rather
    // than inventing calls from the future.
    const hourNow = Number(
      new Intl.DateTimeFormat('en-GB', {
        timeZone: org.timezone,
        hour: 'numeric',
        hour12: false,
      }).format(new Date()),
    );
    const isToday = d === 0;
    const elapsed = Math.max(0, Math.min(1, (hourNow - peakFrom) / (peakTo - peakFrom)));
    const volume = isToday ? Math.max(2, Math.round(full * elapsed)) : full;
    if (isToday && hourNow < peakFrom) continue;

    for (let i = 0; i < volume; i++) {
      const hourLocal = isToday
        ? int(peakFrom, Math.max(peakFrom, Math.min(peakTo, hourNow)))
        : chance(0.85)
          ? int(peakFrom, peakTo)
          : int(7, 22);
      const startedAt = new Date(dayStart);
      startedAt.setUTCHours(hourLocal - 4, int(0, 59), int(0, 59), 0);

      const name = `${pick(TAMIL_FIRST)} ${pick(TAMIL_LAST)}`;
      const phone = `+9715${pick(['0', '2', '4', '5', '6'])}${int(1000000, 9999999)}`;
      const contact =
        (await prisma.contact.findFirst({ where: { phoneE164: phone } })) ??
        (await prisma.contact.create({
          data: {
            phoneE164: phone,
            name,
            courseInterest: chance(0.7) ? pick(pack.interests) : null,
          },
        }));

      /* ------------------------------ WhatsApp ----------------------------- */
      if (chance(0.18)) {
        const escalated = chance(0.3);
        const handler = escalated ? pick(agents) : null;
        const thread = pick(pack.whatsapp);
        const conv = await prisma.conversation.create({
          data: {
            channel: 'WHATSAPP',
            direction: 'INBOUND',
            status: 'CLOSED',
            contactId: contact.id,
            queueId: escalated ? generalQueue.id : null,
            handledById: handler?.id ?? null,
            startedAt,
            endedAt: new Date(startedAt.getTime() + int(120, 1500) * 1000),
            aiContained: !escalated,
            disposition: escalated ? 'CALLBACK_REQUESTED' : 'INFO_PROVIDED',
          },
        });
        await prisma.message.createMany({
          data: [
            { conversationId: conv.id, role: 'CALLER', text: thread.caller, createdAt: startedAt },
            { conversationId: conv.id, role: 'AI', text: thread.ai, createdAt: new Date(startedAt.getTime() + 25_000) },
          ],
        });
        whatsapp++;
        continue;
      }

      /* ------------------------------- outbound ---------------------------- */
      if (chance(0.12)) {
        const campaign = pick(pack.outbound);
        const answered = chance(0.62);
        const escalates = answered && chance(0.4);
        const handler = escalates ? pick(agents) : null;
        const endedAt = new Date(startedAt.getTime() + (answered ? int(60, 300) : int(15, 40)) * 1000);

        const conv = await prisma.conversation.create({
          data: {
            channel: 'VOICE',
            direction: 'OUTBOUND',
            status: 'CLOSED',
            contactId: contact.id,
            queueId: escalates ? generalQueue.id : null,
            handledById: handler?.id ?? null,
            startedAt,
            endedAt,
            aiContained: answered && !escalates,
            disposition: answered ? (escalates ? 'CALLBACK_REQUESTED' : 'INFO_PROVIDED') : null,
            notes: `Campaign: ${campaign.name}`,
          },
        });
        await prisma.call.create({
          data: {
            conversationId: conv.id,
            providerCallId: `demo-out-${conv.id}`,
            driver: 'simulated',
            fromNumber: '+97142000000',
            toNumber: contact.phoneE164!,
            state: 'COMPLETED',
            ringingAt: startedAt,
            aiAnsweredAt: answered ? new Date(startedAt.getTime() + 4000) : null,
            endedAt,
            hangupCause: answered ? 'AI_RESOLVED' : 'NO_AGENT_AVAILABLE',
            totalMs: endedAt.getTime() - startedAt.getTime(),
            aiTalkMs: answered ? int(30_000, 120_000) : 0,
          },
        });
        await prisma.aiSession.create({
          data: {
            conversationId: conv.id,
            aiAgentId: aiAgent.id,
            driverStt: 'web-speech',
            driverLlm: 'scripted',
            driverTts: 'web-speech',
            turns: answered ? int(2, 4) : 0,
            escalated: escalates,
            detectedIntent: 'outbound_follow_up',
            summary: answered
              ? `Outbound ${campaign.name.toLowerCase()} — customer engaged.`
              : `Outbound ${campaign.name.toLowerCase()} — no answer.`,
          },
        });
        if (answered) {
          await prisma.message.createMany({
            data: [
              { conversationId: conv.id, role: 'AI', text: campaign.opener, createdAt: startedAt },
              { conversationId: conv.id, role: 'CALLER', text: pick(campaign.replies), createdAt: new Date(startedAt.getTime() + 12_000) },
              { conversationId: conv.id, role: 'AI', text: campaign.followUp, createdAt: new Date(startedAt.getTime() + 24_000) },
            ],
          });
        }
        outbound++;
        continue;
      }

      /* -------------------------------- voice ------------------------------ */
      const exchange = pick(pack.exchanges);
      const queue = queueBySkill.get(exchange.skill) ?? generalQueue;
      const escalates = exchange.escalates;
      const abandons = escalates && chance(0.08);
      const aiTurns = int(2, 5);
      const aiTalkMs = aiTurns * int(8000, 15000);
      const queueWaitMs = escalates ? int(2000, 48000) : 0;
      const agentTalkMs = escalates && !abandons ? int(70_000, 380_000) : 0;
      const wrapMs = escalates && !abandons ? int(8000, 40000) : 0;
      const totalMs = aiTalkMs + queueWaitMs + agentTalkMs;
      const endedAt = new Date(startedAt.getTime() + totalMs + wrapMs);

      const eligible = agents.filter((a) => (a.skills as string[]).includes(exchange.skill));
      const handler = escalates && !abandons ? pick(eligible.length ? eligible : agents) : null;

      const conv = await prisma.conversation.create({
        data: {
          channel: 'VOICE',
          direction: 'INBOUND',
          status: 'CLOSED',
          contactId: contact.id,
          queueId: escalates ? queue.id : null,
          handledById: handler?.id ?? null,
          startedAt,
          endedAt,
          aiContained: !escalates,
          disposition: abandons ? null : (exchange.disposition as Prisma.ConversationCreateInput['disposition']),
          tags: chance(0.25) ? [pick(pack.tags)] : [],
        },
      });

      const call = await prisma.call.create({
        data: {
          conversationId: conv.id,
          providerCallId: `demo-${conv.id}`,
          driver: 'simulated',
          fromNumber: contact.phoneE164!,
          toNumber: '+97142000000',
          state: 'COMPLETED',
          ringingAt: startedAt,
          aiAnsweredAt: new Date(startedAt.getTime() + 2500),
          escalatedAt: escalates ? new Date(startedAt.getTime() + aiTalkMs) : null,
          queuedAt: escalates ? new Date(startedAt.getTime() + aiTalkMs) : null,
          agentAnsweredAt: handler ? new Date(startedAt.getTime() + aiTalkMs + queueWaitMs) : null,
          endedAt,
          hangupCause: abandons ? 'ABANDONED_IN_QUEUE' : escalates ? 'AGENT_HANGUP' : 'AI_RESOLVED',
          escalationReason: escalates
            ? ((exchange.reason ?? 'HUMAN_ONLY_INTENT') as Prisma.CallCreateInput['escalationReason'])
            : null,
          queueWaitMs, aiTalkMs, agentTalkMs, wrapMs, totalMs,
          offerCount: escalates ? int(1, 2) : 0,
        },
      });

      await prisma.callParticipant.createMany({
        data: [
          { callId: call.id, kind: 'CALLER', joinedAt: startedAt },
          { callId: call.id, kind: 'AI_AGENT', joinedAt: new Date(startedAt.getTime() + 2500) },
          ...(handler
            ? [{ callId: call.id, kind: 'HUMAN_AGENT' as const, userId: handler.id, joinedAt: new Date(startedAt.getTime() + aiTalkMs + queueWaitMs) }]
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
          escalationReason: escalates
            ? ((exchange.reason ?? 'HUMAN_ONLY_INTENT') as Prisma.AiSessionCreateInput['escalationReason'])
            : null,
          detectedIntent: exchange.skill.toLowerCase(),
          courseOfInterest: contact.courseInterest,
          sentiment: Number((rnd() * 1.4 - 0.4).toFixed(2)),
          summary: `${exchange.caller} — ${escalates ? 'passed to a colleague.' : 'answered by the assistant.'}`,
          avgLatencyMs: int(320, 850),
        },
      });

      const lines: [string, 'AI' | 'CALLER' | 'HUMAN_AGENT'][] = [
        ['Thank you for calling ' + org.name + '. How can I help?', 'AI'],
        [exchange.caller, 'CALLER'],
        [exchange.ai, 'AI'],
      ];
      if (handler) lines.push([`Hello, ${handler.name} here — I can help with that.`, 'HUMAN_AGENT']);
      let offset = 0;
      for (const [text, role] of lines) {
        await prisma.message.create({
          data: {
            conversationId: conv.id,
            role,
            text,
            confidence: role === 'AI' ? Number((0.5 + rnd() * 0.45).toFixed(4)) : null,
            createdAt: new Date(startedAt.getTime() + offset),
          },
        });
        offset += int(8000, 20_000);
      }

      bump(dayStart, queue.id, handler?.id ?? '', {
        calls: 1,
        aiContained: escalates ? 0 : 1,
        escalated: escalates ? 1 : 0,
        abandoned: abandons ? 1 : 0,
        answeredWithinSla: escalates && !abandons && queueWaitMs <= queue.slaSeconds * 1000 ? 1 : 0,
        answered: escalates && !abandons ? 1 : 0,
        talkMs: agentTalkMs,
        handleMs: agentTalkMs + wrapMs,
        queueWaitMs,
        wrapMs,
      });
      voice++;
    }
  }

  console.log('  analytics rollups');
  for (const row of dailyMetrics.values()) {
    await prisma.callMetricsDaily.upsert({
      where: {
        orgId_day_queueId_agentId: {
          orgId: org.id, day: row.day, queueId: row.queueId, agentId: row.agentId,
        },
      },
      create: {
        day: row.day, queueId: row.queueId, agentId: row.agentId,
        calls: row.calls, aiContained: row.aiContained, escalated: row.escalated,
        abandoned: row.abandoned, answeredWithinSla: row.answeredWithinSla,
        answeredCount: row.answered,
        talkMsTotal: BigInt(row.talkMs), handleMsTotal: BigInt(row.handleMs),
        queueWaitMsTotal: BigInt(row.queueWaitMs), wrapMsTotal: BigInt(row.wrapMs),
      },
      update: {},
    });
  }

  /* --------------------------- shift history ------------------------------ */
  // Without this the agents page shows people with no occupancy at all.
  for (const a of agents) {
    for (let d = 7; d >= 1; d--) {
      const login = new Date();
      login.setUTCDate(login.getUTCDate() - d);
      login.setUTCHours(int(4, 6), int(0, 59), 0, 0);
      let cursor = login;
      for (const step of [
        { to: 'AVAILABLE', ms: int(40, 90) * 60_000 },
        { to: 'ON_CALL', ms: int(10, 30) * 60_000 },
        { to: 'WRAPUP', ms: int(1, 4) * 60_000 },
        { to: 'AVAILABLE', ms: int(30, 80) * 60_000 },
        { to: 'BREAK', ms: int(15, 40) * 60_000 },
        { to: 'AVAILABLE', ms: int(60, 140) * 60_000 },
        { to: 'OFFLINE', ms: 0 },
      ] as const) {
        await prisma.agentStateEvent.create({
          data: {
            userId: a.id,
            to: step.to as Prisma.AgentStateEventCreateInput['to'],
            at: cursor,
            prevMs: step.ms || null,
          },
        });
        cursor = new Date(cursor.getTime() + step.ms);
      }
    }
  }

  /* ------------------------------ live board ------------------------------ */
  // A couple of people on shift, so the live board is not a row of zeros.
  for (const a of agents.slice(0, 3)) {
    await prisma.agentState.upsert({
      where: { userId: a.id },
      create: { orgId: org.id, userId: a.id, status: 'AVAILABLE', since: new Date(), lastSeenAt: new Date() },
      update: { status: 'AVAILABLE', since: new Date(), lastSeenAt: new Date() },
    });
  }

  console.log(
    `\n✓ ${org.name} populated\n` +
      `  ${voice} inbound voice · ${outbound} outbound · ${whatsapp} WhatsApp over ${DAYS} days\n` +
      `  ${users.length} staff · ${queues.length} queues · sign in with any address above, password: Password123!\n`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => rawPrisma.$disconnect());
