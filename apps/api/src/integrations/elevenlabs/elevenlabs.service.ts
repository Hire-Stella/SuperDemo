import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { ApiEnv } from '@fit-ai/contracts';
import { ENV } from '../../config/config.module';

const API = 'https://api.elevenlabs.io';

export interface ElevenLabsTranscriptTurn {
  role: 'agent' | 'user';
  message: string;
  time_in_call_secs: number;
}

export interface PostCallTranscription {
  agent_id: string;
  conversation_id: string;
  user_id?: string | null;
  metadata: {
    start_time_unix_secs: number;
    call_duration_secs: number;
    phone_call?: {
      direction?: 'inbound' | 'outbound';
      external_number?: string;
      agent_number?: string;
      call_sid?: string;
    };
  };
  transcript: ElevenLabsTranscriptTurn[];
  analysis?: {
    call_successful?: string;
    transcript_summary?: string;
  };
  conversation_initiation_client_data?: {
    dynamic_variables?: Record<string, string>;
  };
}

/**
 * ElevenLabs Agents client.
 *
 * Scope of this integration: ElevenLabs owns the *media* loop — telephony,
 * speech-to-text, turn-taking, barge-in, and speech synthesis. It does not own
 * the conversation. Our API is the brain, reached through an OpenAI-compatible
 * custom-LLM endpoint, so the knowledge-base grounding, the calibrated
 * confidence floor, the escalation policy and the CRM sync all stay here where
 * FIT's admin can tune them.
 *
 * Verified against their docs: the custom-LLM contract (`/v1/chat/completions`,
 * SSE) and the post-call webhook payload + `elevenlabs-signature` header.
 * The conversation-initiation webhook response shape is implemented defensively
 * — see the controller — because it wasn't verifiable without an account.
 */
@Injectable()
export class ElevenLabsService {
  private readonly log = new Logger(ElevenLabsService.name);

  constructor(@Inject(ENV) private readonly env: ApiEnv) {}

  get configured(): boolean {
    return Boolean(this.env.ELEVENLABS_API_KEY);
  }

