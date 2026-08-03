import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleInit,
} from '@nestjs/common';
import {
  canTransition,
  type ApiEnv,
  type CallState,
  type ConversationTurn,
  type Disposition,
  type EscalationReason,
  type HangupCause,
  type InboundCallEvent,
  type ScreenPopPayload,
  type TelephonyProvider,
  type TelephonySink,
} from '@fit-ai/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { PresenceService } from '../presence/presence.service';
import { RoutingService } from './routing.service';
import { AiOrchestrator } from './ai-orchestrator.service';
import { ENV } from '../config/config.module';
import { TELEPHONY_PROVIDER } from '../integrations/telephony/telephony.module';
import { SimulatedTelephony } from '../integrations/telephony/simulated.telephony';
import { BrowserTelephony } from '../integrations/telephony/browser.telephony';
import { ElevenLabsTelephony } from '../integrations/elevenlabs/elevenlabs.telephony';
import { OutboxService } from '../outbox/outbox.service';

/**
 * The call engine. Owns the state machine and is the sink for every telephony
 * driver.
 *
 * Two invariants hold the rest of the system together:
 *
 *  1. **State transitions are guarded.** `transition()` refuses anything not in
 *     CALL_TRANSITIONS, so an impossible state never reaches the analytics
 *     tables. Bugs surface as loud errors instead of quietly wrong dashboards.
 *
 *  2. **Timings are derived once, at completion.** queueWaitMs, aiTalkMs,
 *     agentTalkMs and wrapMs are written when the call ends and never
 *     recomputed, so a report run tomorrow gives the same numbers as today.
 */
@Injectable()
export class CallsService implements TelephonySink, OnModuleInit {
  private readonly log = new Logger(CallsService.name);

