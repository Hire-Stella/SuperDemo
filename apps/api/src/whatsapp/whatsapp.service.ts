import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { WHATSAPP_SCENARIOS, type WhatsAppScenario } from '@fit-ai/db/data';
import type {
  ApiEnv,
  InboundMessageEvent,
  MessagingProvider,
  MessagingSink,
} from '@fit-ai/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { AiOrchestrator } from '../calls/ai-orchestrator.service';
import { RoutingService } from '../calls/routing.service';
import { OutboxService } from '../outbox/outbox.service';
import { ENV } from '../config/config.module';

/**
 * Mock WhatsApp provider.
 *
 * Real Meta Cloud API integration needs business verification and their live
 * number (+971 4 570 9603) migrated off the WhatsApp Business *app* — days to
 * weeks of Meta's process, none of it engineering. So v1 mocks the transport and
 * builds the channel for real: the same `Conversation`/`Message` tables the voice
 * channel uses, the same AI brain, the same escalation policy, the same unified
 * inbox. Swapping in Meta later is one driver.
 */
@Injectable()
export class MockWhatsApp implements MessagingProvider {
  readonly name = 'mock-whatsapp';
  readonly channel = 'WHATSAPP' as const;
  private readonly log = new Logger(MockWhatsApp.name);

  constructor(private readonly realtime: RealtimeService) {}

  async send(params: {
    toNumber: string;
    text: string;
    conversationId: string;
  }): Promise<{ providerMessageId: string }> {
    const providerMessageId = `wamid.mock.${randomUUID()}`;
    this.log.debug(`→ ${params.toNumber}: ${params.text.slice(0, 80)}`);
    // The simulator UI listens on the conversation room and renders this as if
    // it arrived on the customer's handset.
    this.realtime.toConversation(params.conversationId, 'transcript.partial', {
      callId: params.conversationId,
      speaker: 'AI_AGENT',
      text: params.text,
    });
    return { providerMessageId };
  }

  async markRead(): Promise<void> {
    /* no-op on mock */
  }
}

@Injectable()
export class WhatsAppService implements MessagingSink {
  private readonly log = new Logger(WhatsAppService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
    private readonly ai: AiOrchestrator,
    private readonly routing: RoutingService,
    private readonly outbox: OutboxService,
    private readonly provider: MockWhatsApp,
    @Inject(ENV) private readonly env: ApiEnv,
  ) {}

  listScenarios(): WhatsAppScenario[] {
    return WHATSAPP_SCENARIOS;
  }

