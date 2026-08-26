import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import type { ApiEnv, CrmProvider, CrmSyncLogRow, CrmConnectionDto } from '@fit-ai/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { OutboxService } from '../outbox/outbox.service';
import { CrmResolver } from '../integrations/crm/crm.resolver';
import { TenantContext } from '../tenancy/tenant-context.service';
import { STORAGE_PROVIDER } from '../integrations/storage/storage.module';
import { LocalStorage } from '../integrations/storage/storage.module';
import { ENV } from '../config/config.module';
import type { StorageProvider } from '@fit-ai/contracts';

/**
 * Pushes completed calls into the CRM, driven by the outbox.
 *
 * The whole sequence — identify the caller, register the call, finish it, attach
 * the recording, log the AI transcript — is one outbox handler, so a failure at
 * any step retries the whole unit rather than leaving a half-written timeline
 * entry. Each step is logged to CrmSyncLog so the client's admin can see
 * exactly what we sent and what came back.
 */
@Injectable()
export class CrmSyncService implements OnModuleInit {
  private readonly log = new Logger(CrmSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
    private readonly outbox: OutboxService,
    private readonly localStorage: LocalStorage,
    private readonly crmResolver: CrmResolver,
    private readonly tenants: TenantContext,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
    @Inject(ENV) private readonly env: ApiEnv,
  ) {}

  onModuleInit(): void {
    this.outbox.on('call.completed', async (payload) => {
      await this.syncCall(payload as { callId: string; conversationId: string });
    });
    this.outbox.on('conversation.closed', async (payload) => {
      await this.syncChatConversation(payload as { conversationId: string });
    });

    // The portal URL is per centre and written when a centre saves its CRM
    // config (CrmResolver.save), so there is nothing to stamp globally here.
  }

  private async logSync(params: {
    method: string;
    entityType: string;
    localId?: string | null;
    bitrixId?: string | null;
    status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'SKIPPED';
    request: unknown;
    response?: unknown;
    error?: string;
  }): Promise<void> {
    await this.prisma.crmSyncLog.create({
      data: {
        direction: 'OUTBOUND_TO_BITRIX',
        method: params.method,
        entityType: params.entityType,
        localId: params.localId ?? null,
        bitrixId: params.bitrixId ?? null,
        status: params.status,
        request: (params.request ?? {}) as object,
        response: (params.response ?? null) as object,
        error: params.error?.slice(0, 1000) ?? null,
        attempts: 1,
      },
    });
  }