  /** Agents already offered a given call — never re-offer to the same person. */
  private readonly offered = new Map<string, Set<string>>();
  /** Ring timeout timers, so an unanswered offer moves on. */
  private readonly ringTimers = new Map<string, NodeJS.Timeout>();
  /** Wrap-up timers, so an agent returns to available automatically. */
  private readonly wrapTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
    private readonly presence: PresenceService,
    private readonly routing: RoutingService,
    private readonly ai: AiOrchestrator,
    private readonly outbox: OutboxService,
    private readonly simulated: SimulatedTelephony,
    private readonly browser: BrowserTelephony,
    private readonly elevenlabs: ElevenLabsTelephony,
    @Inject(TELEPHONY_PROVIDER) private readonly telephony: TelephonyProvider,
    @Inject(ENV) private readonly env: ApiEnv,
  ) {}

  onModuleInit(): void {
    // Both mock drivers deliver events into this service regardless of which is
    // the configured default, so a demo can run scripted traffic and a live
    // browser call at the same time.
    this.simulated.attachSink(this);
    this.browser.attachSink(this);
    this.elevenlabs.attachSink(this);
    // The ElevenLabs driver needs to call back into this service, but this
    // service already depends on it — hand the reference over here rather than
    // creating a constructor cycle.
    this.elevenlabs.setCallsService(this);
  }

  /* ==================== state machine ==================== */

  /**
   * Guarded transition. Every state change in the system goes through here.
   */
  private async transition(
    callId: string,
    to: CallState,
    data: Record<string, unknown> = {},
  ): Promise<{ from: CallState; conversationId: string }> {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      select: { state: true, conversationId: true },
    });
    if (!call) throw new NotFoundException(`Call ${callId} not found`);

    if (call.state === to) {
      return { from: call.state, conversationId: call.conversationId };
    }

    if (!canTransition(call.state, to)) {
      throw new BadRequestException(
        `Illegal call transition ${call.state} → ${to} for call ${callId}`,
      );
    }

    await this.prisma.call.update({ where: { id: callId }, data: { state: to, ...data } });

    const payload = {
      callId,
      conversationId: call.conversationId,
      from: call.state,
      to,
      at: new Date().toISOString(),
    };
    this.realtime.toSupervisors('call.state_changed', payload);
    this.realtime.toCall(callId, 'call.state_changed', payload);

    return { from: call.state, conversationId: call.conversationId };
  }

  /* ==================== inbound ==================== */

  async onInboundCall(event: InboundCallEvent): Promise<void> {
    // Idempotency: the unique constraint on providerCallId is the real guard,
    // but checking first avoids noisy error logs on redelivery.
    const existing = await this.prisma.call.findUnique({
      where: { providerCallId: event.providerCallId },
      select: { id: true },
    });
    if (existing) {
      this.log.debug(`Duplicate inbound event for ${event.providerCallId} — ignoring`);
      return;
    }

    const number = await this.prisma.phoneNumber.findUnique({
      where: { e164: event.toNumber },
      include: { aiAgent: true, inboundQueue: true },
    });

    const aiAgent =
      number?.aiAgent ??
      (await this.prisma.aiAgent.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } }));

    if (!aiAgent) {
      this.log.error('No active AI agent configured — cannot answer calls');
      return;
    }

    const contact = await this.upsertContact(event.fromNumber, event.callerName);

    const conversation = await this.prisma.conversation.create({
      data: {
        channel: 'VOICE',
        direction: 'INBOUND',
        status: 'ACTIVE',
        contactId: contact.id,
        startedAt: event.receivedAt,
        call: {
          create: {
            providerCallId: event.providerCallId,
            driver: this.telephony.name,
            fromNumber: event.fromNumber,
            toNumber: event.toNumber,
            state: 'RINGING',
            ringingAt: event.receivedAt,
          },
        },
        aiSession: {
          create: {
            aiAgentId: aiAgent.id,
            driverStt: this.ai.driverNames().stt,
            driverLlm: this.ai.driverNames().llm,
            driverTts: this.ai.driverNames().tts,
          },
        },
      },
      include: { call: true },
    });

    const call = conversation.call!;
    await this.prisma.callParticipant.create({
      data: { callId: call.id, kind: 'CALLER', joinedAt: event.receivedAt },
    });

    this.realtime.toSupervisors('call.ringing', {
      callId: call.id,
      conversationId: conversation.id,
      state: 'RINGING',
      fromNumber: event.fromNumber,
      contactName: contact.name,
      queueName: null,
      agentName: null,
      startedAt: event.receivedAt,
      elapsedMs: 0,
      lastUtterance: null,
      detectedIntent: null,
    });

    await this.answerWithAi(call.id, aiAgent.id);
  }

  private async answerWithAi(callId: string, aiAgentId: string): Promise<void> {
    const call = await this.prisma.call.findUniqueOrThrow({ where: { id: callId } });

    await this.telephony.answer(call.providerCallId);
    const { conversationId } = await this.transition(callId, 'AI_HANDLING', {
      aiAnsweredAt: new Date(),
    });

    await this.prisma.callParticipant.create({
      data: { callId, kind: 'AI_AGENT', joinedAt: new Date() },
    });

    const agent = await this.prisma.aiAgent.findUniqueOrThrow({ where: { id: aiAgentId } });

    // Consent first where required — Dubai, India and Egypt all expect it, and
    // it must be on the recording itself, not just in a policy document.
    const consent = await this.ai.consentAnnouncement();
    const greeting = consent ? `${consent} ${agent.greeting}` : agent.greeting;

    await this.speak(callId, conversationId, greeting, 0);
    this.realtime.toSupervisors('call.ai_answered', { callId, conversationId });
  }

  /* ==================== the AI turn loop ==================== */

  /**
   * A caller utterance arrived. Persist it, run the AI turn, persist the reply,
   * and escalate if the policy says so.
   *
   * Returns the reply so the browser driver can put it straight in the HTTP
   * response (the caller's tab then speaks it).
   */
  async onCallerUtterance(params: {
    providerCallId: string;
    text: string;
    startMs: number;
    endMs: number;
    confidence?: number;
  }): Promise<void> {
    await this.handleUtterance(params);
  }

  async handleUtterance(params: {
    providerCallId: string;
    text: string;
    startMs: number;
    endMs: number;
    confidence?: number;
  }): Promise<{
    reply: string;
    escalated: boolean;
    escalationReason: EscalationReason | null;
    endCall: boolean;
    citations: string[];
    latencyMs: number;
    turn: number;
  }> {
    const call = await this.prisma.call.findUnique({
      where: { providerCallId: params.providerCallId },
      include: { conversation: { include: { aiSession: true } } },
    });
    if (!call) throw new NotFoundException(`No call for provider id ${params.providerCallId}`);

    // Once a human has the call the AI is out of the loop; the utterance is
    // still recorded so the transcript stays complete.
    if (call.state !== 'AI_HANDLING') {
      await this.recordMessage(call.conversationId, 'CALLER', params.text, params.startMs, params.confidence);
      await this.recordSegment(call.id, 'CALLER', params);
      return {
        reply: '',
        escalated: false,
        escalationReason: null,
        endCall: false,
        citations: [],
        latencyMs: 0,
        turn: 0,
      };
    }

    const session = call.conversation.aiSession;
    if (!session) throw new Error(`Call ${call.id} has no AI session`);

    await this.recordMessage(call.conversationId, 'CALLER', params.text, params.startMs, params.confidence);
    await this.recordSegment(call.id, 'CALLER', params);

    this.realtime.toCall(call.id, 'transcript.partial', {
      callId: call.id,
      speaker: 'CALLER',
      text: params.text,
    });

    const history = await this.conversationHistory(call.conversationId);
    const result = await this.ai.runTurn({
      conversationId: call.conversationId,
      aiAgentId: session.aiAgentId,
      utterance: params.text,
      history,
      topicHint: session.courseOfInterest,
    });

    // Running averages so the AI-latency panel is meaningful.
    const prevTurns = session.turns;
    const avgLatency = Math.round(
      ((session.avgLatencyMs ?? 0) * prevTurns + result.latencyMs) / (prevTurns + 1),
    );

    await this.prisma.aiSession.update({
      where: { id: session.id },
      data: {
        turns: { increment: 1 },
        detectedIntent: result.brain.detectedIntent ?? session.detectedIntent,
        courseOfInterest: session.courseOfInterest ?? result.brain.courseOfInterest,
        sentiment: result.brain.sentiment,
        avgLatencyMs: avgLatency,
        inputTokens: { increment: result.brain.usage?.inputTokens ?? 0 },
        outputTokens: { increment: result.brain.usage?.outputTokens ?? 0 },
        costUsd: result.brain.usage
          ? { increment: result.brain.usage.costUsd }
          : undefined,
      },
    });

    if (result.brain.courseOfInterest) {
      await this.prisma.contact
        .update({
          where: { id: call.conversation.contactId! },
          data: { courseInterest: result.brain.courseOfInterest },
        })
        .catch(() => undefined);
    }

    await this.speak(call.id, call.conversationId, result.reply, params.endMs);

    if (result.escalation.escalate) {
      await this.escalate({
        callId: call.id,
        reason: result.escalation.reason!,
        detail: result.escalation.detail,
        skill: this.routing.skillForIntent(result.brain.detectedIntent, result.retrievedCategory),
      });
      return {
        reply: result.reply,
        escalated: true,
        escalationReason: result.escalation.reason,
        endCall: false,
        citations: result.brain.citations,
        latencyMs: result.latencyMs,
        turn: result.turn,
      };
    }

    if (result.brain.resolved) {
      await this.complete(call.id, 'AI_RESOLVED');
      return {
        reply: result.reply,
        escalated: false,
        escalationReason: null,
        endCall: true,
        citations: result.brain.citations,
        latencyMs: result.latencyMs,
        turn: result.turn,
      };
    }

    return {
      reply: result.reply,
      escalated: false,
      escalationReason: null,
      endCall: false,
      citations: result.brain.citations,
      latencyMs: result.latencyMs,
      turn: result.turn,
    };
  }

  private async speak(
    callId: string,
    conversationId: string,
    text: string,
    atMs: number,
  ): Promise<void> {
    const call = await this.prisma.call.findUniqueOrThrow({
      where: { id: callId },
      select: { providerCallId: true },
    });

    await this.recordMessage(conversationId, 'AI', text, atMs);
    await this.recordSegment(callId, 'AI_AGENT', {
      text,
      startMs: atMs,
      endMs: atMs + Math.max(1200, (text.split(/\s+/).length / 150) * 60_000),
    });

    await this.telephony.play(call.providerCallId, { text, allowBargeIn: true });
  }

  /* ==================== escalation ==================== */

  /**
   * Hand off to a human, carrying the AI's understanding with it.
   *
   * This is the feature that justifies the platform: the agent who picks up
   * already knows who is calling, what they asked, which course they mean, and
   * why the AI stepped back — before they say hello.
   */
  async escalate(params: {
    callId: string;
    reason: EscalationReason;
    detail: string | null;
    skill: import('@fit-ai/contracts').Skill;
    targetQueueId?: string;
  }): Promise<void> {
    const call = await this.prisma.call.findUniqueOrThrow({
      where: { id: params.callId },
      include: { conversation: { include: { aiSession: true } } },
    });

    await this.transition(params.callId, 'ESCALATING', {
      escalatedAt: new Date(),
      escalationReason: params.reason,
    });

    const queue = params.targetQueueId
      ? await this.prisma.queue.findUnique({
          where: { id: params.targetQueueId },
          select: { id: true, name: true, slaSeconds: true },
        })
      : await this.routing.queueForSkill(params.skill);

    if (!queue) {
      this.log.error(`No queue available for skill ${params.skill} — completing call`);
      await this.complete(params.callId, 'NO_AGENT_AVAILABLE');
      return;
    }

    // Generate the summary now so it is ready the instant an agent is offered
    // the call, rather than making them wait for it after they answer.
    const history = await this.conversationHistory(call.conversationId);
    const summary = await this.ai.summarise(history);

    await this.prisma.$transaction([
      this.prisma.conversation.update({
        where: { id: call.conversationId },
        data: { queueId: queue.id, status: 'WAITING' },
      }),
      this.prisma.aiSession.update({
        where: { id: call.conversation.aiSession!.id },
        data: {
          escalated: true,
          escalationReason: params.reason,
          escalationDetail: params.detail,
          summary: summary.summary,
          detectedIntent: summary.detectedIntent ?? undefined,
          courseOfInterest: summary.courseOfInterest ?? undefined,
        },
      }),
    ]);

    // Stop the scripted caller's remaining lines. The driver decides what
    // happens next: a scenario written to test abandonment keeps its abandon
    // timer, everything else waits for an agent.
    this.simulated.onEscalated(call.providerCallId);

    // The AI leg goes away; the caller now hears queue treatment.
    await this.telephony.releaseAi(call.providerCallId);
    await this.prisma.callParticipant.updateMany({
      where: { callId: params.callId, kind: 'AI_AGENT', leftAt: null },
      data: { leftAt: new Date() },
    });

    this.realtime.toSupervisors('call.escalating', {
      callId: params.callId,
      conversationId: call.conversationId,
      queueId: queue.id,
      queueName: queue.name,
      reason: params.reason,
    });

    await this.transition(params.callId, 'QUEUED', { queuedAt: new Date() });
    await this.offerToNextAgent(params.callId, queue.id);
    await this.broadcastQueue(queue.id);
  }

  /** Offer a queued call to the next eligible agent. */
  private async offerToNextAgent(callId: string, queueId: string): Promise<void> {
    const alreadyOffered = this.offered.get(callId) ?? new Set<string>();
    const agentId = await this.routing.selectAgent({
      queueId,
      excludeUserIds: [...alreadyOffered],
    });

    if (!agentId) {
      // Nobody free. The call stays QUEUED; `retryQueuedCalls` picks it up when
      // an agent becomes available, and the caller may abandon in the meantime.
      this.log.warn(`No available agent for queue ${queueId} — call ${callId} waiting`);
      return;
    }

    alreadyOffered.add(agentId);
    this.offered.set(callId, alreadyOffered);

    await this.transition(callId, 'AGENT_RINGING', {
      agentRingingAt: new Date(),
      offerCount: { increment: 1 },
    });

    const payload = await this.buildScreenPop(callId, agentId);
    this.realtime.toUser(agentId, 'agent.screen_pop', payload);

    // If they don't pick up in time, move on to the next agent.
    const timeout = setTimeout(() => {
      void this.onRingTimeout(callId, queueId, agentId);
    }, this.env.AGENT_RING_TIMEOUT_SECONDS * 1000);
    this.ringTimers.set(callId, timeout);
  }

  private async onRingTimeout(callId: string, queueId: string, agentId: string): Promise<void> {
    this.ringTimers.delete(callId);
    const call = await this.prisma.call.findUnique({ where: { id: callId }, select: { state: true } });
    if (!call || call.state !== 'AGENT_RINGING') return;

    this.log.warn(`Agent ${agentId} did not answer call ${callId} — re-queueing`);
    this.realtime.toUser(agentId, 'agent.offer_revoked', { callId, reason: 'timeout' });

    await this.transition(callId, 'QUEUED');
    await this.offerToNextAgent(callId, queueId);
  }

  /**
   * The screen-pop payload. Everything the agent needs before speaking.
   */
  async buildScreenPop(callId: string, _agentId: string): Promise<ScreenPopPayload> {
    const call = await this.prisma.call.findUniqueOrThrow({
      where: { id: callId },
      include: {
        conversation: {
          include: {
            contact: true,
            queue: true,
            aiSession: true,
          },
        },
        segments: { orderBy: { startMs: 'asc' } },
      },
    });

    const contact = call.conversation.contact;
    const session = call.conversation.aiSession;

    const history = contact
      ? await this.prisma.conversation.findMany({
          where: { contactId: contact.id, id: { not: call.conversationId } },
          orderBy: { startedAt: 'desc' },
          take: 5,
          include: { aiSession: { select: { summary: true } } },
        })
      : [];

    const settings = await this.prisma.setting.findUnique({ where: { id: 'singleton' } });
    const portal = settings?.bitrixPortalUrl ?? null;

    return {
      callId,
      conversationId: call.conversationId,
      fromNumber: call.fromNumber,
      contact: contact
        ? {
            id: contact.id,
            name: contact.name,
            phoneE164: contact.phoneE164,
            email: contact.email,
            courseInterest: contact.courseInterest,
            bitrixEntity: contact.bitrixEntity,
            bitrixId: contact.bitrixId,
            bitrixUrl:
              portal && contact.bitrixEntity && contact.bitrixId
                ? `${portal.replace(/\/$/, '')}/crm/${contact.bitrixEntity}/details/${contact.bitrixId}/`
                : null,
            bitrixSyncedAt: contact.bitrixSyncedAt,
          }
        : null,
      queueName: call.conversation.queue?.name ?? null,
      waitedMs: call.queuedAt ? Date.now() - call.queuedAt.getTime() : 0,
      ai: session
        ? {
            summary: session.summary ?? 'Summary not available.',
            detectedIntent: session.detectedIntent,
            courseOfInterest: session.courseOfInterest,
            sentiment: session.sentiment,
            escalationReason: session.escalationReason ?? 'CALLER_REQUESTED',
            turns: session.turns,
            transcript: call.segments.map((s) => ({
              id: String(s.id),
              speaker: s.speaker,
              startMs: s.startMs,
              endMs: s.endMs,
              text: s.text,
              confidence: s.confidence,
            })),
          }
        : null,
      history: history.map((h) => ({
        id: h.id,
        channel: h.channel,
        startedAt: h.startedAt,
        disposition: h.disposition,
        summary: h.aiSession?.summary ?? null,
      })),
      expiresAt: new Date(Date.now() + this.env.AGENT_RING_TIMEOUT_SECONDS * 1000),
    };
  }

  /* ==================== agent actions ==================== */

  async answerCall(callId: string, agentId: string): Promise<{ mediaSessionId: string | null; agentToken: string | null }> {
    const call = await this.prisma.call.findUniqueOrThrow({
      where: { id: callId },
      include: { conversation: true },
    });

    if (call.state !== 'AGENT_RINGING') {
      throw new BadRequestException(
        `Call is ${call.state}; it can no longer be answered (someone else may have taken it).`,
      );
    }

    const timer = this.ringTimers.get(callId);
    if (timer) {
      clearTimeout(timer);
      this.ringTimers.delete(callId);
    }

    const bridge = await this.telephony.bridgeAgent(call.providerCallId, agentId);

    await this.transition(callId, 'AGENT_TALKING', {
      agentAnsweredAt: new Date(),
      mediaSessionId: bridge.mediaSessionId,
    });

    await this.prisma.$transaction([
      this.prisma.callParticipant.create({
        data: { callId, kind: 'HUMAN_AGENT', userId: agentId, joinedAt: new Date() },
      }),
      this.prisma.conversation.update({
        where: { id: call.conversationId },
        data: { handledById: agentId, status: 'ACTIVE' },
      }),
    ]);

    await this.presence.transition(agentId, 'ON_CALL', 'answered call', callId);
    this.realtime.toUser(agentId, 'agent.call_assigned', {
      callId,
      conversationId: call.conversationId,
    });

    if (call.conversation.queueId) await this.broadcastQueue(call.conversation.queueId);

    return bridge;
  }

  async rejectCall(callId: string, agentId: string, reason?: string): Promise<void> {
    const call = await this.prisma.call.findUniqueOrThrow({
      where: { id: callId },
      include: { conversation: true },
    });
    if (call.state !== 'AGENT_RINGING') return;

    const timer = this.ringTimers.get(callId);
    if (timer) {
      clearTimeout(timer);
      this.ringTimers.delete(callId);
    }

    this.log.log(`Agent ${agentId} rejected call ${callId}${reason ? `: ${reason}` : ''}`);
    await this.transition(callId, 'QUEUED');

    if (call.conversation.queueId) {
      await this.offerToNextAgent(callId, call.conversation.queueId);
    }
  }

  async holdCall(callId: string, hold: boolean): Promise<void> {
    const call = await this.prisma.call.findUniqueOrThrow({ where: { id: callId } });
    if (call.state !== 'AGENT_TALKING') {
      throw new BadRequestException('Only an active call can be placed on hold');
    }
    await this.telephony.hold(call.providerCallId, hold);
    await this.prisma.call.update({ where: { id: callId }, data: { onHold: hold } });
  }

  /** Agent ends the call. */
  async agentHangup(callId: string, agentId: string): Promise<void> {
    const call = await this.prisma.call.findUniqueOrThrow({ where: { id: callId } });
    if (call.state === 'COMPLETED') return;

    await this.telephony.hangup(call.providerCallId, 'agent hangup');
    this.simulated.cancel(call.providerCallId);
    await this.startWrapup(callId, agentId, 'AGENT_HANGUP');
  }

  /** Transfer a live call to another queue, re-running the offer loop. */
  async transferCall(params: {
    callId: string;
    targetQueueId?: string;
    targetUserId?: string;
  }): Promise<void> {
    const call = await this.prisma.call.findUniqueOrThrow({
      where: { id: params.callId },
      include: { conversation: true },
    });
    if (call.state !== 'AGENT_TALKING') {
      throw new BadRequestException('Only an active call can be transferred');
    }

    const queueId =
      params.targetQueueId ??
      (params.targetUserId
        ? (
            await this.prisma.queueMembership.findFirst({
              where: { userId: params.targetUserId },
              select: { queueId: true },
            })
          )?.queueId
        : undefined);

    if (!queueId) throw new BadRequestException('No target queue could be resolved');

    // The current agent leaves; the offer loop starts again. Deliberately not a
    // fresh call — the transcript, recording and CRM linkage stay on one record.
    await this.prisma.callParticipant.updateMany({
      where: { callId: params.callId, kind: 'HUMAN_AGENT', leftAt: null },
      data: { leftAt: new Date() },
    });

    const previous = call.conversation.handledById;
    if (previous) await this.presence.transition(previous, 'AVAILABLE', 'transferred call', null);

    // Exclude the transferring agent so the call isn't immediately offered
    // straight back to them.
    this.offered.set(params.callId, new Set(previous ? [previous] : []));

    await this.transition(params.callId, 'QUEUED', { queuedAt: new Date() });
    await this.prisma.conversation.update({
      where: { id: call.conversationId },
      data: { queueId, status: 'WAITING', handledById: null },
    });

    await this.offerToNextAgent(params.callId, queueId);
  }

  /* ==================== hangup & completion ==================== */

  async onCallerHangup(providerCallId: string): Promise<void> {
    const call = await this.prisma.call.findUnique({
      where: { providerCallId },
      include: { conversation: true },
    });
    if (!call || call.state === 'COMPLETED') return;

    this.simulated.cancel(providerCallId);

    // Abandoning while waiting is a distinct, important metric — it is the
    // number that tells the client whether they are understaffed.
    if (call.state === 'QUEUED' || call.state === 'AGENT_RINGING') {
      const timer = this.ringTimers.get(call.id);
      if (timer) {
        clearTimeout(timer);
        this.ringTimers.delete(call.id);
      }
      // Withdraw any outstanding offer so a softphone doesn't keep ringing.
      for (const agentId of this.offered.get(call.id) ?? []) {
        this.realtime.toUser(agentId, 'agent.offer_revoked', {
          callId: call.id,
          reason: 'caller hung up',
        });
      }
      await this.complete(call.id, 'ABANDONED_IN_QUEUE');
      return;
    }

    if (call.state === 'AGENT_TALKING') {
      await this.startWrapup(call.id, call.conversation.handledById!, 'CALLER_HANGUP');
      return;
    }

    await this.complete(call.id, 'CALLER_HANGUP');
  }

  /** Post-call wrap-up: the agent owes a disposition before taking another call. */
  private async startWrapup(
    callId: string,
    agentId: string,
    cause: HangupCause,
  ): Promise<void> {
    await this.transition(callId, 'WRAPUP', { wrapupStartedAt: new Date(), hangupCause: cause });
    await this.presence.transition(agentId, 'WRAPUP', 'post-call wrap-up', callId);

    this.realtime.toUser(agentId, 'agent.wrapup_started', {
      callId,
      secondsRemaining: this.env.WRAPUP_SECONDS,
    });

    // Auto-close if the agent doesn't submit a disposition in time, so a
    // forgotten wrap-up doesn't strand them out of the routing pool.
    const timer = setTimeout(() => {
      void this.completeWrapup(callId, agentId, undefined).catch((e) =>
        this.log.error(`auto wrap-up failed for ${callId}: ${String(e)}`),
      );
    }, this.env.WRAPUP_SECONDS * 1000);
    this.wrapTimers.set(callId, timer);
  }

  async completeWrapup(
    callId: string,
    agentId: string,
    disposition?: Disposition,
    notes?: string,
  ): Promise<void> {
    const timer = this.wrapTimers.get(callId);
    if (timer) {
      clearTimeout(timer);
      this.wrapTimers.delete(callId);
    }

    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      select: { state: true, conversationId: true, hangupCause: true },
    });
    if (!call || call.state === 'COMPLETED') return;

    if (disposition || notes) {
      await this.prisma.conversation.update({
        where: { id: call.conversationId },
        data: { disposition, notes },
      });
    }

    await this.complete(callId, call.hangupCause ?? 'CALLER_HANGUP');
    await this.presence.transition(agentId, 'AVAILABLE', 'wrap-up complete', null);
    this.realtime.toUser(agentId, 'agent.wrapup_ended', { callId });

    // An agent just became free — see if anything is waiting.
    await this.retryQueuedCalls();
  }

  /**
   * Terminal state. Derives all the timing columns once, marks containment, and
   * queues the post-call pipeline through the outbox.
   */
  private async complete(callId: string, cause: HangupCause): Promise<void> {
    const call = await this.prisma.call.findUniqueOrThrow({
      where: { id: callId },
      include: {
        conversation: { include: { aiSession: true } },
        participants: true,
      },
    });
    if (call.state === 'COMPLETED') return;

    const endedAt = new Date();
    const humanJoined = call.participants.some((p) => p.kind === 'HUMAN_AGENT');

    const aiStart = call.aiAnsweredAt?.getTime() ?? call.ringingAt.getTime();
    const aiEnd = call.escalatedAt?.getTime() ?? endedAt.getTime();
    const aiTalkMs = Math.max(0, aiEnd - aiStart);

    const queueWaitMs =
      call.queuedAt && call.agentAnsweredAt
        ? call.agentAnsweredAt.getTime() - call.queuedAt.getTime()
        : call.queuedAt
          ? endedAt.getTime() - call.queuedAt.getTime()
          : null;

    const agentTalkMs = call.agentAnsweredAt
      ? Math.max(0, (call.wrapupStartedAt ?? endedAt).getTime() - call.agentAnsweredAt.getTime())
      : null;

    const wrapMs = call.wrapupStartedAt
      ? Math.max(0, endedAt.getTime() - call.wrapupStartedAt.getTime())
      : null;

    const totalMs = endedAt.getTime() - call.ringingAt.getTime();

    await this.prisma.$transaction([
      this.prisma.call.update({
        where: { id: callId },
        data: {
          state: 'COMPLETED',
          endedAt,
          hangupCause: cause,
          aiTalkMs,
          queueWaitMs,
          agentTalkMs,
          wrapMs,
          totalMs,
        },
      }),
      this.prisma.callParticipant.updateMany({
        where: { callId, leftAt: null },
        data: { leftAt: endedAt },
      }),
      this.prisma.conversation.update({
        where: { id: call.conversationId },
        data: { status: 'CLOSED', endedAt, aiContained: !humanJoined },
      }),
      // Transactional outbox: the domain write and the event publication commit
      // together, so the CRM push cannot be lost even if Bitrix is down.
      this.prisma.outboxEvent.create({
        data: {
          aggregate: 'call',
          aggregateId: callId,
          type: 'call.completed',
          payload: {
            callId,
            conversationId: call.conversationId,
            aiContained: !humanJoined,
            hangupCause: cause,
            durationMs: totalMs,
          },
        },
      }),
    ]);

    this.realtime.toSupervisors('call.completed', {
      callId,
      conversationId: call.conversationId,
      hangupCause: cause,
      aiContained: !humanJoined,
      durationMs: totalMs,
    });

    this.offered.delete(callId);
    await this.outbox.notify();

    if (call.conversation.queueId) await this.broadcastQueue(call.conversation.queueId);
  }

  /**
   * Re-attempt any call still waiting in a queue. Called when an agent becomes
   * available, and on a short interval as a safety net.
   */
  async retryQueuedCalls(): Promise<void> {
    const waiting = await this.prisma.call.findMany({
      where: { state: 'QUEUED' },
      include: { conversation: { select: { queueId: true } } },
      orderBy: { queuedAt: 'asc' },
    });

    for (const call of waiting) {
      const queueId = call.conversation.queueId;
      if (!queueId) continue;
      await this.offerToNextAgent(call.id, queueId).catch((e) =>
        this.log.error(`retry offer failed for ${call.id}: ${String(e)}`),
      );
    }
  }

  /* ==================== helpers ==================== */

  /**
   * Find or create the caller.
   *
   * A caller-ID name only fills a gap — it never overwrites a name a human
   * curated in the CRM, which is why this isn't a plain upsert.
   */
  private async upsertContact(phoneE164: string, name?: string) {
    const existing = await this.prisma.contact.findUnique({ where: { phoneE164 } });
    if (!existing) {
      return this.prisma.contact.create({ data: { phoneE164, name: name ?? null } });
    }
    if (name && !existing.name) {
      return this.prisma.contact.update({ where: { id: existing.id }, data: { name } });
    }
    return existing;
  }

  private async recordMessage(
    conversationId: string,
    role: 'CALLER' | 'AI' | 'HUMAN_AGENT' | 'SYSTEM',
    text: string,
    audioOffsetMs?: number,
    confidence?: number,
  ): Promise<void> {
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        role,
        text,
        audioOffsetMs: audioOffsetMs ?? null,
        confidence: confidence ?? null,
      },
    });

    this.realtime.toConversation(conversationId, 'message.created', {
      conversationId,
      message: {
        id: message.id,
        role: message.role,
        text: message.text,
        audioOffsetMs: message.audioOffsetMs,
        confidence: message.confidence,
        createdAt: message.createdAt,
        authorName: null,
      },
    });
  }

  private async recordSegment(
    callId: string,
    speaker: 'CALLER' | 'AI_AGENT' | 'HUMAN_AGENT',
    params: { text: string; startMs: number; endMs: number; confidence?: number },
  ): Promise<void> {
    await this.prisma.transcriptSegment.create({
      data: {
        callId,
        speaker,
        startMs: Math.round(params.startMs),
        endMs: Math.round(params.endMs),
        text: params.text,
        confidence: params.confidence ?? null,
      },
    });
  }

  private async conversationHistory(conversationId: string): Promise<ConversationTurn[]> {
    const messages = await this.prisma.message.findMany({
      where: { conversationId, role: { in: ['CALLER', 'AI'] } },
      orderBy: { createdAt: 'asc' },
      select: { role: true, text: true },
    });
    return messages.map((m) => ({
      role: m.role === 'CALLER' ? 'CALLER' : 'AI',
      text: m.text,
    }));
  }

  private async broadcastQueue(queueId: string): Promise<void> {
    const stats = await this.routing.liveQueueStats(queueId);
    this.realtime.toSupervisors('queue.updated', {
      queueId,
      waiting: stats.waiting,
      longestWaitMs: stats.longestWaitMs,
      agentsAvailable: stats.agentsAvailable,
    });
  }
}
