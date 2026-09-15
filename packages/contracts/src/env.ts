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
    /**
     * The port to listen on.
     *
     * Every managed host — Railway, Render, Fly, Heroku — injects PORT and
     * routes to whatever the process binds. A service that ignores it binds
     * something else, fails its health check, and gets restarted forever with
     * nothing in the logs to say why. So PORT wins when it is set, and
     * API_PORT stays for local development where 3001 is the habit.
     */
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

    /**
     * Encrypts tenant-supplied CRM credentials at rest. Required only once a
     * centre saves its own CRM config; without it that request is refused
     * rather than storing the credential in the clear.
     */
    CRM_SECRET_KEY: optionalStr,

    /**
     * Deployment-wide Dograh, inherited by any centre that has not saved its
     * own. Optional: a deployment with no Dograh at all is the normal case, and
     * a landing page simply keeps its `tel:` link.
     */
    DOGRAH_BASE_URL: optionalStr,
    DOGRAH_API_KEY: optionalStr,

    /**
     * Which model writes the landing-page copy during website enrichment.
     *
     * Separate from LLM_DRIVER, which is the *conversation* brain: that one runs
     * on every turn of every call and its latency is a caller waiting. This one
     * runs once per centre and writes prose a client will read, so the right
     * choice for each is different and they should not be forced to agree.
     *
     * `auto` picks whichever key is present — Groq first, since a deployment
     * that set one deliberately probably means it — and falls back to
     * extracting copy from the page itself when neither is set, so onboarding
     * never hard-fails on a missing key.
     */
    ENRICH_LLM: z.enum(['auto', 'anthropic', 'groq', 'none']).default('auto'),

    /**
     * Groq, used through its OpenAI-compatible endpoint.
     *
     * GROQ_MODEL is optional and normally left unset. Rather than baking in an
     * id that Groq will eventually retire — a 404 waiting to happen on a
     * deployment nobody has touched in six months — the generator asks
     * `GET /models` what this key can actually use and picks the best fit.
     * Setting it here pins that choice and skips the lookup.
     */
    GROQ_API_KEY: optionalStr,
    GROQ_MODEL: optionalStr,
    GROQ_BASE_URL: z.string().default('https://api.groq.com/openai/v1'),
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
    /**
     * Voice for the standalone TTS driver only (`TTS_DRIVER=elevenlabs`), i.e.
     * when *we* call their synthesis API directly.
     *
     * Deliberately NOT applied to the Agent. The Agent's voice, greeting and
     * turn-taking are owned by the ElevenLabs dashboard — one place to change
     * them, and no drift between a value here and what the caller actually
     * hears. See `createAgent`.
     *
     * Default is Jessica, a *premade* voice. That matters on the free tier:
     * library/professional voices return 402 "Free users cannot use library
     * voices via the API", so a library default would fail at synthesis time.
     */
    ELEVENLABS_VOICE_ID: z.string().default('cgSgspJ2msm6clMCkdW9'),
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
    /* ── Twilio (real PSTN) ────────────────────────────────────────────────
     * Used when TELEPHONY_DRIVER=twilio. The account SID and auth token come
     * from the Twilio console; TWILIO_NUMBER is the voice-capable DID calls are
     * placed from and must belong to that account.
     */
    TWILIO_ACCOUNT_SID: optionalStr,
    TWILIO_AUTH_TOKEN: optionalStr,
    TWILIO_NUMBER: optionalStr,
    /**
     * Rung when the telecaller has no phoneE164 of their own.
     *
     * A convenience for a demo on one handset, not a fallback to lean on: with
     * it set, every agent's calls land on the same phone.
     */
    TWILIO_AGENT_FALLBACK_NUMBER: optionalStr,
    /**
     * Verify the X-Twilio-Signature on inbound webhooks. Only ever set false
     * for a local replay of a captured payload, where the signature cannot
     * match because the URL differs.
     */
    /**
     * API key used to SIGN browser access tokens. Not the auth token — Twilio
     * will not accept that for a Voice grant, deliberately, because a token
     * handed to a browser must be revocable without rotating account
     * credentials. Create one under Account → API keys.
     */
    TWILIO_API_KEY_SID: optionalStr,
    TWILIO_API_KEY_SECRET: optionalStr,
    TWILIO_VERIFY_SIGNATURE: z.coerce.boolean().default(true),

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
    /*
     * Strict only when Groq was asked for by name.
     *
     * `auto` must never be fatal. It is a preference about who writes marketing
     * copy, and refusing to boot the whole API over it would take down calls,
     * queues and the dashboard because somebody pasted a key and not a model —
     * which is exactly what happened while building this. Under `auto` a
     * half-configured Groq is skipped, loudly, at the point it would have run.
     */
    if (env.ENRICH_LLM === 'groq') {
      if (!env.GROQ_API_KEY) {
        ctx.addIssue({
          code: 'custom',
          path: ['GROQ_API_KEY'],
          message: 'GROQ_API_KEY is required when ENRICH_LLM=groq',
        });
      }
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
    if (env.TELEPHONY_DRIVER === 'twilio') {
      for (const key of ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_NUMBER'] as const) {
        if (!env[key]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `${key} is required when TELEPHONY_DRIVER=twilio`,
          });
        }
      }
      /*
       * PUBLIC_BASE_URL is deliberately NOT required here.
       *
       * The bridge TwiML is sent inline, so a call connects without Twilio
       * being able to reach us at all. What a public address buys is the status
       * callbacks — whether the customer actually answered — which is reporting
       * rather than function. Making it mandatory would have blocked real calls
       * on a laptop for the sake of a field in the inbox.
       */
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