  /** The full post-call CRM sequence. */
  async syncCall(payload: { callId: string; conversationId: string }): Promise<void> {
    const call = await this.prisma.call.findUnique({
      where: { id: payload.callId },
      include: {
        conversation: {
          include: {
            contact: true,
            aiSession: true,
            handledBy: { select: { name: true, bitrixUserId: true } },
          },
        },
        recording: true,
        segments: { orderBy: { startMs: 'asc' } },
      },
    });

    if (!call) {
      this.log.warn(`call ${payload.callId} vanished before CRM sync`);
      return;
    }

    const contact = call.conversation.contact;
    if (!contact?.phoneE164) {
      await this.logSync({
        method: 'crm.contact.list',
        entityType: 'contact',
        localId: payload.callId,
        status: 'SKIPPED',
        request: {},
        error: 'No phone number on the contact — cannot match in CRM',
      });
      return;
    }

    try {
      // Resolved per call: this runs from an outbox handler, so the centre comes
      // from the record being synced rather than from a request.
      const crm = await this.crmResolver.forOrg(call.orgId);

      /* 1 — identify or create the caller */
      const ref = await crm.findOrCreateContact({
        name: contact.name,
        phoneE164: contact.phoneE164,
        email: contact.email,
        courseInterest: contact.courseInterest,
        source: 'AI contact centre',
      });

      await this.prisma.contact.update({
        where: { id: contact.id },
        data: {
          bitrixEntity: ref.entity,
          bitrixId: ref.id,
          bitrixSyncedAt: new Date(),
        },
      });
      await this.logSync({
        method: 'crm.contact.findOrCreate',
        entityType: ref.entity,
        localId: contact.id,
        bitrixId: ref.id,
        status: 'SUCCESS',
        request: { phone: contact.phoneE164 },
        response: ref,
      });

      /* 2 — put the call on the timeline */
      const durationSeconds = Math.max(1, Math.round((call.totalMs ?? 0) / 1000));
      const abandoned = call.hangupCause === 'ABANDONED_IN_QUEUE';

      const { crmCallId } = await crm.registerCall({
        providerCallId: call.providerCallId,
        contact: ref,
        fromNumber: call.fromNumber,
        toNumber: call.toNumber,
        direction: 'INBOUND',
        startedAt: call.ringingAt,
        durationSeconds,
        statusCode: abandoned ? '304' : '200',
        agentBitrixUserId: call.conversation.handledBy?.bitrixUserId ?? null,
      });

      await crm.finishCall({
        crmCallId,
        durationSeconds,
        statusCode: abandoned ? '304' : '200',
        failedReason: abandoned ? 'Caller abandoned while waiting' : undefined,
      });

      await this.logSync({
        method: 'telephony.externalcall.register+finish',
        entityType: 'call',
        localId: call.id,
        bitrixId: crmCallId,
        status: 'SUCCESS',
        request: { durationSeconds, statusCode: abandoned ? '304' : '200' },
      });

      /* 3 — attach the recording */
      if (call.recording) {
        try {
          // Local demo recordings aren't publicly reachable, so send the bytes
          // inline. Above ~8MB Bitrix rejects base64 — skip rather than fail
          // the whole sync for a long call.
          const MAX_INLINE = 8 * 1024 * 1024;
          if (call.recording.sizeBytes <= MAX_INLINE && this.storage.name === 'local') {
            const bytes = await this.localStorage.read(call.recording.storageKey);
            await crm.attachRecording({
              crmCallId,
              filename: `call-${call.id}.webm`,
              contentBase64: bytes.toString('base64'),
            });
          } else {
            const url = await this.storage.signedUrl(call.recording.storageKey, 7 * 86400);
            await crm.attachRecording({
              crmCallId,
              filename: `call-${call.id}.webm`,
              url,
            });
          }
          await this.logSync({
            method: 'telephony.externalcall.attachRecord',
            entityType: 'recording',
            localId: call.recording.id,
            bitrixId: crmCallId,
            status: 'SUCCESS',
            request: { sizeBytes: call.recording.sizeBytes },
          });
        } catch (error) {
          // A missing recording must not lose the call record itself.
          this.log.warn(`recording attach failed for ${call.id}: ${String(error)}`);
          await this.logSync({
            method: 'telephony.externalcall.attachRecord',
            entityType: 'recording',
            localId: call.recording.id,
            status: 'FAILED',
            request: {},
            error: String(error),
          });
        }
      }

      /* 4 — the AI transcript and summary */
      const session = call.conversation.aiSession;
      const transcript = call.segments
        .map((s) => {
          const who =
            s.speaker === 'CALLER' ? 'Caller' : s.speaker === 'AI_AGENT' ? 'AI assistant' : 'Agent';
          return `[${this.mmss(s.startMs)}] ${who}: ${s.text}`;
        })
        .join('\n');

      const description = [
        session?.summary ? `SUMMARY: ${session.summary}` : null,
        session?.detectedIntent ? `Intent: ${session.detectedIntent}` : null,
        session?.courseOfInterest ? `Course of interest: ${session.courseOfInterest}` : null,
        call.conversation.aiContained
          ? 'Handled entirely by the AI assistant.'
          : `Escalated to ${call.conversation.handledBy?.name ?? 'an agent'}` +
            (session?.escalationReason ? ` (${session.escalationReason})` : ''),
        call.conversation.disposition ? `Disposition: ${call.conversation.disposition}` : null,
        call.conversation.notes ? `Agent notes: ${call.conversation.notes}` : null,
        '',
        '--- TRANSCRIPT ---',
        transcript || '(no transcript captured)',
      ]
        .filter((l) => l !== null)
        .join('\n');

      const activity = await crm.logActivity({
        contact: ref,
        subject: `AI call — ${session?.detectedIntent ?? 'enquiry'} (${this.mmss(call.totalMs ?? 0)})`,
        description,
        completed: true,
      });

      await this.logSync({
        method: 'crm.activity.add',
        entityType: 'activity',
        localId: call.conversationId,
        bitrixId: activity.activityId,
        status: 'SUCCESS',
        request: { subject: session?.detectedIntent },
      });

      this.realtime.toSupervisors('crm.sync', {
        conversationId: call.conversationId,
        status: 'SUCCESS',
        method: 'call.sync',
        bitrixId: ref.id,
      });

      this.log.log(`synced call ${call.id} → ${crm.name} ${ref.entity} ${ref.id}`);
    } catch (error) {
      await this.logSync({
        method: 'call.sync',
        entityType: 'call',
        localId: call.id,
        status: 'FAILED',
        request: { providerCallId: call.providerCallId },
        error: String(error),
      });

      this.realtime.toSupervisors('crm.sync', {
        conversationId: call.conversationId,
        status: 'FAILED',
        method: 'call.sync',
        bitrixId: null,
        error: String(error),
      });

      // Rethrow so the outbox retries with backoff.
      throw error;
    }
  }

