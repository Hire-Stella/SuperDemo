import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  ApiEnv,
  EscalationReason,
  PlayAudioOptions,
  TelephonyCallHandle,
  TelephonyProvider,
  TelephonySink,
} from '@superdemo/contracts';
import { NotImplementedByDriverError } from '@superdemo/contracts';
import { ENV } from '../../config/config.module';
import { PrismaService } from '../../prisma/prisma.service';
import { ElevenLabsService, type PostCallTranscription } from './elevenlabs.service';
import { LocalStorage } from '../storage/storage.module';

/**
 * ElevenLabs Agents as the carrier.
 *
 * The seam sits differently here from the other drivers. With `simulated` and
 * `browser` we push audio (or text) at the caller; with ElevenLabs *they* own
 * the media loop and pull each reply from our bridge. So:
 *
 *   answer()      — no-op; the call was already answered before we heard about it
 *   play()        — no-op; the bridge returns text over SSE and they speak it
 *   bridgeAgent() — hands the media leg to a real phone number, if one exists
 *   hangup()      — ends their conversation
 *   dial()        — outbound over an attached Twilio number
 *
 * That asymmetry is the point of having the interface: nothing above this file
 * changes when the carrier does.
 */
@Injectable()
export class ElevenLabsTelephony implements TelephonyProvider {
  readonly name = 'elevenlabs';
  readonly supportsMedia = true;
  readonly supportsOutbound = true;

  private readonly log = new Logger(ElevenLabsTelephony.name);
  private sink?: TelephonySink;

  constructor(
    private readonly service: ElevenLabsService,
    private readonly prisma: PrismaService,
    private readonly storage: LocalStorage,
    @Inject(ENV) private readonly env: ApiEnv,
  ) {}

  attachSink(sink: TelephonySink): void {
    this.sink = sink;
  }

  /* ------------------------------ provider API --------------------------- */

  async answer(providerCallId: string): Promise<TelephonyCallHandle> {
    return { providerCallId, mediaSessionId: providerCallId };
  }

  /**
   * Nothing to push. The orchestrator has already persisted the AI turn, and the
   * bridge streams the same text back to ElevenLabs, which synthesises it.
   */
  async play(providerCallId: string, opts: PlayAudioOptions): Promise<void> {
    this.log.debug(`[${providerCallId}] AI: ${opts.text.slice(0, 80)}`);
  }

  async bridgeAgent(
    providerCallId: string,
    agentUserId: string,
  ): Promise<{ mediaSessionId: string; agentToken: string | null }> {
    const transferTo = this.env.ELEVENLABS_TRANSFER_NUMBER;
    if (!transferTo) {
      // Honest degradation: the screen-pop still fires and the agent sees the
      // full context, but there is no number to move the audio to until FIT
      // contract a licensed UAE trunk.
      this.log.warn(
        `[${providerCallId}] agent ${agentUserId} assigned, but ELEVENLABS_TRANSFER_NUMBER is unset — ` +
          'no media transfer. Screen-pop and CRM sync still run.',
      );
    }
    return { mediaSessionId: providerCallId, agentToken: transferTo ?? null };
  }

  async releaseAi(providerCallId: string): Promise<void> {
    this.log.debug(`[${providerCallId}] AI leg released`);
  }

  async hold(providerCallId: string, hold: boolean): Promise<void> {
    this.log.debug(`[${providerCallId}] hold=${hold} (handled by the transfer target)`);
  }

  async hangup(providerCallId: string): Promise<void> {
    this.log.debug(`[${providerCallId}] hangup requested`);
  }

  async dial(params: { fromNumber: string; toNumber: string }): Promise<TelephonyCallHandle> {
    if (!this.env.ELEVENLABS_AGENT_ID) {
      throw new NotImplementedByDriverError('elevenlabs', 'dial() without ELEVENLABS_AGENT_ID');
    }

    const numbers = await this.service.listPhoneNumbers();
    const from = numbers.find((n) => n.phone_number === params.fromNumber) ?? numbers[0];
    if (!from) {
      // NotImplementedByDriverError, not a bare Error: the line above already
      // uses it, and DriverErrorFilter turns it into a 501 carrying this
      // sentence. A plain Error becomes a bare 500 "Internal server error",
      // which tells whoever pressed Call nothing and sends whoever debugs it
      // hunting for a crash that never happened.
      throw new NotImplementedByDriverError(
        'elevenlabs',
        'place the call',
        'no phone number is attached to the ElevenLabs workspace. Import a Twilio number, ' +
          'or connect a SIP trunk, then assign it to the agent',
      );
    }

    const result = await this.service.outboundCall({
      agentId: this.env.ELEVENLABS_AGENT_ID,
      agentPhoneNumberId: from.phone_number_id,
      toNumber: params.toNumber,
    });

    return { providerCallId: result.conversation_id, mediaSessionId: result.conversation_id };
  }

