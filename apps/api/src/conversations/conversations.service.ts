import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@fit-ai/db';
import type {
  ConversationDetail,
  ConversationListItem,
  ListConversationsQuery,
  StorageProvider,
  UpdateConversationInput,
} from '@fit-ai/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_PROVIDER } from '../integrations/storage/storage.module';
import { RealtimeService } from '../realtime/realtime.service';

/** Shape shared by the list and detail queries so mapping stays in one place. */
const listInclude = {
  contact: true,
  queue: { select: { name: true } },
  handledBy: { select: { name: true } },
  aiSession: true,
  call: { select: { state: true, recording: { select: { id: true } } } },
  messages: { orderBy: { createdAt: 'desc' as const }, take: 1 },
  _count: { select: { messages: true } },
} satisfies Prisma.ConversationInclude;

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  /**
   * Unified inbox. Cursor pagination, because a supervisor scrolling six months
   * of history must not force an OFFSET scan.
   */
  async list(
    query: ListConversationsQuery,
  ): Promise<{ items: ConversationListItem[]; nextCursor: string | null }> {
    const where: Prisma.ConversationWhereInput = {
      ...(query.channel ? { channel: query.channel } : {}),
      ...(query.direction ? { direction: query.direction } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.disposition ? { disposition: query.disposition } : {}),
      ...(query.queueId ? { queueId: query.queueId } : {}),
      ...(query.agentId ? { handledById: query.agentId } : {}),
      ...(query.aiContained !== undefined ? { aiContained: query.aiContained } : {}),
      ...(query.from || query.to
        ? { startedAt: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } }
        : {}),
      ...(query.search
        ? {
            OR: [
              { contact: { name: { contains: query.search, mode: 'insensitive' } } },
              { contact: { phoneE164: { contains: query.search } } },
              { messages: { some: { text: { contains: query.search, mode: 'insensitive' } } } },
              { notes: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const rows = await this.prisma.conversation.findMany({
      where,
      include: listInclude,
      orderBy: { startedAt: 'desc' },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > query.limit;
    const page = hasMore ? rows.slice(0, query.limit) : rows;

    const crmSynced = await this.crmSyncedSet(page.map((c) => c.id));

    return {
      items: page.map((c) => this.toListItem(c, crmSynced.has(c.id))),
      nextCursor: hasMore ? page[page.length - 1]!.id : null,
    };
  }

  async detail(id: string): Promise<ConversationDetail> {
    const conv = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        contact: true,
        queue: { select: { name: true } },
        handledBy: { select: { name: true } },
        aiSession: { include: { aiAgent: { select: { name: true } } } },
        call: {
          include: {
            recording: true,
            segments: { orderBy: { startMs: 'asc' } },
            participants: { include: { user: { select: { name: true } } }, orderBy: { joinedAt: 'asc' } },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { name: true } } },
        },
        _count: { select: { messages: true } },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    const crmSynced = await this.crmSyncedSet([id]);
    const settings = await this.prisma.setting.findUnique({ where: { id: 'singleton' } });

    const recording = conv.call?.recording
      ? {
          id: conv.call.recording.id,
          durationMs: conv.call.recording.durationMs,
          mimeType: conv.call.recording.mimeType,
          sizeBytes: conv.call.recording.sizeBytes,
          // Short-lived signed URL; access is audited by the media controller.
          url: await this.storage.signedUrl(conv.call.recording.storageKey, 3600),
          expiresAt: conv.call.recording.expiresAt,
        }
      : null;

    const base = this.toListItem(
      {
        ...conv,
        messages: conv.messages.slice(-1),
        call: conv.call ? { state: conv.call.state, recording: conv.call.recording } : null,
      } as never,
      crmSynced.has(id),
      settings?.bitrixPortalUrl ?? null,
    );

    return {
      ...base,
      call: conv.call
        ? {
            id: conv.call.id,
            providerCallId: conv.call.providerCallId,
            driver: conv.call.driver,
            fromNumber: conv.call.fromNumber,
            toNumber: conv.call.toNumber,
            state: conv.call.state,
            ringingAt: conv.call.ringingAt,
            aiAnsweredAt: conv.call.aiAnsweredAt,
            escalatedAt: conv.call.escalatedAt,
            agentAnsweredAt: conv.call.agentAnsweredAt,
            endedAt: conv.call.endedAt,
            hangupCause: conv.call.hangupCause,
            escalationReason: conv.call.escalationReason,
            queueWaitMs: conv.call.queueWaitMs,
            aiTalkMs: conv.call.aiTalkMs,
            agentTalkMs: conv.call.agentTalkMs,
            participants: conv.call.participants.map((p) => ({
              id: p.id,
              kind: p.kind,
              userId: p.userId,
              userName: p.user?.name ?? null,
              joinedAt: p.joinedAt,
              leftAt: p.leftAt,
            })),
          }
        : null,
      messages: conv.messages.map((m) => ({
        id: m.id,
        role: m.role,
        text: m.text,
        audioOffsetMs: m.audioOffsetMs,
        confidence: m.confidence,
        createdAt: m.createdAt,
        authorName: m.author?.name ?? null,
      })),
      recording,
      transcript: (conv.call?.segments ?? []).map((s) => ({
        id: String(s.id),
        speaker: s.speaker,
        startMs: s.startMs,
        endMs: s.endMs,
        text: s.text,
        confidence: s.confidence,
      })),
      aiSession: conv.aiSession
        ? {
            id: conv.aiSession.id,
            aiAgentName: conv.aiSession.aiAgent.name,
            driverStt: conv.aiSession.driverStt,
            driverLlm: conv.aiSession.driverLlm,
            driverTts: conv.aiSession.driverTts,
            turns: conv.aiSession.turns,
            escalated: conv.aiSession.escalated,
            escalationReason: conv.aiSession.escalationReason,
            detectedIntent: conv.aiSession.detectedIntent,
            courseOfInterest: conv.aiSession.courseOfInterest,
            sentiment: conv.aiSession.sentiment,
            summary: conv.aiSession.summary,
            avgLatencyMs: conv.aiSession.avgLatencyMs,
            costUsd: conv.aiSession.costUsd ? Number(conv.aiSession.costUsd) : null,
          }
        : null,
      notes: conv.notes,
      tags: conv.tags,
    };
  }

  async update(id: string, input: UpdateConversationInput): Promise<ConversationListItem> {
    const existing = await this.prisma.conversation.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Conversation not found');

    await this.prisma.conversation.update({
      where: { id },
      data: {
        disposition: input.disposition,
        notes: input.notes,
        tags: input.tags,
      },
    });

    const updated = await this.prisma.conversation.findUniqueOrThrow({
      where: { id },
      include: listInclude,
    });
    const crmSynced = await this.crmSyncedSet([id]);
    const item = this.toListItem(updated, crmSynced.has(id));

    this.realtime.toSupervisors('conversation.updated', item);
    return item;
  }

  /** Which conversations have a successful CRM sync — drives the inbox badge. */
  private async crmSyncedSet(ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const rows = await this.prisma.crmSyncLog.findMany({
      where: { localId: { in: ids }, status: 'SUCCESS' },
      select: { localId: true },
      distinct: ['localId'],
    });
    return new Set(rows.map((r) => r.localId!).filter(Boolean));
  }

  private toListItem(
    c: Prisma.ConversationGetPayload<{ include: typeof listInclude }>,
    crmSynced: boolean,
    portalUrl?: string | null,
  ): ConversationListItem {
    const durationMs = c.endedAt ? c.endedAt.getTime() - c.startedAt.getTime() : null;

    return {
      id: c.id,
      channel: c.channel,
      direction: c.direction,
      status: c.status,
      startedAt: c.startedAt,
      endedAt: c.endedAt,
      disposition: c.disposition,
      contact: c.contact
        ? {
            id: c.contact.id,
            name: c.contact.name,
            phoneE164: c.contact.phoneE164,
            email: c.contact.email,
            courseInterest: c.contact.courseInterest,
            bitrixEntity: c.contact.bitrixEntity,
            bitrixId: c.contact.bitrixId,
            bitrixUrl:
              portalUrl && c.contact.bitrixEntity && c.contact.bitrixId
                ? `${portalUrl.replace(/\/$/, '')}/crm/${c.contact.bitrixEntity}/details/${c.contact.bitrixId}/`
                : null,
            bitrixSyncedAt: c.contact.bitrixSyncedAt,
          }
        : null,
      queueName: c.queue?.name ?? null,
      handledByName: c.handledBy?.name ?? null,
      aiContained: c.aiContained,
      escalationReason: c.aiSession?.escalationReason ?? null,
      durationMs,
      lastMessagePreview: c.messages[0]?.text?.slice(0, 160) ?? null,
      messageCount: c._count.messages,
      callState: c.call?.state ?? null,
      hasRecording: Boolean(c.call?.recording),
      crmSynced,
    };
  }
}
