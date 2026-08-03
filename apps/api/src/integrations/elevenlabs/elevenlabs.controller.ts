import {
  Body,
  Controller,
  ForbiddenException,
  Headers,
  HttpCode,
  Inject,
  Logger,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import type { ApiEnv } from '@fit-ai/contracts';
import { ENV } from '../../config/config.module';
import { Public, Roles } from '../../auth/guards';
import { ElevenLabsService, type PostCallTranscription } from './elevenlabs.service';
import { ElevenLabsTelephony } from './elevenlabs.telephony';
import { PrismaService } from '../../prisma/prisma.service';

/** OpenAI chat-completions request, as ElevenLabs sends it. */
interface ChatCompletionsRequest {
  messages: { role: string; content: string }[];
  model?: string;
  stream?: boolean;
  user_id?: string;
  elevenlabs_extra_body?: Record<string, unknown>;
  tools?: unknown[];
}

/**
 * The ElevenLabs bridge.
 *
 * Four endpoints, none behind our JWT because ElevenLabs calls them. They are
 * not open, though — each is authenticated by the mechanism ElevenLabs actually
 * supports for that surface:
 *
 *   · webhooks  → `elevenlabs-signature` HMAC, with a replay window
 *   · bridge    → `Authorization: Bearer <ELEVENLABS_BRIDGE_SECRET>`
 *   · tool call → the same bearer secret
 *
 * The bridge and the tool are consequential — one runs our orchestrator, the
 * other can force an escalation — so leaving them unauthenticated would let
 * anyone who learned a call id drive the platform.
 *
 *   POST /elevenlabs/llm/v1/chat/completions   the brain: our orchestrator,
 *                                             streamed back as OpenAI SSE
 *   POST /elevenlabs/tools/escalate            server tool: run real escalation
 *   POST /elevenlabs/webhooks/post-call        transcript + audio ingest
 *
 * Why a bridge rather than letting ElevenLabs own the conversation: everything
 * that makes this platform worth paying for lives on our side — the FIT
 * knowledge base, the IDF-calibrated confidence floor, the escalation policy
 * FIT's admin can tune, the screen-pop context, the Bitrix timeline. ElevenLabs
 * is excellent at the part we don't want to build: real telephony, low-latency
 * speech, turn-taking and barge-in.
 */
@Controller('elevenlabs')
export class ElevenLabsController {
  private readonly log = new Logger(ElevenLabsController.name);

  constructor(
    private readonly service: ElevenLabsService,
    private readonly telephony: ElevenLabsTelephony,
    private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: ApiEnv,
  ) {}

  /**
   * Bearer check for the two endpoints ElevenLabs does not sign.
   *
   * Constant-time compare: a length-or-prefix leak here would let the secret be
   * recovered a byte at a time.
   */
  private assertBridgeSecret(auth: string | undefined): void {
    const expected = this.env.ELEVENLABS_BRIDGE_SECRET;
    if (!expected) {
      throw new ForbiddenException(
        'ELEVENLABS_BRIDGE_SECRET is not configured — refusing to serve an unauthenticated bridge',
      );
    }
    const provided = auth?.replace(/^Bearer\s+/i, '') ?? '';
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(provided, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new ForbiddenException('Invalid bridge credentials');
    }
  }

  /* ===================== conversation initiation ========================= */

  /**
   * Called by ElevenLabs when an inbound call arrives, before the first turn.
   *
   * We create the Call row here and hand back `fit_call_id` as a dynamic
   * variable, which then rides along in `elevenlabs_extra_body` on every
   * custom-LLM request — that is what ties their conversation to our call.
   *
   * NOTE: this response shape follows their documented dynamic-variables
   * mechanism but could not be verified end to end without an account. The
   * bridge below therefore also accepts the id from several other places, so a
   * shape mismatch degrades to "still works" rather than "breaks".
   */
  @Public()
  @Post('webhooks/conversation-init')
  @HttpCode(200)
  async conversationInit(
    @Req() req: Request,
    @Headers('elevenlabs-signature') signature: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    this.assertSignature(req, signature);

    const callerNumber =
      (body.caller_id as string | undefined) ??
      ((body.call as Record<string, unknown> | undefined)?.from as string | undefined) ??
      'unknown';
    const agentNumber =
      (body.called_number as string | undefined) ??
      ((body.call as Record<string, unknown> | undefined)?.to as string | undefined) ??
      (await this.defaultNumber());
    const conversationId = (body.conversation_id as string | undefined) ?? `el-${randomUUID()}`;

    const { callId, greeting } = await this.telephony.registerInbound({
      providerCallId: conversationId,
      fromNumber: callerNumber,
      toNumber: agentNumber,
    });

    this.log.log(`inbound ElevenLabs conversation ${conversationId} → call ${callId}`);

    return {
      type: 'conversation_initiation_client_data',
      dynamic_variables: {
        fit_call_id: callId,
        fit_conversation_id: conversationId,
      },
      conversation_config_override: {
        agent: { first_message: greeting },
      },
    };
  }

  /* ================================ setup ================================ */

  /**
   * One-call bootstrap: create the ElevenLabs Agent wired to our bridge.
   *
   * Returns the agent id to paste into `ELEVENLABS_AGENT_ID`. Separate from
   * normal operation on purpose — an agent is a persistent resource, and
   * creating one per boot would leave orphans accumulating in the workspace.
   */
  @Roles('ADMIN')
  @Post('setup/agent')
  @HttpCode(201)
  async setupAgent() {
    if (!this.env.ELEVENLABS_API_KEY) {
      throw new ForbiddenException('ELEVENLABS_API_KEY is not configured');
    }
    if (!this.env.PUBLIC_BASE_URL) {
      throw new ForbiddenException(
        'PUBLIC_BASE_URL must be a public HTTPS origin — ElevenLabs cannot reach localhost. ' +
          'Use a tunnel (cloudflared tunnel --url http://localhost:3101) or deploy first.',
      );
    }

    const aiAgent = await this.prisma.aiAgent.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    const created = await this.service.createAgent({
      name: 'FIT Institute — admissions voice line',
      firstMessage: aiAgent?.greeting ?? 'Thank you for calling FIT Institute.',
      publicBaseUrl: this.env.PUBLIC_BASE_URL,
    });

    return {
      agentId: created.agent_id,
      next: [
        `Set ELEVENLABS_AGENT_ID=${created.agent_id} in .env and restart the API.`,
        'In the ElevenLabs dashboard, store ELEVENLABS_BRIDGE_SECRET as a workspace secret ' +
          'named FIT_BRIDGE_SECRET (the agent references it for the bridge and the escalate tool).',
        `Point the post-call webhook at ${this.env.PUBLIC_BASE_URL}/api/elevenlabs/webhooks/post-call ` +
          'and use ELEVENLABS_WEBHOOK_SECRET as its signing secret.',
        'For a dialable phone line, import a Twilio number or connect a SIP trunk. ' +
          'Browser calls work without either.',
      ],
    };
  }

  /* ========================= browser voice session ======================== */

  /**
   * Start a browser voice call.
   *
   * Creates our Call row first, then mints a WebRTC token, and hands both back.
   * The browser passes `fit_call_id` as a dynamic variable when it opens the
   * session, so every bridge turn is tied to the right call — which keeps the
   * unverified conversation-init webhook off the critical path for a demo.
   *
   * Authenticated with the normal session JWT: a staff member starts this from
   * the dashboard, so there is no reason to expose it publicly.
   */
  @Post('browser/start')
  @HttpCode(201)
  async startBrowserVoiceCall(
    @Body() body: { callerName?: string; fromNumber?: string; toNumber?: string },
  ) {
    if (!this.env.ELEVENLABS_AGENT_ID) {
      throw new ForbiddenException(
        'ELEVENLABS_AGENT_ID is not configured — create an agent first (see README).',
      );
    }

    const { callId, greeting } = await this.telephony.registerInbound({
      providerCallId: `elweb-${randomUUID()}`,
      fromNumber: body.fromNumber ?? '+971500000000',
      toNumber: body.toNumber ?? (await this.defaultNumber()),
    });

    const { token } = await this.service.getWebRtcToken(this.env.ELEVENLABS_AGENT_ID);

    return {
      callId,
      conversationToken: token,
      agentId: this.env.ELEVENLABS_AGENT_ID,
      greeting,
      // The browser must send this back as a dynamic variable, or the bridge
      // cannot tell which call a turn belongs to.
      dynamicVariables: { fit_call_id: callId },
    };
  }

  /* ========================= the custom-LLM bridge ======================== */

  /**
   * OpenAI-compatible chat completions, backed by our orchestrator.
   *
   * ElevenLabs sends the whole message history each turn and expects SSE. Our
   * orchestrator produces a complete reply rather than a token stream, so the
   * reply is chunked by sentence before being emitted: ElevenLabs begins
   * synthesising the first sentence while the rest is still arriving, which is
   * worth ~200-400ms of perceived latency on a phone call.
   */
  @Public()
  @Post('llm/v1/chat/completions')
  @HttpCode(200)
  async chatCompletions(
    @Headers('authorization') auth: string | undefined,
    @Body() body: ChatCompletionsRequest,
    @Res() res: Response,
  ): Promise<void> {
    this.assertBridgeSecret(auth);

    const extra = body?.elevenlabs_extra_body ?? {};
    const callId =
      (extra.fit_call_id as string | undefined) ??
      (extra.call_id as string | undefined) ??
      body?.user_id ??
      undefined;

    // The caller's latest utterance is the last user-role message.
    const utterance =
      [...(body?.messages ?? [])].reverse().find((m) => m.role === 'user')?.content ?? '';

    res.setHeader('content-type', 'text/event-stream');
    res.setHeader('cache-control', 'no-cache');
    res.setHeader('connection', 'keep-alive');
    res.flushHeaders?.();

    const id = `chatcmpl-${randomUUID()}`;
    const model = body?.model ?? 'fit-ai-orchestrator';

    const send = (delta: Record<string, unknown>, finish: string | null = null) => {
      res.write(
        `data: ${JSON.stringify({
          id,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model,
          choices: [{ delta, index: 0, finish_reason: finish }],
        })}\n\n`,
      );
    };

    try {
      const result = await this.telephony.handleTurn({ callId, utterance });

      // Sentence-chunked so synthesis can start before the reply is complete.
      for (const piece of splitForSpeech(result.reply)) {
        send({ content: piece });
      }

      if (result.escalated) {
        // Ask ElevenLabs to transfer the media leg. Our side has already run the
        // real escalation — queue selection and the agent screen-pop — so the
        // agent is already looking at the caller's context.
        const transferTo = this.env.ELEVENLABS_TRANSFER_NUMBER;
        if (transferTo) {
          send({
            tool_calls: [
              {
                index: 0,
                id: `call_${randomUUID()}`,
                type: 'function',
                function: {
                  name: 'transfer_to_number',
                  arguments: JSON.stringify({
                    number: transferTo,
                    reason: result.escalationReason ?? 'caller requested a human',
                  }),
                },
              },
            ],
          });
          send({}, 'tool_calls');
        } else {
          // No agent number yet (no licensed UAE trunk). The caller has been
          // told an advisor is coming and the screen-pop has fired; ending
          // cleanly beats leaving them on a line nobody will pick up.
          send({}, 'stop');
        }
      } else if (result.endCall) {
        send({
          tool_calls: [
            {
              index: 0,
              id: `call_${randomUUID()}`,
              type: 'function',
              function: { name: 'end_call', arguments: '{}' },
            },
          ],
        });
        send({}, 'tool_calls');
      } else {
        send({}, 'stop');
      }
    } catch (error) {
      this.log.error(`bridge turn failed: ${String(error)}`);
      // Never leave a live caller in silence — say something and hand off.
      send({
        content:
          "I'm sorry, I'm having trouble just now. Let me pass you to one of our admissions advisors.",
      });
      send({}, 'stop');
    } finally {
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }

  /* ============================ server tools ============================= */

  /**
   * `escalate_to_advisor`. ElevenLabs can call this directly when the caller
   * asks for a person, which is faster than waiting for the next LLM turn.
   * Idempotent: escalating an already-escalated call is a no-op.
   */
  @Public()
  @Post('tools/escalate')
  @HttpCode(200)
  async escalateTool(
    @Headers('authorization') auth: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    this.assertBridgeSecret(auth);

    const callId =
      (body.fit_call_id as string | undefined) ?? (body.call_id as string | undefined);
    if (!callId) return { success: false, message: 'No call id supplied' };

    const outcome = await this.telephony.escalateNow(callId);
    return {
      success: outcome.escalated,
      message: outcome.escalated
        ? `Transferring to ${outcome.queueName ?? 'an advisor'}.`
        : 'This call has already been handed to an advisor.',
      transfer_number: this.env.ELEVENLABS_TRANSFER_NUMBER ?? null,
    };
  }

  /* ============================== webhooks =============================== */

  /**
   * Post-call: transcript, summary and audio.
   *
   * Our own transcript is already built turn-by-turn through the bridge, so this
   * exists to (a) attach the recording, and (b) reconcile — if a turn was lost
   * because a bridge request failed, ElevenLabs' transcript is authoritative.
   */
  @Public()
  @Post('webhooks/post-call')
  @HttpCode(200)
  async postCall(
    @Req() req: Request,
    @Headers('elevenlabs-signature') signature: string | undefined,
    @Body() body: { type?: string; data?: PostCallTranscription & { full_audio?: string } },
  ) {
    this.assertSignature(req, signature);

    const type = body.type;
    const data = body.data;
    if (!data) return { received: true };

    // Dedupe: they retry, and a replayed transcript must not double-write.
    const dedupeKey = `elevenlabs:${type}:${data.conversation_id}`;
    const seen = await this.prisma.processedWebhook.findUnique({ where: { id: dedupeKey } });
    if (seen) return { received: true, duplicate: true };
    await this.prisma.processedWebhook.create({
      data: { id: dedupeKey, source: 'elevenlabs' },
    });

    if (type === 'post_call_audio' && data.full_audio) {
      await this.telephony.attachRecordingFromBase64(data.conversation_id, data.full_audio);
      return { received: true };
    }

    if (type === 'post_call_transcription') {
      await this.telephony.reconcileFromTranscript(data);
      return { received: true };
    }

    // Call-initiation failures: the call never connected, so close it out with a
    // cause rather than leaving a phantom ringing call on the live board.
    this.log.warn(`ElevenLabs webhook "${type}" for ${data.conversation_id}`);
    await this.telephony.failCall(data.conversation_id).catch(() => undefined);
    return { received: true };
  }

  /* ------------------------------- helpers ------------------------------- */

  private assertSignature(req: Request, signature: string | undefined): void {
    // Populated by `rawBody: true` on NestFactory.create. Without the exact
    // bytes the HMAC cannot be recomputed, so refuse rather than guess.
    const raw = (req as Request & { rawBody?: Buffer | string }).rawBody;
    if (raw === undefined) {
      throw new ForbiddenException('Raw body unavailable — cannot verify webhook signature');
    }
    const rawString = typeof raw === 'string' ? raw : raw.toString('utf8');
    if (!this.service.verifyWebhook(rawString, signature)) {
      throw new ForbiddenException('Invalid ElevenLabs webhook signature');
    }
  }

  private async defaultNumber(): Promise<string> {
    const n = await this.prisma.phoneNumber.findFirst({
      where: { status: 'ASSIGNED' },
      orderBy: { createdAt: 'asc' },
      select: { e164: true },
    });
    return n?.e164 ?? '+971528876388';
  }
}

/**
 * Split a reply into speakable chunks.
 *
 * Sentence boundaries, with very short fragments merged forward — "Yes." on its
 * own makes the synthesiser clip and sound abrupt.
 */
export function splitForSpeech(text: string, minChars = 24): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+\s*|[^.!?]+$/g) ?? [text];
  const out: string[] = [];
  for (const s of sentences) {
    const last = out[out.length - 1];
    if (last !== undefined && last.length < minChars) out[out.length - 1] = last + s;
    else out.push(s);
  }
  return out.filter((s) => s.trim().length > 0);
}
