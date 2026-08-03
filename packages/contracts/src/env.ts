import { z } from 'zod';
import { CrmDriver, LlmDriver, MessagingDriver, TelephonyDriver } from './enums';

/**
 * Environment schema, parsed once at boot. A missing driver key fails the
 * process immediately rather than surfacing as `undefined` mid-demo.
 */
const bool = z
  .union([z.boolean(), z.string()])
  .transform((v) => (typeof v === 'boolean' ? v : ['1', 'true', 'yes', 'on'].includes(v.toLowerCase())));

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

    ANTHROPIC_API_KEY: z.string().optional(),
    ANTHROPIC_MODEL: z.string().default('claude-opus-5'),
    OLLAMA_BASE_URL: z.string().default('http://127.0.0.1:11434'),
    OLLAMA_MODEL: z.string().default('llama3.2'),

    BITRIX_WEBHOOK_URL: z.string().optional(),
    BITRIX_INBOUND_TOKEN: z.string().optional(),

    STORAGE_LOCAL_DIR: z.string().default('.storage'),
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET: z.string().optional(),

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
