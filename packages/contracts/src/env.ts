import { z } from 'zod';
import { CrmDriver, LlmDriver, MessagingDriver, TelephonyDriver } from './enums';

/**
 * Environment schema, parsed once at boot. A missing driver key fails the
 * process immediately rather than surfacing as `undefined` mid-demo.
 */
const bool = z
  .union([z.boolean(), z.string()])
  .transform((v) => (typeof v === 'boolean' ? v : ['1', 'true', 'yes', 'on'].includes(v.toLowerCase())));

/**
 * Optional string that treats "" as absent.
 *
 * `FOO=` in a .env file yields an empty string, which is truthy-adjacent enough
 * to slip past `??` and reach downstream code as a real value — e.g. a transfer
 * to phone number "".
 */
const optionalStr = z
  .string()
  .optional()
  .transform((v) => (v === undefined || v.trim() === '' ? undefined : v.trim()));

const int = (fallback: number) =>
  z
    .union([z.number(), z.string()])
    .optional()
    .transform((v) => (v === undefined || v === '' ? fallback : Number(v)))
    .pipe(z.number().int().positive());

export const ApiEnv = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    API_PORT: int(3001),
    WEB_ORIGIN: z.string().url().default('http://localhost:3000'),

    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required — run `pnpm services:up`'),
    REDIS_URL: z.string().min(1).default('redis://127.0.0.1:6379'),

    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
    ACCESS_TOKEN_TTL: z.string().default('15m'),
    REFRESH_TOKEN_TTL: z.string().default('30d'),

    TELEPHONY_DRIVER: TelephonyDriver.default('simulated'),
    MESSAGING_DRIVER: MessagingDriver.default('mock'),
    STT_DRIVER: z.enum(['web-speech', 'deepgram']).default('web-speech'),
    TTS_DRIVER: z.enum(['web-speech', 'elevenlabs']).default('web-speech'),
    LLM_DRIVER: LlmDriver.default('scripted'),
    CRM_DRIVER: CrmDriver.default('mock'),
    STORAGE_DRIVER: z.enum(['local', 'r2']).default('local'),

    ANTHROPIC_API_KEY: optionalStr,
    ANTHROPIC_MODEL: z.string().default('claude-opus-5'),
    OLLAMA_BASE_URL: z.string().default('http://127.0.0.1:11434'),
    OLLAMA_MODEL: z.string().default('llama3.2'),

    BITRIX_WEBHOOK_URL: optionalStr,
    BITRIX_INBOUND_TOKEN: optionalStr,

    /* ── ElevenLabs ──────────────────────────────────────────────────────── */
    ELEVENLABS_API_KEY: optionalStr,
    /** The Agent that owns the voice loop. Created once, then reused. */
    ELEVENLABS_AGENT_ID: optionalStr,
    /** Shared secret for verifying their post-call / init webhooks. */
    ELEVENLABS_WEBHOOK_SECRET: optionalStr,
    /**
     * Bearer secret for the custom-LLM bridge and the escalate server tool.
     *
     * Those two endpoints cannot use webhook HMAC (ElevenLabs doesn't sign them),
     * and they are consequential: the bridge runs our orchestrator and the tool
     * can force an escalation. Configure the same value as a custom header on the
     * ElevenLabs side. Required whenever the ElevenLabs driver is active.
     */
    ELEVENLABS_BRIDGE_SECRET: optionalStr,
    /** Voice used for synthesis and for the Agent's TTS. */
    ELEVENLABS_VOICE_ID: z.string().default('21m00Tcm4TlvDq8ikWAM'),
    ELEVENLABS_MODEL_ID: z.string().default('eleven_flash_v2_5'),
    /**
     * Where an escalated call is transferred. Optional: without a licensed UAE
     * trunk there is no agent phone number yet, so escalation still fires our
     * screen-pop and the AI explains the handoff, but no media transfer occurs.
     */
    ELEVENLABS_TRANSFER_NUMBER: optionalStr,
    /**
     * Publicly reachable base URL ElevenLabs calls back on (custom LLM bridge,
     * webhooks, server tools). Required for real calls — localhost is not
     * reachable from their infrastructure, so this needs a tunnel or a deploy.
     */
    PUBLIC_BASE_URL: optionalStr,

    STORAGE_LOCAL_DIR: z.string().default('.storage'),
    R2_ACCOUNT_ID: optionalStr,
    R2_ACCESS_KEY_ID: optionalStr,
    R2_SECRET_ACCESS_KEY: optionalStr,
    R2_BUCKET: optionalStr,

    INSTITUTE_TIMEZONE: z.string().default('Asia/Dubai'),
    RECORDING_RETENTION_DAYS: int(365),
    RECORDING_CONSENT_ENABLED: bool.default(true),
    WRAPUP_SECONDS: int(20),
    AGENT_RING_TIMEOUT_SECONDS: int(20),
    DEFAULT_SLA_SECONDS: int(20),

    SIMULATOR_AUTOPILOT: bool.default(false),
    SIMULATOR_AUTOPILOT_INTERVAL_MS: int(45_000),
  })
  .superRefine((env, ctx) => {
    if (env.LLM_DRIVER === 'claude' && !env.ANTHROPIC_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ANTHROPIC_API_KEY'],
        message: 'ANTHROPIC_API_KEY is required when LLM_DRIVER=claude',
      });
    }
    if (env.CRM_DRIVER === 'bitrix' && !env.BITRIX_WEBHOOK_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['BITRIX_WEBHOOK_URL'],
        message:
          'BITRIX_WEBHOOK_URL is required when CRM_DRIVER=bitrix (Bitrix24 → Developer resources → Inbound webhook)',
      });
    }
    if (env.TELEPHONY_DRIVER === 'elevenlabs') {
      if (!env.ELEVENLABS_API_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ELEVENLABS_API_KEY'],
          message: 'ELEVENLABS_API_KEY is required when TELEPHONY_DRIVER=elevenlabs',
        });
      }
      if (!env.ELEVENLABS_BRIDGE_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ELEVENLABS_BRIDGE_SECRET'],
          message:
            'ELEVENLABS_BRIDGE_SECRET is required when TELEPHONY_DRIVER=elevenlabs — the custom-LLM ' +
            'bridge and the escalate tool are publicly routable and must not be left unauthenticated',
        });
      }
      if (!env.PUBLIC_BASE_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['PUBLIC_BASE_URL'],
          message:
            'PUBLIC_BASE_URL is required when TELEPHONY_DRIVER=elevenlabs — ElevenLabs must be able ' +
            'to reach the custom-LLM bridge and webhooks, and localhost is not reachable from their side',
        });
      }
    }
    if (env.STORAGE_DRIVER === 'r2' && !env.R2_BUCKET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['R2_BUCKET'],
        message: 'R2_BUCKET is required when STORAGE_DRIVER=r2',
      });
    }
  });

export type ApiEnv = z.infer<typeof ApiEnv>;

/** Parse and pretty-print failures — a bad `.env` should be obvious, not cryptic. */
export function parseApiEnv(raw: NodeJS.ProcessEnv): ApiEnv {
  const result = ApiEnv.safeParse(raw);
  if (result.success) return result.data;

  const lines = result.error.issues.map((i) => `  • ${i.path.join('.') || '(root)'}: ${i.message}`);
  throw new Error(
    `Invalid environment configuration:\n${lines.join('\n')}\n\nCopy .env.example to .env and fill the gaps.`,
  );
}
