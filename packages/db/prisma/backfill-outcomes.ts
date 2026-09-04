/**
 * Gives every outcome the inbox filters on something behind it.
 *
 * The unified inbox filters by outcome, and three of its options matched
 * nothing in a database seeded before they existed: `LEAD_QUALIFIED` is new,
 * and `WRONG_NUMBER` / `SPAM` were in the enum but never seeded. A filter
 * option that always returns an empty table reads as a broken screen, so this
 * fills them in — additive and org-scoped, so it is safe to run against a
 * database with real centres in it. `seed.ts` and `demo-data.ts` now produce
 * all three themselves; this is for the rows that already exist.
 *
 * Passes, all of which keep the data honest rather than just colourful:
 *
 *  0. Clear. A call nobody answered has no outcome; an earlier backfill filled
 *     those in, and this puts them back.
 *  1. Promote. A conversation already marked as interest, whose caller has a
 *     stated interest on file, is a lead someone qualified. Nothing else is
 *     touched — relabelling a fee enquiry "lead qualified" would put rows in
 *     the filter whose transcripts contradict it.
 *  2. Top up junk. Wrong numbers and robocalls are *created*, with their own
 *     two-line transcript, rather than stamped onto an existing call. A six-turn
 *     conversation about course fees labelled "Spam" is the kind of thing
 *     somebody clicks on in a demo.
 *
 * Idempotent. The promotion is a hash of the conversation id, so a second run
 * finds nothing left to promote; the junk pass tops up to a target count and
 * stops.
 *
 *   pnpm --filter @superdemo/db backfill:outcomes            # every org
 *   pnpm --filter @superdemo/db backfill:outcomes fit-ai     # one, by slug
 */
import { PrismaClient } from '@prisma/client';
import { withOrg } from '../src/tenant';

const rawPrisma = new PrismaClient();

