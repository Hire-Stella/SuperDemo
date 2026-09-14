import { z } from 'zod';

/**
 * Demo calls — three dialers, one page.
 *
 * A centre's Dograh usually holds more than one agent: the receptionist that
 * answers the published number, the one that rings a lead back, and the one
 * that delivers a reminder nobody needs to reply to. They are different
 * workflows with different prompts, and until now the only way to hear any of
 * them was the single demo-call button on the Website page, which could only
 * ever reach the one workflow the landing page happened to point at.
 *
 * So: three named slots, each pointing at a workflow of the operator's
 * choosing, each dialable from one place. That is the whole feature — the
 * difference between the three is *which agent picks up*, which is exactly what
 * anyone showing or testing this needs to compare.
 *
 * Every slot is optional. A centre that only does inbound configures one and
 * the other two stay off, rather than showing two buttons that fail.
 */

export const DemoDialerKind = z.enum(['inbound', 'outbound', 'info']);
export type DemoDialerKind = z.infer<typeof DemoDialerKind>;

/** Fixed order, so the three cards never reshuffle between renders. */
export const DEMO_DIALER_KINDS = ['inbound', 'outbound', 'info'] as const;

export const DEMO_DIALER_LABELS: Record<
  DemoDialerKind,
  { label: string; note: string; hint: string }
> = {
  inbound: {
    label: 'Inbound',
    note: 'The agent that answers when a customer rings in.',
    hint: 'Dograh rings you and the inbound agent speaks first, the way it would to a caller who found the number on the website.',
  },
  outbound: {
    label: 'Outbound',
    note: 'The agent that rings a lead back.',
    hint: 'The call a visitor gets after leaving their number, or that a campaign places. It opens rather than answers.',
  },
  info: {
    label: 'Info call',
    note: 'The agent that delivers something and hangs up.',
    hint: 'A reminder, a confirmation, a status update — one-way by design, with no qualification and nothing to book.',
  },
};

/**
 * Which Dograh workflow answers for one slot.
 *
 * The uuid is stored next to the id for the same reason as on the landing
 * page's config: Dograh's management endpoints key on the numeric id and its
 * call endpoints key on the uuid, and looking the uuid up on every dial would
 * be a round trip per call to learn something that never changes.
 */
export const DemoDialerConfig = z.object({
  enabled: z.boolean().default(false),
  workflowId: z.number().int().positive().nullable().default(null),
  workflowUuid: z.string().default(''),
  workflowName: z.string().default(''),
});
export type DemoDialerConfig = z.infer<typeof DemoDialerConfig>;

const BLANK: DemoDialerConfig = {
  enabled: false,
  workflowId: null,
  workflowUuid: '',
  workflowName: '',
};

/** All three slots, as stored in `Setting.dograhDialers`. */
export const DograhDialers = z.object({
  inbound: DemoDialerConfig.default(BLANK),
  outbound: DemoDialerConfig.default(BLANK),
  info: DemoDialerConfig.default(BLANK),
});
export type DograhDialers = z.infer<typeof DograhDialers>;

export const BLANK_DIALERS: DograhDialers = {
  inbound: BLANK,
  outbound: BLANK,
  info: BLANK,
};

/**
 * One slot as the page sees it.
 *
 * `ready` is separate from `enabled` because they fail differently and the page
 * has to say which: a slot switched off is a choice, and a slot switched on
 * whose workflow has no uuid is a setup that did not finish. Showing the same
 * greyed-out card for both leaves the operator with nothing to act on.
 */
export const DemoDialerView = DemoDialerConfig.extend({
  kind: DemoDialerKind,
  ready: z.boolean(),
  /** Why it cannot dial, when it cannot. Null when it can. */
  blockedReason: z.string().nullable(),
});
export type DemoDialerView = z.infer<typeof DemoDialerView>;

export const DemoCallsView = z.object({
  /** False when this centre has no Dograh at all — every slot is unusable. */
  dograhConnected: z.boolean(),
  baseUrl: z.string().nullable(),
  dialers: z.array(DemoDialerView),
  /** Dograh's workflows, for the pickers. Empty when it could not be reached. */
  workflows: z.array(
    z.object({ id: z.number().int(), name: z.string(), status: z.string() }),
  ),
  /** Set when the workflow list could not be fetched, so the picker can say why. */
  workflowsError: z.string().nullable(),
  updatedAt: z.coerce.date().nullable(),
});
export type DemoCallsView = z.infer<typeof DemoCallsView>;

/**
 * Save one slot.
 *
 * One at a time rather than the whole object: two people configuring different
 * slots would otherwise overwrite each other with whatever their page last
 * rendered, and the failure would look like a save that silently did nothing.
 */
export const SaveDemoDialerInput = z.object({
  kind: DemoDialerKind,
  enabled: z.boolean().optional(),
  /** Null clears the slot's workflow, which is not the same as disabling it. */
  workflowId: z.number().int().positive().nullable().optional(),
});
export type SaveDemoDialerInput = z.infer<typeof SaveDemoDialerInput>;

export const PlaceDemoCallInput = z.object({
  kind: DemoDialerKind,
  phone: z.string().trim().min(6, 'A number the agent can ring').max(24),
  /** ISO 3166-1 alpha-2, from the country picker. */
  country: z.string().length(2).default('AE'),
  /** Anything the agent should know before it speaks. Merged into its context. */
  note: z.string().max(300).optional(),
});
export type PlaceDemoCallInput = z.infer<typeof PlaceDemoCallInput>;