  /** WhatsApp / web chat threads get a contact plus a timeline activity. */
  async syncChatConversation(payload: { conversationId: string }): Promise<void> {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: payload.conversationId },
      include: {
        contact: true,
        aiSession: true,
        handledBy: { select: { name: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!conv?.contact?.phoneE164) return;

    try {
      const crm = await this.crmResolver.forOrg(conv.orgId);

      const ref = await crm.findOrCreateContact({
        name: conv.contact.name,
        phoneE164: conv.contact.phoneE164,
        courseInterest: conv.contact.courseInterest,
        source: `AI contact centre — ${conv.channel.toLowerCase()}`,
      });

      await this.prisma.contact.update({
        where: { id: conv.contact.id },
        data: { bitrixEntity: ref.entity, bitrixId: ref.id, bitrixSyncedAt: new Date() },
      });

      const thread = conv.messages
        .map((m) => {
          const who =
            m.role === 'CALLER' ? 'Customer' : m.role === 'AI' ? 'AI assistant' : 'Agent';
          return `${who}: ${m.text}`;
        })
        .join('\n');

      const activity = await crm.logActivity({
        contact: ref,
        subject: `${conv.channel} conversation — ${conv.aiSession?.detectedIntent ?? 'enquiry'}`,
        description: [
          conv.aiSession?.summary ? `SUMMARY: ${conv.aiSession.summary}` : null,
          conv.aiContained
            ? 'Handled entirely by the AI assistant.'
            : `Handled by ${conv.handledBy?.name ?? 'an agent'}`,
          '',
          '--- THREAD ---',
          thread,
        ]
          .filter((l) => l !== null)
          .join('\n'),
        completed: true,
      });

      await this.logSync({
        method: 'crm.activity.add',
        entityType: 'activity',
        localId: conv.id,
        bitrixId: activity.activityId,
        status: 'SUCCESS',
        request: { channel: conv.channel },
      });

      this.realtime.toSupervisors('crm.sync', {
        conversationId: conv.id,
        status: 'SUCCESS',
        method: 'chat.sync',
        bitrixId: ref.id,
      });
    } catch (error) {
      await this.logSync({
        method: 'chat.sync',
        entityType: 'conversation',
        localId: conv.id,
        status: 'FAILED',
        request: {},
        error: String(error),
      });
      throw error;
    }
  }

  /* ------------------------------ read models ----------------------------- */

  async connection(): Promise<CrmConnectionDto> {
    const since = new Date(Date.now() - 86_400_000);
    const [pending, failed, succeeded24h, last] = await Promise.all([
      this.prisma.outboxEvent.count({ where: { publishedAt: null } }),
      this.prisma.crmSyncLog.count({ where: { status: 'FAILED', createdAt: { gte: since } } }),
      this.prisma.crmSyncLog.count({ where: { status: 'SUCCESS', createdAt: { gte: since } } }),
      this.prisma.crmSyncLog.findFirst({
        where: { status: 'SUCCESS' },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    const orgId = this.tenants.orgId();
    const crm = await this.crmResolver.forOrg(orgId);
    const config = orgId ? await this.crmResolver.view(orgId) : null;

    return {
      driver: crm.name,
      // The mock is always "connected" — it is in-process. A real provider is
      // connected once the centre has stored the credentials it needs.
      connected:
        crm.name === 'mock' ||
        Boolean(config?.hasWebhookUrl) ||
        Boolean(config?.hasRefreshToken),
      portalUrl: crm.portalUrl,
      lastSyncAt: last?.createdAt ?? null,
      pending,
      failed,
      succeeded24h,
      config,
    };
  }

  async testConnection() {
    const crm = await this.crmResolver.forOrg();
    const result = await crm.testConnection();
    return {
      ok: result.ok,
      driver: crm.name,
      portalUrl: crm.portalUrl,
      detail: result.detail,
      scopes: result.scopes,
    };
  }

  async syncLog(limit = 50): Promise<CrmSyncLogRow[]> {
    const rows = await this.prisma.crmSyncLog.findMany({
      orderBy: { id: 'desc' },
      take: limit,
    });
    return rows.map((r) => ({
      id: String(r.id),
      direction: r.direction,
      method: r.method,
      entityType: r.entityType,
      localId: r.localId,
      bitrixId: r.bitrixId,
      status: r.status,
      attempts: r.attempts,
      error: r.error,
      createdAt: r.createdAt,
    }));
  }

  private mmss(ms: number): string {
    const total = Math.round(ms / 1000);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  }
}