  /**
   * A customer message arrived.
   *
   * Threads are keyed by phone number and stay open for a window, so a
   * follow-up minutes later continues the same conversation rather than opening
   * a new ticket — which is what makes the inbox usable.
   */
  async onInboundMessage(event: InboundMessageEvent): Promise<void> {
    const already = await this.prisma.message.findUnique({
      where: { providerMessageId: event.providerMessageId },
      select: { id: true },
    });
    if (already) return;

    const contact = await this.upsertContact(event.fromNumber, event.fromName);

    // Reuse an open thread from the last 4 hours.
    const cutoff = new Date(Date.now() - 4 * 3600_000);
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        channel: 'WHATSAPP',
        contactId: contact.id,
        status: { in: ['ACTIVE', 'WAITING'] },
        startedAt: { gte: cutoff },
      },
      include: { aiSession: true },
      orderBy: { startedAt: 'desc' },
    });

    if (!conversation) {
      const aiAgent = await this.prisma.aiAgent.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      if (!aiAgent) {
        this.log.error('No active AI agent — cannot handle WhatsApp messages');
        return;
      }

      conversation = await this.prisma.conversation.create({
        data: {
          channel: 'WHATSAPP',
          direction: 'INBOUND',
          status: 'ACTIVE',
          contactId: contact.id,
          startedAt: event.receivedAt,
          aiSession: {
            create: {
              // Nested create — the tenant extension does not see it, so the
              // org is taken from the AI agent that is answering.
              orgId: aiAgent.orgId,
              aiAgentId: aiAgent.id,
              driverStt: 'n/a',
              driverLlm: this.ai.driverNames().llm,
              driverTts: 'n/a',
            },
          },
        },
        include: { aiSession: true },
      });
    }

    await this.recordMessage(
      conversation.id,
      'CALLER',
      event.text,
      event.providerMessageId,
    );

    // A human has taken over — no AI reply, just deliver to their inbox.
    if (conversation.handledById) {
      this.realtime.toUser(conversation.handledById, 'conversation.assigned', {
        conversationId: conversation.id,
        userId: conversation.handledById,
        userName: '',
      });
      return;
    }

    await this.runAiTurn(conversation.id, conversation.aiSession!.aiAgentId, event);
  }

  private async runAiTurn(
    conversationId: string,
    aiAgentId: string,
    event: InboundMessageEvent,
  ): Promise<void> {
    const session = await this.prisma.aiSession.findUniqueOrThrow({ where: { conversationId } });
    const history = await this.history(conversationId);
    const result = await this.ai.runTurn({
      conversationId,
      aiAgentId,
      utterance: event.text,
      history,
      topicHint: session.courseOfInterest,
    });
    const avgLatency = Math.round(
      ((session.avgLatencyMs ?? 0) * session.turns + result.latencyMs) / (session.turns + 1),
    );

    await this.prisma.aiSession.update({
      where: { conversationId },
      data: {
        turns: { increment: 1 },
        detectedIntent: result.brain.detectedIntent ?? session.detectedIntent,
        courseOfInterest: session.courseOfInterest ?? result.brain.courseOfInterest,
        sentiment: result.brain.sentiment,
        avgLatencyMs: avgLatency,
        inputTokens: { increment: result.brain.usage?.inputTokens ?? 0 },
        outputTokens: { increment: result.brain.usage?.outputTokens ?? 0 },
      },
    });

    const sent = await this.provider.send({
      toNumber: event.fromNumber,
      text: result.reply,
      conversationId,
    });
    await this.recordMessage(
      conversationId,
      'AI',
      result.reply,
      sent.providerMessageId,
      undefined,
      result.brain.confidence,
    );

    if (result.escalation.escalate) {
      await this.escalate(conversationId, result);
    } else if (result.brain.resolved) {
      await this.close(conversationId);
    }
  }

  /** Chat escalation: assign to a queue and notify eligible agents. */
  private async escalate(
    conversationId: string,
    result: Awaited<ReturnType<AiOrchestrator['runTurn']>>,
  ): Promise<void> {
    const skill = this.routing.skillForIntent(
      result.brain.detectedIntent,
      result.retrievedCategory,
    );
    const queue = await this.routing.queueForSkill(skill);
    if (!queue) return;

    const history = await this.history(conversationId);
    const summary = await this.ai.summarise(history);

    await this.prisma.$transaction([
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { queueId: queue.id, status: 'WAITING' },
      }),
      this.prisma.aiSession.update({
        where: { conversationId },
        data: {
          escalated: true,
          escalationReason: result.escalation.reason,
          escalationDetail: result.escalation.detail,
          summary: summary.summary,
        },
      }),
    ]);

    // Chat doesn't ring — it lands in the inbox for any eligible agent to claim,
    // which is the right model for a channel with no real-time obligation.
    const eligible = await this.prisma.user.findMany({
      where: { isActive: true, skills: { has: queue.requiredSkill }, queues: { some: { queueId: queue.id } } },
      select: { id: true },
    });
    for (const agent of eligible) {
      this.realtime.toUser(agent.id, 'system.notice', {
        level: 'info',
        message: `New ${queue.name} WhatsApp conversation needs a human.`,
      });
    }
    this.realtime.toSupervisors('queue.updated', {
      queueId: queue.id,
      waiting: await this.prisma.conversation.count({
        where: { queueId: queue.id, status: 'WAITING' },
      }),
      longestWaitMs: 0,
      agentsAvailable: eligible.length,
    });
  }

  /** An agent takes over a chat thread. */
  async claim(conversationId: string, userId: string): Promise<void> {
    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.handledById && conv.handledById !== userId) {
      throw new NotFoundException('Conversation already claimed by another agent');
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { handledById: userId, status: 'ACTIVE' },
    });

    this.realtime.toConversation(conversationId, 'conversation.assigned', {
      conversationId,
      userId,
      userName: user.name,
    });
  }

  /** An agent replies in a chat thread. */
  async sendAsAgent(params: {
    conversationId: string;
    userId: string;
    text: string;
  }): Promise<void> {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: params.conversationId },
      include: { contact: true },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (!conv.contact?.phoneE164) throw new NotFoundException('Conversation has no contact number');

    if (conv.handledById !== params.userId) {
      await this.claim(params.conversationId, params.userId);
    }

    const sent = await this.provider.send({
      toNumber: conv.contact.phoneE164,
      text: params.text,
      conversationId: params.conversationId,
    });

    await this.recordMessage(
      params.conversationId,
      'HUMAN_AGENT',
      params.text,
      sent.providerMessageId,
      params.userId,
    );
  }

  async close(conversationId: string): Promise<void> {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { handledById: true, status: true },
    });
    if (!conv || conv.status === 'CLOSED') return;

    await this.prisma.$transaction([
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'CLOSED',
          endedAt: new Date(),
          aiContained: !conv.handledById,
        },
      }),
      this.prisma.outboxEvent.create({
        data: {
          aggregate: 'conversation',
          aggregateId: conversationId,
          type: 'conversation.closed',
          payload: { conversationId },
        },
      }),
    ]);
    await this.outbox.notify();
  }

  /** Drive a scripted WhatsApp conversation for the demo. */
  async simulateScenario(scenarioId?: string): Promise<{ conversationId: string | null }> {
    const scenario = scenarioId
      ? WHATSAPP_SCENARIOS.find((s) => s.id === scenarioId)
      : WHATSAPP_SCENARIOS[Math.floor(Math.random() * WHATSAPP_SCENARIOS.length)];
    if (!scenario) throw new NotFoundException('Scenario not found');

    const fromNumber = `${scenario.callerCountry}${Math.floor(500_000_000 + Math.random() * 99_999_999)}`;

    for (const [i, msg] of scenario.messages.entries()) {
      if (i > 0) await new Promise((r) => setTimeout(r, msg.delayMs));
      await this.onInboundMessage({
        providerMessageId: `wamid.sim.${randomUUID()}`,
        channel: 'WHATSAPP',
        fromNumber,
        fromName: scenario.callerName,
        text: msg.text,
        receivedAt: new Date(),
      });
    }

    const conv = await this.prisma.conversation.findFirst({
      where: { channel: 'WHATSAPP', contact: { phoneE164: fromNumber } },
      orderBy: { startedAt: 'desc' },
      select: { id: true },
    });
    return { conversationId: conv?.id ?? null };
  }

  /** Free-form inbound message, for the simulator's manual input. */
  /**
   * Inject one inbound message and report what the AI did with it.
   *
   * Returning the reply — rather than just `{ ok: true }` — is what lets the
   * handset mock render the customer's side of the thread. The reply is read
   * back from the persisted messages instead of being plumbed out of the
   * pipeline, so what the mock shows is exactly what was stored and what the
   * staff inbox will render. No second source of truth.
   */
  async simulateMessage(params: {
    fromNumber: string;
    fromName?: string;
    text: string;
  }): Promise<{ conversationId: string | null; reply: string | null; escalated: boolean }> {
    await this.onInboundMessage({
      providerMessageId: `wamid.sim.${randomUUID()}`,
      channel: 'WHATSAPP',
      fromNumber: params.fromNumber,
      fromName: params.fromName,
      text: params.text,
      receivedAt: new Date(),
    });

    const contact = await this.prisma.contact.findFirst({
      where: { phoneE164: params.fromNumber },
      select: { id: true },
    });
    if (!contact) return { conversationId: null, reply: null, escalated: false };

    const conv = await this.prisma.conversation.findFirst({
      where: { contactId: contact.id, channel: 'WHATSAPP' },
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        status: true,
        queueId: true,
        messages: {
          where: { role: 'AI' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { text: true },
        },
      },
    });
    if (!conv) return { conversationId: null, reply: null, escalated: false };

    return {
      conversationId: conv.id,
      reply: conv.messages[0]?.text ?? null,
      // A queued or waiting chat is one a human now owns.
      escalated: conv.status === 'WAITING' || conv.queueId !== null,
    };
  }

  /* ------------------------------- helpers -------------------------------- */

  private async upsertContact(phoneE164: string, name?: string) {
    // A number identifies a contact only within one centre; the extension has
    // already scoped this read to the right one.
    const existing = await this.prisma.contact.findFirst({ where: { phoneE164 } });
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
    role: 'CALLER' | 'AI' | 'HUMAN_AGENT',
    text: string,
    providerMessageId?: string,
    authorId?: string,
    /**
     * Retrieval confidence for AI turns.
     *
     * This used to be dropped on the floor — persisted as nothing and broadcast
     * as a hardcoded null — so every chat answer looked equally certain. That
     * hid exactly the case worth seeing: an answer that cleared the escalation
     * floor only narrowly. Voice already stored it; chat now matches.
     */
    confidence?: number | null,
  ): Promise<void> {
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        role,
        text,
        providerMessageId,
        authorId,
        confidence: confidence ?? null,
      },
      include: { author: { select: { name: true } } },
    });

    this.realtime.toConversation(conversationId, 'message.created', {
      conversationId,
      message: {
        id: message.id,
        role: message.role,
        text: message.text,
        audioOffsetMs: null,
        confidence: message.confidence,
        createdAt: message.createdAt,
        authorName: message.author?.name ?? null,
      },
    });
  }

  private async history(conversationId: string) {
    const messages = await this.prisma.message.findMany({
      where: { conversationId, role: { in: ['CALLER', 'AI'] } },
      orderBy: { createdAt: 'asc' },
      select: { role: true, text: true },
    });
    return messages.map((m) => ({
      role: (m.role === 'CALLER' ? 'CALLER' : 'AI') as 'CALLER' | 'AI',
      text: m.text,
    }));
  }
}