/** Cheap deterministic jitter: same id always yields the same number. */
function hash01(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/** Share of interest-with-a-stated-interest calls that were actually qualified. */
const QUALIFIED_SHARE = 0.45;

/** Existing-customer support calls a centre should have before this leaves it alone. */
const EXISTING_TARGET = 24;

/** Junk calls a centre should have on file before this script leaves it alone. */
const JUNK_TARGET = 14;

/** Below this much history a centre is new, not quiet. See the junk pass. */
const MIN_HISTORY = 50;

/**
 * The junk any published number gets. `{{org}}` is the centre's own name, so a
 * dental clinic does not tell callers it is a training institute.
 */
const JUNK_CALLS = [
  {
    disposition: 'WRONG_NUMBER' as const,
    intent: 'wrong_number',
    caller: 'Is this the dental clinic on the ground floor?',
    reply: 'No, this is {{org}} — I think you want the clinic’s own line. Sorry about that.',
    summary: 'Wrong number. Caller was looking for a different business; no action needed.',
  },
  {
    disposition: 'WRONG_NUMBER' as const,
    intent: 'wrong_number',
    caller: 'I am calling about a parcel delivery for flat 402.',
    reply: 'This is {{org}} — nothing to do with parcel deliveries, I am afraid.',
    summary: 'Wrong number. Caller wanted a courier; ended politely.',
  },
  {
    disposition: 'WRONG_NUMBER' as const,
    intent: 'wrong_number',
    caller: 'Can you put me through to the accounts department at the tower?',
    reply: 'You have reached {{org}} instead — I do not have a line to that building.',
    summary: 'Wrong number. Caller wanted another organisation’s switchboard.',
  },
  {
    disposition: 'SPAM' as const,
    intent: 'spam',
    caller: 'Congratulations, your business has been selected for a free marketing audit —',
    reply: 'Thank you, but we are not interested in cold sales calls. Ending the call now.',
    summary: 'Unsolicited sales call. Closed out by the assistant; no follow-up.',
  },
  {
    disposition: 'SPAM' as const,
    intent: 'spam',
    caller: 'This is a final notice regarding your vehicle insurance policy.',
    reply: 'We have no policy with you and this line is for customers. Ending the call.',
    summary: 'Recorded sales call. Closed out by the assistant; no follow-up.',
  },
  {
    disposition: 'SPAM' as const,
    intent: 'spam',
    caller: 'We can get {{org}} to the top of Google for a one-time fee —',
    reply: 'We do not take sales calls on this line. Ending the call now.',
    summary: 'SEO cold call. Closed out by the assistant; no follow-up.',
  },
] as const;

async function main() {
  const slug = process.argv[2];
  const orgs = await rawPrisma.organization.findMany({
    where: slug ? { slug } : {},
    select: { id: true, name: true, slug: true },
  });
  if (orgs.length === 0) throw new Error(slug ? `No org with slug "${slug}"` : 'No organisations');

  for (const org of orgs) {
    const prisma = withOrg(rawPrisma, org.id);
    console.log(`\n▸ ${org.name} (${org.slug})`);

    /* ── 1. calls nobody answered have no outcome ───────────────────────── */

    /*
     * Clear, not fill. `backfill-evals` used to stamp an outcome on every blank
     * conversation, including the outbound calls that rang out and the ones
     * abandoned in the queue — so a call nobody picked up ended up recorded as
     * "information provided". That erased two things at once: the agents page's
     * missing-disposition column, and the honest answer to "what happened on
     * this call", which is nothing. It has been fixed at the source; this
     * repairs the rows it already wrote.
     */
    const unanswered = await prisma.conversation.updateMany({
      where: {
        disposition: { not: null },
        OR: [
          { call: { is: { aiAnsweredAt: null, agentAnsweredAt: null } } },
          { call: { is: { hangupCause: 'ABANDONED_IN_QUEUE' } } },
        ],
      },
      data: { disposition: null },
    });
    console.log(`  cleared unanswered ${unanswered.count} call(s)`);

    /* ── 2. qualified leads ─────────────────────────────────────────────── */

    const interested = await prisma.conversation.findMany({
      where: {
        disposition: 'ENROLMENT_INTEREST',
        status: 'CLOSED',
        contact: { courseInterest: { not: null } },
      },
      select: { id: true },
    });
    const promote = interested.filter((c) => hash01(c.id) < QUALIFIED_SHARE).map((c) => c.id);
    if (promote.length > 0) {
      await prisma.conversation.updateMany({
        where: { id: { in: promote } },
        data: { disposition: 'LEAD_QUALIFIED' },
      });
    }
    console.log(`  lead qualified     ${promote.length} of ${interested.length} interest call(s)`);

    /* ── 3. existing-customer support ───────────────────────────────────── */

    /*
     * The institute seed never wrote this outcome at all, so the filter option
     * came back empty. Filled from the callers the centre already has a record
     * for — someone with a course on file, or who has rung before, whose
     * question the assistant answered without passing it on. "What time is the
     * weekend group" is the same sentence from a student as from a stranger;
     * what makes it support is who is asking.
     *
     * Topped up to a target rather than taken as a share, and ordered by a hash
     * of the id, so a second run picks the same rows and finds nothing left to
     * do.
     */
    const supported = await prisma.conversation.count({
      where: { disposition: 'EXISTING_STUDENT_SUPPORT' },
    });
    const supportShortfall = Math.max(0, EXISTING_TARGET - supported);
    if (supportShortfall > 0) {
      const contacts = await prisma.contact.findMany({
        select: { id: true, courseInterest: true, _count: { select: { conversations: true } } },
      });
      const known = contacts
        .filter((c) => c.courseInterest !== null || c._count.conversations > 1)
        .map((c) => c.id);
      const candidates = await prisma.conversation.findMany({
        where: {
          disposition: 'INFO_PROVIDED',
          aiContained: true,
          status: 'CLOSED',
          contactId: { in: known },
        },
        select: { id: true },
      });
      const promote = candidates
        .sort((a, b) => hash01(`support-${a.id}`) - hash01(`support-${b.id}`))
        .slice(0, supportShortfall)
        .map((c) => c.id);
      if (promote.length > 0) {
        await prisma.conversation.updateMany({
          where: { id: { in: promote } },
          data: { disposition: 'EXISTING_STUDENT_SUPPORT' },
        });
      }
      console.log(
        `  existing customer  ${supported} on file → added ${promote.length}` +
          ` (of ${candidates.length} known-caller call(s))`,
      );
    } else {
      console.log(`  existing customer  ${supported} on file — nothing to add`);
    }

    /* ── 4. junk traffic ────────────────────────────────────────────────── */

    const existingJunk = await prisma.conversation.count({
      where: { disposition: { in: ['WRONG_NUMBER', 'SPAM'] } },
    });
    const shortfall = Math.max(0, JUNK_TARGET - existingJunk);

    const aiAgent = await prisma.aiAgent.findFirst({ select: { id: true } });
    const ourNumber = await prisma.phoneNumber.findFirst({ select: { e164: true } });
    /*
     * Only centres that already have history get topped up. A newly onboarded
     * tenant's inbox is empty because nobody has called it yet, and the first
     * thing its owner should see is not fourteen robocalls we invented.
     */
    const total = await prisma.conversation.count();
    const hasHistory = total >= MIN_HISTORY;

    if (shortfall === 0 || !aiAgent || !hasHistory) {
      const why = !hasHistory
        ? `only ${total} conversation(s), skipped`
        : !aiAgent
          ? 'no assistant, skipped'
          : 'nothing to add';
      console.log(`  junk calls         ${existingJunk} on file — ${why}`);
      continue;
    }

    // Spread across the same 45 days the seeders use, so these land inside the
    // window the analytics pages and the inbox's date filters look at.
    for (let i = 0; i < shortfall; i++) {
      const junk = JUNK_CALLS[i % JUNK_CALLS.length]!;
      const reply = junk.reply.replace('{{org}}', org.name);
      const r = hash01(`${org.id}-junk-${i}`);

      const startedAt = new Date();
      startedAt.setUTCDate(startedAt.getUTCDate() - (1 + Math.floor(r * 44)));
      startedAt.setUTCHours(5 + Math.floor(r * 12), Math.floor(r * 59), 0, 0);

      const aiTalkMs = 9000 + Math.floor(r * 12_000);
      const endedAt = new Date(startedAt.getTime() + aiTalkMs);

      // A wrong number is a stranger, not one of the centre's contacts — but it
      // is a number that rang, so it gets a contact row like any other caller.
      const phoneE164 = `+9715${String(10_000_000 + Math.floor(r * 89_999_999)).slice(0, 8)}`;
      const contact =
        (await prisma.contact.findFirst({ where: { phoneE164 } })) ??
        (await prisma.contact.create({ data: { phoneE164, name: null } }));

      const conv = await prisma.conversation.create({
        data: {
          channel: 'VOICE',
          direction: 'INBOUND',
          status: 'CLOSED',
          contactId: contact.id,
          startedAt,
          endedAt,
          aiContained: true,
          disposition: junk.disposition,
        },
      });

      const call = await prisma.call.create({
        data: {
          conversationId: conv.id,
          providerCallId: `junk-${conv.id}`,
          driver: 'simulated',
          fromNumber: phoneE164,
          toNumber: ourNumber?.e164 ?? '+97140000000',
          state: 'COMPLETED',
          ringingAt: startedAt,
          aiAnsweredAt: new Date(startedAt.getTime() + 2200),
          endedAt,
          hangupCause: 'AI_RESOLVED',
          aiTalkMs,
          totalMs: aiTalkMs,
        },
      });

      await prisma.callParticipant.createMany({
        data: [
          { callId: call.id, orgId: org.id, kind: 'CALLER', joinedAt: startedAt, leftAt: endedAt },
          {
            callId: call.id,
            orgId: org.id,
            kind: 'AI_AGENT',
            joinedAt: new Date(startedAt.getTime() + 2200),
            leftAt: endedAt,
          },
        ],
      });

      await prisma.aiSession.create({
        data: {
          conversationId: conv.id,
          aiAgentId: aiAgent.id,
          driverStt: 'web-speech',
          driverLlm: 'scripted',
          driverTts: 'web-speech',
          turns: 1,
          escalated: false,
          detectedIntent: junk.intent,
          // Negative-ish but not distressed: nobody enjoys a robocall.
          sentiment: Number((-0.1 - r * 0.3).toFixed(2)),
          summary: junk.summary,
          avgLatencyMs: 400 + Math.floor(r * 400),
        },
      });

      await prisma.message.createMany({
        data: [
          {
            conversationId: conv.id,
            orgId: org.id,
            role: 'CALLER',
            text: junk.caller,
            audioOffsetMs: 1200,
            confidence: 0.92,
            createdAt: new Date(startedAt.getTime() + 1200),
          },
          {
            conversationId: conv.id,
            orgId: org.id,
            role: 'AI',
            text: reply,
            audioOffsetMs: 4200,
            createdAt: new Date(startedAt.getTime() + 4200),
          },
        ],
      });

      /*
       * Count it in the day's rollup. The KPI tiles and the volume chart read
       * `CallMetricsDaily`, not the conversations, so a call created without a
       * rollup row is a call the analytics pages cannot see — and a containment
       * rate that ignores the calls the assistant closed on its own is the one
       * number nobody should have to distrust.
       */
      const day = new Date(startedAt);
      day.setUTCHours(0, 0, 0, 0);
      await prisma.callMetricsDaily.upsert({
        where: { orgId_day_queueId_agentId: { orgId: org.id, day, queueId: '', agentId: '' } },
        create: { day, queueId: '', agentId: '', calls: 1, aiContained: 1 },
        update: { calls: { increment: 1 }, aiContained: { increment: 1 } },
      });
    }
    console.log(`  junk calls         ${existingJunk} on file → added ${shortfall}`);
  }

  /* ── what the inbox's outcome filter will now find ──────────────────────── */
  const spread = await rawPrisma.conversation.groupBy({
    by: ['disposition'],
    _count: { _all: true },
    orderBy: { _count: { id: 'desc' } },
  });
  console.log('\n▸ outcomes across every centre');
  for (const row of spread) {
    console.log(`  ${(row.disposition ?? '(none recorded)').padEnd(26)} ${row._count._all}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void rawPrisma.$disconnect());
