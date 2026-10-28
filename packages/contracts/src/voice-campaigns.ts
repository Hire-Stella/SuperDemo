import { z } from 'zod';

/**
 * Campaigns that run on the voice platform (Dograh) itself.
 *
 * The dashboard does not dial these. It uploads the contacts, creates the
 * campaign through Dograh's own API and starts or pauses it there, so the calls
 * go out exactly as the platform's own campaigns do: its pacing, its caller-ID
 * rotation, its retries, its schedule and its circuit breaker. The fields below
 * are that platform's New Campaign form, field for field, in camelCase.
 */

export const VoiceCampaignRetry = z.object({
  enabled: z.boolean().default(true),
  maxRetries: z.number().int().min(0).max(10).default(2),
  delaySeconds: z.number().int().min(30).max(3600).default(120),
  onBusy: z.boolean().default(true),
  onNoAnswer: z.boolean().default(true),
  onVoicemail: z.boolean().default(true),
});
export type VoiceCampaignRetry = z.infer<typeof VoiceCampaignRetry>;

/** `day` is Dograh's day_of_week: 0 is Monday, 6 is Sunday. */
export const VoiceCampaignSlot = z.object({
  day: z.number().int().min(0).max(6),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});
export type VoiceCampaignSlot = z.infer<typeof VoiceCampaignSlot>;

export const VoiceCampaignSchedule = z.object({
  enabled: z.boolean().default(true),
  timezone: z.string().min(1).default('Asia/Dubai'),
  slots: z.array(VoiceCampaignSlot).min(1).max(50),
});
export type VoiceCampaignSchedule = z.infer<typeof VoiceCampaignSchedule>;

export const VoiceCampaignCircuitBreaker = z.object({
  enabled: z.boolean().default(true),
  failurePercent: z.number().int().min(1).max(100).default(50),
  windowSeconds: z.number().int().min(30).max(600).default(120),
  minCalls: z.number().int().min(1).max(100).default(5),
});
export type VoiceCampaignCircuitBreaker = z.infer<typeof VoiceCampaignCircuitBreaker>;

export const VOICE_CAMPAIGN_MAX_CONTACTS = 20_000;

export const CreateVoiceCampaignInput = z.object({
  name: z.string().trim().min(1).max(255),
  workflowId: z.number().int().positive(),
  telephonyConfigurationId: z.number().int().positive(),
  /** Country numbers without a country code are read as. */
  country: z.string().length(2).default('AE'),
  /** One per CSV row. `extra` columns reach the agent as template variables. */
  contacts: z
    .array(
      z.object({
        phone: z.string().trim().min(1).max(40),
        name: z.string().trim().max(200).optional(),
        extra: z.record(z.string(), z.string().max(500)).optional(),
      }),
    )
    .min(1)
    .max(VOICE_CAMPAIGN_MAX_CONTACTS),
  fileName: z.string().trim().max(200).default('contacts.csv'),
  /** Null leaves it to the organisation's concurrent-call limit. */
  maxConcurrency: z.number().int().min(1).nullable().default(null),
  ratePerSecond: z.number().int().min(1).default(1),
  retry: VoiceCampaignRetry,
  schedule: VoiceCampaignSchedule.nullable().default(null),
  circuitBreaker: VoiceCampaignCircuitBreaker,
});
export type CreateVoiceCampaignInput = z.infer<typeof CreateVoiceCampaignInput>;

export const VoiceCampaignRow = z.object({
  id: z.number().int(),
  name: z.string(),
  workflowId: z.number().int(),
  workflowName: z.string(),
  /** Dograh's own state: draft, running, paused, completed, … */
  state: z.string(),
  totalRows: z.number().int().nullable(),
  processedRows: z.number().int(),
  failedRows: z.number().int(),
  createdAt: z.string(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  telephonyConfigurationName: z.string().nullable(),
  maxConcurrency: z.number().int().nullable(),
  ratePerSecond: z.number().int(),
  retry: VoiceCampaignRetry,
  schedule: VoiceCampaignSchedule.nullable(),
  circuitBreaker: VoiceCampaignCircuitBreaker.nullable(),
});
export type VoiceCampaignRow = z.infer<typeof VoiceCampaignRow>;

export const VoiceCampaignsView = z.object({
  /** False when this centre has no voice platform connected. */
  connected: z.boolean(),
  campaigns: z.array(VoiceCampaignRow),
  /** This centre's own agents — never the rest of the host's. */
  agents: z.array(
    z.object({
      id: z.number().int(),
      name: z.string(),
      /**
       * True when the agent has a draft that was never published. Campaigns run
       * the published version, so a campaign would not use those changes.
       */
      unpublished: z.boolean(),
    }),
  ),
  defaultAgentId: z.number().int().nullable(),
  lines: z.array(
    z.object({
      id: z.number().int(),
      name: z.string(),
      provider: z.string(),
      numbers: z.number().int(),
      isDefault: z.boolean(),
    }),
  ),
  defaultLineId: z.number().int().nullable(),
  concurrentCallLimit: z.number().int().nullable(),
  defaultRetry: VoiceCampaignRetry,
  /** Set when the platform could not be read, so the page can say why. */
  error: z.string().nullable(),
});
export type VoiceCampaignsView = z.infer<typeof VoiceCampaignsView>;

export const CreateVoiceCampaignResult = z.object({
  campaign: VoiceCampaignRow,
  uploaded: z.number().int(),
  /** CSV line numbers whose number could not be read. */
  invalid: z.array(z.number().int()),
  optedOut: z.number().int(),
  duplicates: z.number().int(),
});
export type CreateVoiceCampaignResult = z.infer<typeof CreateVoiceCampaignResult>;

export const VoiceCampaignDetail = z.object({
  campaign: VoiceCampaignRow,
  progress: z.object({
    state: z.string(),
    totalRows: z.number().int(),
    processedRows: z.number().int(),
    failedCalls: z.number().int(),
    percent: z.number(),
  }),
  runs: z.array(
    z.object({
      id: z.number().int(),
      phone: z.string().nullable(),
      name: z.string().nullable(),
      createdAt: z.string(),
      completed: z.boolean(),
      durationSeconds: z.number().nullable(),
      outcome: z.string().nullable(),
      isRetry: z.boolean(),
      /** The imported conversation in this dashboard, once the run has been imported. */
      conversationId: z.string().nullable(),
    }),
  ),
  runsTotal: z.number().int(),
});
export type VoiceCampaignDetail = z.infer<typeof VoiceCampaignDetail>;