  /* --------------------------- inbound registration --------------------- */

  /**
   * Create our Call/Conversation for an inbound ElevenLabs conversation and
   * return the greeting to speak.
   */
  async registerInbound(params: {
    providerCallId: string;
    fromNumber: string;
    toNumber: string;
  }): Promise<{ callId: string; greeting: string }> {
    if (!this.sink) throw new Error('ElevenLabsTelephony has no sink attached');

    await this.sink.onInboundCall({
      providerCallId: params.providerCallId,
      fromNumber: params.fromNumber,
      toNumber: params.toNumber,
      receivedAt: new Date(),
      metadata: { provider: 'elevenlabs' },
    });

    const call = await this.prisma.call.findUniqueOrThrow({
      where: { providerCallId: params.providerCallId },
      select: { id: true, conversationId: true },
    });

    // The orchestrator already persisted the greeting (with the consent line)
    // as the first AI message; reuse it rather than composing a second one.
    const greeting = await this.prisma.message.findFirst({
      where: { conversationId: call.conversationId, role: 'AI' },
      orderBy: { createdAt: 'asc' },
      select: { text: true },
    });

    return { callId: call.id, greeting: greeting?.text ?? '' };
  }

  /* -------------------------------- turns -------------------------------- */

  /**
   * One caller utterance from ElevenLabs → one reply from our orchestrator.
   *
   * `callId` may be missing if their dynamic-variable plumbing differs from what
   * we expect, so fall back to the most recent live ElevenLabs call. That keeps a
   * demo working rather than dropping the turn, and logs loudly enough to fix.
   */
  async handleTurn(params: { callId?: string; utterance: string }): Promise<{
    reply: string;
    escalated: boolean;
    escalationReason: EscalationReason | null;
    endCall: boolean;
  }> {
    let callId = params.callId;

    if (!callId) {
      const fallback = await this.prisma.call.findFirst({
        where: { driver: 'elevenlabs', state: { in: ['AI_HANDLING', 'RINGING'] } },
        orderBy: { ringingAt: 'desc' },
        select: { id: true },
      });
      callId = fallback?.id;
      if (callId) {
        this.log.warn(
          'Custom-LLM request arrived without fit_call_id — fell back to the most recent live ' +
            'ElevenLabs call. Check the conversation-initiation webhook is returning dynamic variables.',
        );
      }
    }

    if (!callId) {
      return {
        reply:
          "Thank you for calling FIT Institute. I'm just connecting you to an advisor now.",
        escalated: false,
        escalationReason: null,
        endCall: false,
      };
    }

    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      select: { providerCallId: true },
    });
    if (!call) throw new Error(`No call ${callId}`);

    // Straight into the same path the simulated and browser drivers use — same
    // KB retrieval, same confidence floor, same escalation policy.
    const result = await this.calls().handleUtterance({
      providerCallId: call.providerCallId,
      text: params.utterance,
      startMs: 0,
      endMs: 1500,
      confidence: 0.95,
    });

    return {
      reply: result.reply,
      escalated: result.escalated,
      escalationReason: result.escalationReason,
      endCall: result.endCall,
    };
  }

  /** Escalate on demand, from their server tool. */
  async escalateNow(callId: string): Promise<{ escalated: boolean; queueName: string | null }> {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      include: { conversation: { include: { queue: true, aiSession: true } } },
    });
    if (!call) return { escalated: false, queueName: null };

    if (call.state !== 'AI_HANDLING') {
      return { escalated: false, queueName: call.conversation.queue?.name ?? null };
    }

    await this.calls().escalate({
      callId,
      reason: 'CALLER_REQUESTED',
      detail: 'Caller asked for a human; ElevenLabs invoked escalate_to_advisor.',
      skill: 'GENERAL',
    });

    const after = await this.prisma.conversation.findUnique({
      where: { id: call.conversationId },
      select: { queue: { select: { name: true } } },
    });
    return { escalated: true, queueName: after?.queue?.name ?? null };
  }

  /* ----------------------------- post-call ------------------------------- */

  async attachRecordingFromBase64(providerCallId: string, base64: string): Promise<void> {
    const call = await this.prisma.call.findUnique({
      where: { providerCallId },
      select: { id: true },
    });
    if (!call) return;

    const bytes = Buffer.from(base64, 'base64');
    const key = `recordings/${call.id}.mp3`;
    const stored = await this.storage.put(key, bytes, 'audio/mpeg');

    const settings = await this.prisma.setting.findFirst();
    const days = settings?.recordingRetentionDays ?? 365;

    await this.prisma.recording.upsert({
      where: { callId: call.id },
      create: {
        callId: call.id,
        storageKey: stored.key,
        durationMs: 0,
        mimeType: 'audio/mpeg',
        sizeBytes: stored.size,
        expiresAt: new Date(Date.now() + days * 864e5),
      },
      update: { storageKey: stored.key, sizeBytes: stored.size, mimeType: 'audio/mpeg' },
    });

    this.log.log(`attached ElevenLabs recording for call ${call.id} (${stored.size} bytes)`);
  }

  /**
   * Reconcile against their transcript.
   *
   * Ours is built per-turn through the bridge, so this only fills gaps — a turn
   * lost to a failed bridge request would otherwise be missing from the
   * transcript the client reads in Bitrix.
   */
  async reconcileFromTranscript(data: PostCallTranscription): Promise<void> {
    const call = await this.prisma.call.findUnique({
      where: { providerCallId: data.conversation_id },
      include: { segments: { select: { text: true } } },
    });
    if (!call) {
      this.log.warn(`post-call transcript for unknown conversation ${data.conversation_id}`);
      return;
    }

    const existing = new Set(call.segments.map((s) => s.text.trim()));
    const missing = data.transcript.filter((t) => t.message && !existing.has(t.message.trim()));

    if (missing.length > 0) {
      this.log.warn(
        `Filling ${missing.length} transcript turn(s) missed by the bridge on call ${call.id}`,
      );
      await this.prisma.transcriptSegment.createMany({
        data: missing.map((t) => ({
          callId: call.id,
          speaker: t.role === 'user' ? ('CALLER' as const) : ('AI_AGENT' as const),
          startMs: Math.round(t.time_in_call_secs * 1000),
          endMs: Math.round(t.time_in_call_secs * 1000) + 1500,
          text: t.message,
        })),
      });
    }

    // Their duration is authoritative — it measures real media, not our timers.
    if (data.metadata.call_duration_secs && call.state === 'COMPLETED') {
      await this.prisma.call.update({
        where: { id: call.id },
        data: { totalMs: data.metadata.call_duration_secs * 1000 },
      });
      await this.prisma.recording
        .update({
          where: { callId: call.id },
          data: { durationMs: data.metadata.call_duration_secs * 1000 },
        })
        .catch(() => undefined);
    }

    // If the call is somehow still open, close it so it leaves the live board.
    if (call.state !== 'COMPLETED' && this.sink) {
      await this.sink.onCallerHangup(data.conversation_id);
    }
  }

  /** A call that never connected — close it out with a cause. */
  async failCall(providerCallId: string): Promise<void> {
    if (!this.sink) return;
    await this.sink.onCallerHangup(providerCallId);
  }

  /* --------------------------- lazy CallsService -------------------------- */

  /**
   * CallsService depends on this driver (it attaches itself as the sink), so a
   * constructor injection here would be a cycle. Resolved lazily instead.
   */
  private callsService?: import('../../calls/calls.service').CallsService;
  setCallsService(calls: import('../../calls/calls.service').CallsService): void {
    this.callsService = calls;
  }
  private calls(): import('../../calls/calls.service').CallsService {
    if (!this.callsService) throw new Error('CallsService not wired into ElevenLabsTelephony');
    return this.callsService;
  }
}