  private async call<T>(
    path: string,
    init: { method?: string; body?: unknown } = {},
  ): Promise<T> {
    if (!this.env.ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const res = await fetch(`${API}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        'xi-api-key': this.env.ELEVENLABS_API_KEY,
        ...(init.body ? { 'content-type': 'application/json' } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(20_000),
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`ElevenLabs ${init.method ?? 'GET'} ${path} → ${res.status}: ${text.slice(0, 300)}`);
    }
    return (text ? JSON.parse(text) : {}) as T;
  }

  /* --------------------------- webhook verification ---------------------- */

  /**
   * Verify the `elevenlabs-signature` header.
   *
   * Format is Stripe-style: `t=<unix>,v0=<hex hmac>` where the signed payload is
   * `<t>.<raw body>`. Both the timestamp window and the digest are checked —
   * a valid-but-old signature is a replay, so age alone must not pass.
   */
  verifyWebhook(rawBody: string, signatureHeader: string | undefined, toleranceSecs = 1800): boolean {
    const secret = this.env.ELEVENLABS_WEBHOOK_SECRET;
    if (!secret) {
      this.log.warn('ELEVENLABS_WEBHOOK_SECRET not set — rejecting webhook rather than trusting it');
      return false;
    }
    if (!signatureHeader) return false;

    const parts = signatureHeader.split(',').reduce<Record<string, string>>((acc, part) => {
      const [k, v] = part.split('=');
      if (k && v) acc[k.trim()] = v.trim();
      return acc;
    }, {});

    const timestamp = parts.t;
    const provided = parts.v0;
    if (!timestamp || !provided) return false;

    const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
    if (!Number.isFinite(age) || age > toleranceSecs) {
      this.log.warn(`Rejected ElevenLabs webhook: timestamp ${age}s outside tolerance`);
      return false;
    }

    const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(provided, 'utf8');
    return a.length === b.length && timingSafeEqual(a, b);
  }

  /* ------------------------------- agents -------------------------------- */

  /**
   * Create the Agent that owns the voice loop.
   *
   * Only needed to bootstrap a workspace from nothing. If the Agent already
   * exists — set `ELEVENLABS_AGENT_ID` and configure it in the ElevenLabs
   * dashboard — do not call this: it creates a *second* Agent rather than
   * updating the first.
   *
   * Split of ownership:
   *   dashboard → voice, greeting, turn-taking, barge-in, language
   *   here      → the custom-LLM bridge and the escalate tool, i.e. the brain
   *
   * Deliberately thin on prompt/knowledge: those live on our side. The Agent's
   * only job is media plus routing every turn to our bridge.
   */
  async createAgent(params: {
    name: string;
    firstMessage: string;
    publicBaseUrl: string;
  }): Promise<{ agent_id: string }> {
    return this.call<{ agent_id: string }>('/v1/convai/agents/create', {
      method: 'POST',
      body: {
        name: params.name,
        conversation_config: {
          agent: {
            first_message: params.firstMessage,
            // The prompt is intentionally minimal — our bridge decides every
            // reply, so a second prompt here would only be a source of drift.
            prompt: {
              prompt:
                'You are a telephony voice layer. Every reply is produced by the ' +
                'connected custom LLM. Do not invent content.',
              llm: 'custom-llm',
              custom_llm: {
                url: `${params.publicBaseUrl}/api/elevenlabs/llm`,
                model_id: 'fit-ai-orchestrator',
                api_key: { secret_id: 'FIT_BRIDGE_SECRET' },
              },
              tools: [
                {
                  type: 'webhook',
                  name: 'escalate_to_advisor',
                  description:
                    'Hand the caller to a human admissions advisor. Call this the moment the ' +
                    'caller asks for a person, or when told to escalate.',
                  api_schema: {
                    url: `${params.publicBaseUrl}/api/elevenlabs/tools/escalate`,
                    method: 'POST',
                    request_headers: {
                      Authorization: { secret_id: 'FIT_BRIDGE_SECRET' },
                    },
                  },
                },
              ],
            },
            language: 'en',
          },
          // No `tts` block on purpose. Voice, model and turn-taking are owned
          // by the ElevenLabs dashboard, so they are configured in exactly one
          // place. Sending them from here would silently overwrite whatever
          // was chosen there on the next setup call.
        },
        platform_settings: {
          workspace_overrides: {
            webhooks: {
              post_call_webhook_id: null,
            },
          },
        },
      },
    });
  }

  async getAgent(agentId: string): Promise<unknown> {
    return this.call(`/v1/convai/agents/${agentId}`);
  }

  /* ------------------------------- calls --------------------------------- */

  /** Outbound call over a Twilio number attached to the Agent. */
  async outboundCall(params: {
    agentId: string;
    agentPhoneNumberId: string;
    toNumber: string;
    dynamicVariables?: Record<string, string>;
  }): Promise<{ conversation_id: string; callSid?: string }> {
    return this.call('/v1/convai/twilio/outbound-call', {
      method: 'POST',
      body: {
        agent_id: params.agentId,
        agent_phone_number_id: params.agentPhoneNumberId,
        to_number: params.toNumber,
        conversation_initiation_client_data: params.dynamicVariables
          ? { dynamic_variables: params.dynamicVariables }
          : undefined,
      },
    });
  }

  /** Phone numbers attached to the workspace (Twilio imports and SIP trunks). */
  async listPhoneNumbers(): Promise<{ phone_number_id: string; phone_number: string; label?: string }[]> {
    return this.call('/v1/convai/phone-numbers');
  }

  async getConversation(conversationId: string): Promise<PostCallTranscription> {
    return this.call(`/v1/convai/conversations/${conversationId}`);
  }

  /** Recorded audio for a finished conversation, as MP3 bytes. */
  async getConversationAudio(conversationId: string): Promise<Buffer | null> {
    if (!this.env.ELEVENLABS_API_KEY) return null;
    const res = await fetch(`${API}/v1/convai/conversations/${conversationId}/audio`, {
      headers: { 'xi-api-key': this.env.ELEVENLABS_API_KEY },
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) {
      this.log.warn(`No audio for conversation ${conversationId} (${res.status})`);
      return null;
    }
    return Buffer.from(await res.arrayBuffer());
  }

  /* ---------------------------- browser sessions -------------------------- */

  /**
   * Mint a short-lived WebRTC conversation token for a browser session.
   *
   * This is the no-carrier path: the caller's browser talks to the ElevenLabs
   * agent directly over WebRTC — real STT, real turn-taking, real barge-in, real
   * voice — with our bridge still deciding every reply. The API key stays on the
   * server; the browser only ever sees the token.
   *
   * Tokens are single-use and expire quickly, so one is minted per call.
   */
  async getWebRtcToken(agentId: string): Promise<{ token: string }> {
    return this.call<{ token: string }>(
      `/v1/convai/conversation/token?agent_id=${encodeURIComponent(agentId)}`,
    );
  }

  /* -------------------------------- TTS ---------------------------------- */

  /**
   * One-shot synthesis, used by the `elevenlabs` TTS driver for the browser call
   * path — so a browser demo can have a real voice without the full Agents
   * telephony stack.
   */
  async synthesise(text: string, voiceId?: string): Promise<{ audio: Buffer; mimeType: string }> {
    if (!this.env.ELEVENLABS_API_KEY) throw new Error('ELEVENLABS_API_KEY is not configured');

    const voice = voiceId || this.env.ELEVENLABS_VOICE_ID;
    const res = await fetch(`${API}/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.env.ELEVENLABS_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: this.env.ELEVENLABS_MODEL_ID,
        voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: 1.05 },
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      throw new Error(`ElevenLabs TTS failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
    }
    return { audio: Buffer.from(await res.arrayBuffer()), mimeType: 'audio/mpeg' };
  }
}
