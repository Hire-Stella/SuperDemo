/**
 * Fills the three things the analytics screens ask for and the seed never wrote:
 * token cost on AI sessions, a disposition on every finished conversation, and
 * a quality score on every call the assistant handled.
 *
 * Idempotent: a row that already has a value is left alone, so this can be run
 * again after new calls land without rewriting history.
 *
 * Derived, not random. Every number is a function of what the call actually
 * was — its turns, its sentiment, whether it escalated and why — because the
 * charts cross-reference each other. Random cost would put a cheap call at the
 * top of the expensive list; a random score would put a 95 on a call the
 * transcript shows going wrong, and the first person to click through would
 * stop trusting the whole screen.
 *
 *   pnpm --filter @superdemo/db backfill:evals            # every org
 *   pnpm --filter @superdemo/db backfill:evals fit-ai     # one, by slug
 */
import { PrismaClient, type Disposition } from '@prisma/client';

const prisma = new PrismaClient();

/** Cheap deterministic jitter: same id always yields the same number. */
function hash01(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/*
 * Roughly a small hosted model's list price. Exact rates do not matter — what
 * matters is that a long call costs more than a short one, so the "most
 * expensive conversations" list is the long ones and reads as true.
 */
const USD_PER_M_INPUT = 0.6;
const USD_PER_M_OUTPUT = 2.4;

async function main() {
  const slug = process.argv[2];
  const orgs = await prisma.organization.findMany({
    where: slug ? { slug } : {},
    select: { id: true, name: true, slug: true },
  });
  if (orgs.length === 0) throw new Error(slug ? `No org with slug "${slug}"` : 'No organisations');

  for (const org of orgs) {
    console.log(`\n▸ ${org.name} (${org.slug})`);

    /* ── 1. token cost ─────────────────────────────────────────────────── */

    const sessions = await prisma.aiSession.findMany({
      where: { orgId: org.id, costUsd: null },
      select: { id: true, turns: true, summary: true, escalated: true },
    });

    for (const s of sessions) {
      /*
       * Tokens from turns, not from nothing.
       *
       * Each turn carries the system prompt and the history so far, so input
       * grows with the conversation rather than staying flat — which is why a
       * ten-turn call costs more than twice a five-turn one, and why the cost
       * chart is worth looking at at all.
       */
      const turns = Math.max(1, s.turns);
      const jitter = 0.85 + hash01(s.id) * 0.3;
      const inputTokens = Math.round(turns * (320 + turns * 45) * jitter);
      const outputTokens = Math.round(turns * 85 * jitter);
      const costUsd =
        (inputTokens / 1_000_000) * USD_PER_M_INPUT +
        (outputTokens / 1_000_000) * USD_PER_M_OUTPUT;

      await prisma.aiSession.update({
        where: { id: s.id },
        data: { inputTokens, outputTokens, costUsd: Number(costUsd.toFixed(6)) },
      });
    }
    console.log(`  cost + tokens      ${sessions.length} session(s)`);

    /* ── 2. dispositions ───────────────────────────────────────────────── */

    /*
     * Only calls that actually happened. A conversation left without an outcome
     * is not always an oversight: the seeders leave the outbound calls nobody
     * picked up, and the ones abandoned in the queue, deliberately blank —
     * there is no outcome to record, and those rows are what the agents page's
     * "missing disposition" column and the inbox's "no outcome recorded" filter
     * are for. Filling them in erased both signals.
     */
    const undisposed = await prisma.conversation.findMany({
      where: {
        orgId: org.id,
        disposition: null,
        status: 'CLOSED',
        NOT: {
          OR: [
            { call: { is: { aiAnsweredAt: null, agentAnsweredAt: null } } },
            { call: { is: { hangupCause: 'ABANDONED_IN_QUEUE' } } },
          ],
        },
      },
      select: {
        id: true,
        aiSession: { select: { detectedIntent: true, escalated: true, courseOfInterest: true } },
      },
    });

    for (const c of undisposed) {
      const intent = c.aiSession?.detectedIntent ?? '';
      const r = hash01(c.id);

      /*
       * Read the intent first and only guess when there is nothing to read.
       * A call whose detected intent was a fee question and whose disposition
       * says "not interested" is the kind of contradiction someone notices in
       * a demo, and it costs nothing to avoid.
       */
      let disposition: Disposition;
      if (/fee|price|cost/i.test(intent)) disposition = 'FEE_ENQUIRY';
      else if (/enrol|admission|register|join/i.test(intent)) disposition = 'ENROLMENT_INTEREST';
      else if (/callback|call.?back|ring/i.test(intent)) disposition = 'CALLBACK_REQUESTED';
      else if (/support|existing|student|complaint/i.test(intent))
        disposition = 'EXISTING_STUDENT_SUPPORT';
      else if (c.aiSession?.courseOfInterest) disposition = 'ENROLMENT_INTEREST';
      // Weighted to match the distribution the seed already produced, so the
      // outcomes chart keeps its shape instead of growing a new spike.
      else if (r < 0.55) disposition = 'INFO_PROVIDED';
      else if (r < 0.73) disposition = 'ENROLMENT_INTEREST';
      else if (r < 0.85) disposition = 'CALLBACK_REQUESTED';
      else if (r < 0.94) disposition = 'FEE_ENQUIRY';
      else disposition = 'NOT_INTERESTED';

      await prisma.conversation.update({ where: { id: c.id }, data: { disposition } });
    }
    console.log(`  dispositions       ${undisposed.length} conversation(s)`);

    /* ── 3. evals ──────────────────────────────────────────────────────── */

    const toScore = await prisma.aiSession.findMany({
      where: { orgId: org.id, conversation: { callEval: null } },
      select: {
        id: true,
        conversationId: true,
        turns: true,
        sentiment: true,
        escalated: true,
        escalationReason: true,
        summary: true,
      },
    });

    for (const s of toScore) {
      const r = hash01(s.conversationId);
      const sentiment = s.sentiment ?? 0;

      /*
       * The four dimensions move for different reasons, which is the point of
       * having four. A call can be perfectly accurate and still escalate too
       * late; one can be warm and wrong. Scoring them off one number would
       * make the weakest-dimension chart meaningless.
       */
      /*
       * Why the assistant let go matters more than any other signal.
       *
       * LOW_CONFIDENCE and OUT_OF_SCOPE mean it was out of its depth, which is
       * exactly when a model is most likely to have reached for something it
       * could not support — so those calls are marked down on accuracy and
       * policy, not just on escalation. MAX_TURNS means it never let go at all.
       */
      const outOfDepth =
        s.escalationReason === 'LOW_CONFIDENCE' || s.escalationReason === 'OUT_OF_SCOPE';
      const ranLong = s.escalationReason === 'MAX_TURNS' || s.turns > 14;
      const unhappy = sentiment < -0.2;

      const accuracy = clamp(
        Math.round(
          86 + sentiment * 22 + r * 12 - (outOfDepth ? 26 : 0) - (ranLong ? 8 : 0),
        ),
        30,
        100,
      );

      // The strictest dimension, and the least forgiving: this is "did it
      // invent anything", where a near miss is still a failure.
      const policy = clamp(
        Math.round(94 + r * 8 - (outOfDepth ? 30 : 0) - (ranLong ? 10 : 0) - (unhappy ? 8 : 0)),
        25,
        100,
      );

      /*
       * Judged on WHY, not whether. Handing over because the customer asked is
       * the system working; running to the turn limit is the opposite.
       */
      const escalation = s.escalated
        ? s.escalationReason === 'CALLER_REQUESTED'
          ? clamp(Math.round(90 + r * 10), 72, 100)
          : s.escalationReason === 'MAX_TURNS'
            ? clamp(Math.round(38 + r * 20), 20, 62)
            : clamp(Math.round(64 + r * 22), 35, 92)
        : clamp(Math.round(86 + sentiment * 14 + r * 12 - (ranLong ? 22 : 0)), 40, 100);

      const tone = clamp(Math.round(89 + sentiment * 16 + r * 9 - (unhappy ? 6 : 0)), 45, 100);

      const score = Math.round(accuracy * 0.3 + policy * 0.35 + escalation * 0.2 + tone * 0.15);

      const weakest = Math.min(accuracy, policy, escalation, tone);
      const note =
        weakest >= 85
          ? 'Handled cleanly — answered from the knowledge base and closed the loop.'
          : weakest === policy
            ? 'Drifted towards specifics it had no source for; keep an eye on this pattern.'
            : weakest === escalation
              ? s.escalated
                ? 'Held the call longer than it should have before handing over.'
                : 'Should have offered a person sooner than it did.'
              : weakest === accuracy
                ? 'One answer was thin and the customer had to ask twice.'
                : 'Wording drifted off the centre’s usual register.';

      // A tenth are marked human-reviewed, so the screen can show the
      // distinction between an unattended pass and one somebody actually
      // listened to. Deterministic, so re-running does not reshuffle them.
      const reviewer = r > 0.9 ? 'HUMAN' : 'AUTO';

      await prisma.callEval.create({
        data: {
          orgId: org.id,
          conversationId: s.conversationId,
          score,
          accuracy,
          policy,
          escalation,
          tone,
          note,
          reviewer,
        },
      });
    }
    console.log(`  evals              ${toScore.length} call(s)`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
