import { Inject, Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import type { AiLiveCall, ApiEnv, StorageProvider } from '@superdemo/contracts';
import { Prisma, type Direction, type Disposition, type HangupCause } from '@superdemo/db';
import { ENV } from '../../config/config.module';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../tenancy/tenant-context.service';
import { AnalyticsService } from '../../analytics/analytics.service';
import { STORAGE_PROVIDER } from '../storage/storage.module';

const DEFAULT_BASE_URL = 'https://voice.hirestella.ai';
const TICK_MS = 60_000;
const PAGE_SIZE = 100;
/**
 * How far behind the newest imported call each sync looks again. A run is only
 * imported once Dograh marks it completed, so one still in progress when its
 * neighbours were imported must still be inside the window next time.
 */
const OVERLAP_MS = 6 * 3600_000;
const LIVE_POLL_MS = 5_000;
/**
 * A run still marked in progress after this long is treated as abandoned on
 * Dograh's side (a dropped session it never closed), not as a live call.
 */
const LIVE_MAX_AGE_MS = 30 * 60_000;

/** The subset of a `/superuser/workflow-runs` row this import reads. */
interface DograhRun {
  id: number;
  workflow_id: number;
  workflow_name: string;
  mode: string;
  is_completed: boolean;
  /** Storage keys, e.g. `transcripts/13304.txt` — resolved via `/s3/signed-url`. */
  transcript_url?: string | null;
  recording_url?: string | null;
  usage_info?: { call_duration_seconds?: number; llm?: Record<string, { total_tokens?: number }> };
  initial_context?: Record<string, unknown>;
  gathered_context?: Record<string, unknown>;
  created_at: string;
}

/** Bookkeeping Dograh writes into gathered_context; not worth showing anyone. */
const INTERNAL_KEYS = new Set([
  'extracted_variables',
  'nodes_visited',
  'call_tags',
  'call_id',
  'channel_name',
  'ext_channel_id',
  'bridge_id',
  'provider',
  'raw',
]);

/**
 * Imports calls handled by Dograh into the centre each Dograh organisation is
 * mapped to (`Organization.dograhOrgId`), so they appear in the Inbox and in
 * Analytics like any call this platform answered itself.
 *
 * Polling rather than a webhook because the superuser API is read-only and
 * spans every Dograh organisation: one key, no per-centre setup on Dograh's
 * side. Each run becomes a Conversation + Call keyed `dograh-run-<id>`, so a
 * run is never imported twice however often the window overlaps.
 *
 * Text chats are skipped: Call rows are voice. The transcript becomes the
 * conversation's messages and the recording is copied into our storage, so
 * the Inbox plays it with click-to-seek like a call of our own. Both are
 * fetched through Dograh's `/s3/signed-url`, which honours the superuser key.
 * Either may appear after the run completes, so a call missing them is
 * retried on every sync that still covers it.
 */
@Injectable()
export class DograhSyncService implements OnApplicationBootstrap {
  private readonly log = new Logger(DograhSyncService.name);
  private syncing = false;
  private pollingLive = false;
  /** Calls in progress per centre, refreshed every LIVE_POLL_MS. */
  private readonly live = new Map<string, AiLiveCall[]>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantContext,
    private readonly analytics: AnalyticsService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
    @Inject(ENV) private readonly env: ApiEnv,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.env.DOGRAH_SUPERUSER_KEY) return;
    void this.tick();
  }

  @Interval(TICK_MS)
  async tick(): Promise<void> {
    if (this.syncing || !this.env.DOGRAH_SUPERUSER_KEY) return;
    this.syncing = true;
    try {
      // Unscoped on purpose: the import serves every mapped centre, and each
      // one is then processed inside its own tenant context.
      const orgs = await this.prisma.organization.findMany({
        where: { dograhOrgId: { not: null }, isActive: true },
        select: { id: true, name: true, dograhOrgId: true, dograhWorkflowIds: true },
      });
      for (const org of orgs) {
        try {
          const imported = await this.tenants.runAs(org.id, null, () =>
            this.syncOrg(org.id, org.dograhOrgId!, org.dograhWorkflowIds),
          );
          if (imported) this.log.log(`imported ${imported} Dograh call(s) into ${org.name}`);
        } catch (error) {
          this.log.error(`Dograh import for ${org.name} failed: ${String(error)}`);
        }
      }
    } finally {
      this.syncing = false;
    }
  }

  /** What is on the phone right now for one centre. Empty when nothing is, or unmapped. */
  liveFor(orgId: string): AiLiveCall[] {
    return this.live.get(orgId) ?? [];
  }

  /**
   * Calls in progress, for Live ops. Only the last LIVE_MAX_AGE_MS of runs are
   * asked for, so this stays one small request per mapped centre. When a run
   * that was live drops out, it has just finished: the import runs at once
   * rather than up to a minute later, so it reaches the recent-calls feed and
   * the Inbox within seconds of the caller hanging up.
   */
  @Interval(LIVE_POLL_MS)
  async pollLive(): Promise<void> {
    if (this.pollingLive || !this.env.DOGRAH_SUPERUSER_KEY) return;
    this.pollingLive = true;
    let finished = false;
    try {
      const orgs = await this.prisma.organization.findMany({
        where: { dograhOrgId: { not: null }, isActive: true },
        select: { id: true, dograhOrgId: true, dograhWorkflowIds: true },
      });
      const mapped = new Set(orgs.map((o) => o.id));
      for (const id of this.live.keys()) if (!mapped.has(id)) this.live.delete(id);

      for (const org of orgs) {
        try {
          const now = Date.now();
          const { runs } = await this.fetchPage(
            org.dograhOrgId!,
            1,
            new Date(now - LIVE_MAX_AGE_MS),
          );
          const calls: AiLiveCall[] = runs
            .filter(
              (r) =>
                !r.is_completed &&
                r.mode !== 'textchat' &&
                (org.dograhWorkflowIds.length === 0 ||
                  org.dograhWorkflowIds.includes(r.workflow_id)),
            )
            .map((r) => {
              const initial = r.initial_context ?? {};
              const nodes = r.gathered_context?.nodes_visited;
              return {
                runId: r.id,
                startedAt: new Date(r.created_at),
                channel: initial.caller_number || initial.phone_number ? 'phone' : 'web',
                caller: str(
                  initial.direction === 'outbound' ? initial.phone_number : initial.caller_number,
                ),
                workflow: r.workflow_name,
                step: Array.isArray(nodes) && nodes.length ? String(nodes[nodes.length - 1]) : null,
              };
            });
          const before = this.live.get(org.id) ?? [];
          if (before.some((b) => !calls.some((c) => c.runId === b.runId))) finished = true;
          this.live.set(org.id, calls);
        } catch (error) {
          this.log.warn(`live poll for ${org.id} failed: ${String(error)}`);
        }
      }
    } finally {
      this.pollingLive = false;
    }
    if (finished) void this.tick();
  }

  private async syncOrg(
    orgId: string,
    dograhOrgId: number,
    workflowIds: number[],
  ): Promise<number> {
    const latest = await this.prisma.call.findFirst({
      where: { driver: 'dograh' },
      orderBy: { ringingAt: 'desc' },
      select: { ringingAt: true },
    });
    // The first sync takes everything; later ones only the recent window.
    const from = latest ? new Date(latest.ringingAt.getTime() - OVERLAP_MS) : null;

    const aiAgent = await this.prisma.aiAgent.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!aiAgent) throw new Error('centre has no AI agent to attribute Dograh calls to');

    let imported = 0;
    for (let page = 1; ; page++) {
      const { runs, totalPages } = await this.fetchPage(dograhOrgId, page, from);
      for (const run of runs) {
        if (!run.is_completed || run.mode === 'textchat') continue;
        if (workflowIds.length > 0 && !workflowIds.includes(run.workflow_id)) continue;
        if (await this.importRun(orgId, aiAgent.id, run)) imported++;
      }
      if (page >= totalPages) break;
    }
    return imported;
  }

  private async fetchPage(
    dograhOrgId: number,
    page: number,
    from: Date | null,
  ): Promise<{ runs: DograhRun[]; totalPages: number }> {
    const filters: unknown[] = [
      { attribute: 'organizationId', type: 'number', value: { value: dograhOrgId } },
    ];
    if (from) {
      filters.push({
        attribute: 'dateRange',
        type: 'dateRange',
        value: { from: from.toISOString(), to: new Date().toISOString() },
      });
    }
    const url = new URL(
      '/api/v1/superuser/workflow-runs',
      this.env.DOGRAH_BASE_URL ?? DEFAULT_BASE_URL,
    );
    url.searchParams.set('limit', String(PAGE_SIZE));
    url.searchParams.set('page', String(page));
    url.searchParams.set('filters', JSON.stringify(filters));

    const res = await fetch(url, {
      headers: { 'X-API-Key': this.env.DOGRAH_SUPERUSER_KEY! },
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) throw new Error(`Dograh ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const body = (await res.json()) as { workflow_runs?: DograhRun[]; total_pages?: number };
    return { runs: body.workflow_runs ?? [], totalPages: body.total_pages ?? 1 };
  }

  /** True when the run was new; false when it had already been imported. */
  private async importRun(orgId: string, aiAgentId: string, run: DograhRun): Promise<boolean> {
    const providerCallId = `dograh-run-${run.id}`;
    const exists = await this.prisma.call.findUnique({
      where: { providerCallId },
      select: { id: true, conversationId: true, ringingAt: true, totalMs: true },
    });
    if (exists) {
      // Backfill for calls imported before the gathered fields were stored.
      await this.prisma.aiSession.updateMany({
        where: { conversationId: exists.conversationId, gathered: { equals: Prisma.DbNull } },
        data: { gathered: gatheredFields(run.gathered_context ?? {}) },
      });
      await this.attachArtifacts(
        run,
        exists.id,
        exists.conversationId,
        exists.ringingAt,
        exists.totalMs ?? 0,
      );
      return false;
    }

    const initial = run.initial_context ?? {};
    const gathered = run.gathered_context ?? {};
    const runtime = (initial.runtime_configuration ?? {}) as Record<string, unknown>;

    const direction: Direction =
      initial.direction === 'outbound' ||
      (run.mode === 'ari' && typeof initial.phone_number === 'string')
        ? 'OUTBOUND'
        : 'INBOUND';
    const theirNumber = str(
      direction === 'INBOUND'
        ? initial.caller_number
        : (initial.phone_number ?? initial.called_number),
    );
    const ourNumber = str(direction === 'INBOUND' ? initial.called_number : initial.caller_number);
    const callerName = str(
      gathered.caller_name ?? gathered.customer_name ?? gathered.contact_name ?? initial.first_name,
    );

    const startedAt = new Date(run.created_at);
    const durationMs = Math.round((run.usage_info?.call_duration_seconds ?? 0) * 1000);
    const endedAt = new Date(startedAt.getTime() + durationMs);
    const outcome = str(gathered.mapped_call_disposition ?? gathered.call_disposition);
    const nodes = Array.isArray(gathered.nodes_visited) ? gathered.nodes_visited : [];
    const tokens = Object.values(run.usage_info?.llm ?? {}).reduce(
      (n, s) => n + (s.total_tokens ?? 0),
      0,
    );

    const contact = theirNumber
      ? await this.prisma.contact.upsert({
          where: { orgId_phoneE164: { orgId, phoneE164: theirNumber } },
          create: { orgId, phoneE164: theirNumber, name: callerName },
          update: callerName ? { name: callerName } : {},
          select: { id: true },
        })
      : null;

    const conversation = await this.prisma.conversation.create({
      data: {
        orgId,
        channel: 'VOICE',
        direction,
        status: 'CLOSED',
        contactId: contact?.id,
        startedAt,
        endedAt,
        aiContained: true,
        disposition: dispositionFor(outcome, str(gathered.inquiry_type)),
        notes: notesFrom(gathered) || null,
        tags: ['dograh', ...(outcome ? [outcome] : [])],
        // Nested creates are invisible to the tenant extension, so orgId is
        // passed explicitly — packages/db/src/tenant.ts.
        call: {
          create: {
            orgId,
            providerCallId,
            driver: 'dograh',
            fromNumber: (direction === 'INBOUND' ? theirNumber : ourNumber) ?? 'web',
            toNumber: (direction === 'INBOUND' ? ourNumber : theirNumber) ?? 'web',
            state: 'COMPLETED',
            ringingAt: startedAt,
            aiAnsweredAt: startedAt,
            endedAt,
            hangupCause: hangupFor(outcome),
            aiTalkMs: durationMs,
            totalMs: durationMs,
          },
        },
        aiSession: {
          create: {
            orgId,
            aiAgentId,
            driverStt: str(runtime.stt_provider) ?? 'dograh',
            driverLlm: str(runtime.llm_model ?? runtime.llm_provider) ?? 'dograh',
            driverTts: str(runtime.tts_provider) ?? 'dograh',
            turns: nodes.length,
            detectedIntent: str(
              gathered.inquiry_type ?? gathered.enquiry_type ?? gathered.call_outcome,
            ),
            summary: str(
              gathered.call_summary ??
                gathered.conversation_summary ??
                gathered.escalation_summary ??
                gathered.call_reason_raw,
            ),
            inputTokens: tokens,
            gathered: gatheredFields(gathered),
          },
        },
      },
      select: { id: true, call: { select: { id: true } } },
    });

    // Straight into the daily rollup rather than through the outbox: an
    // external call should not be pushed to the centre's CRM as its own.
    await this.analytics.rollUp({ callId: conversation.call!.id });
    await this.attachArtifacts(run, conversation.call!.id, conversation.id, startedAt, durationMs);
    return true;
  }

  /**
   * Transcript → messages, recording → our storage, each only if still missing.
   * A failure here is logged and retried next sync; it never undoes the import.
   */
  private async attachArtifacts(
    run: DograhRun,
    callId: string,
    conversationId: string,
    startedAt: Date,
    durationMs: number,
  ): Promise<void> {
    try {
      if (run.transcript_url && !(await this.prisma.message.count({ where: { conversationId } }))) {
        const text = (await this.download(run.transcript_url)).toString('utf8');
        const turns = parseTranscript(text);
        await this.prisma.message.createMany({
          data: turns.map((t, i) => ({
            conversationId,
            role: t.role,
            text: t.text,
            createdAt: t.at,
            audioOffsetMs: Math.max(0, t.at.getTime() - startedAt.getTime()),
            // Unique, so a retried sync can never duplicate a line.
            providerMessageId: `dograh-run-${run.id}-${i}`,
          })),
          skipDuplicates: true,
        });
        if (turns.length) {
          await this.prisma.aiSession.updateMany({
            where: { conversationId },
            data: { turns: turns.filter((t) => t.role === 'CALLER').length },
          });
        }
      }

      if (run.recording_url && !(await this.prisma.recording.findUnique({ where: { callId } }))) {
        const audio = await this.download(run.recording_url);
        const ext = run.recording_url.split('.').pop() ?? 'wav';
        const mimeType = ext === 'mp3' ? 'audio/mpeg' : `audio/${ext}`;
        const stored = await this.storage.put(`recordings/${callId}.${ext}`, audio, mimeType);
        const settings = await this.prisma.setting.findFirst();
        await this.prisma.recording.create({
          data: {
            callId,
            storageKey: stored.key,
            durationMs,
            mimeType,
            sizeBytes: stored.size,
            expiresAt: new Date(Date.now() + (settings?.recordingRetentionDays ?? 365) * 864e5),
          },
        });
      }
    } catch (error) {
      this.log.warn(
        `Dograh run ${run.id}: transcript/recording not attached yet — ${String(error)}`,
      );
    }
  }

  /** A Dograh storage key's bytes, via a short-lived signed URL. */
  private async download(key: string): Promise<Buffer> {
    const url = new URL('/api/v1/s3/signed-url', this.env.DOGRAH_BASE_URL ?? DEFAULT_BASE_URL);
    url.searchParams.set('key', key);
    const signed = await fetch(url, {
      headers: { 'X-API-Key': this.env.DOGRAH_SUPERUSER_KEY! },
      signal: AbortSignal.timeout(30_000),
    });
    if (!signed.ok) throw new Error(`signed-url ${signed.status} for ${key}`);
    const { url: fileUrl } = (await signed.json()) as { url: string };
    const file = await fetch(fileUrl, { signal: AbortSignal.timeout(120_000) });
    if (!file.ok) throw new Error(`download ${file.status} for ${key}`);
    return Buffer.from(await file.arrayBuffer());
  }
}

function str(v: unknown): string | null {
  if (typeof v === 'string') return v.trim() || null;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return null;
}

function dispositionFor(outcome: string | null, inquiry: string | null): Disposition | null {
  if (outcome === 'user_qualified') return 'LEAD_QUALIFIED';
  if (inquiry === 'general_info') return 'INFO_PROVIDED';
  return null;
}

function hangupFor(outcome: string | null): HangupCause | null {
  switch (outcome) {
    case 'user_hangup':
    case 'user_idle_max_duration_exceeded':
      return 'CALLER_HANGUP';
    case 'user_qualified':
      return 'AI_RESOLVED';
    case 'error':
    case 'failed':
      return 'SYSTEM_ERROR';
    default:
      return null;
  }
}

/**
 * Bookkeeping Dograh writes into gathered_context; not worth showing anyone.
 * Analytics keeps `nodes_visited` (the journey funnel), unlike the notes.
 */
const ANALYTICS_SKIP = new Set([...INTERNAL_KEYS].filter((k) => k !== 'nodes_visited'));

/** gathered_context minus bookkeeping, as stored on `AiSession.gathered`. */
function gatheredFields(gathered: Record<string, unknown>): Prisma.InputJsonObject {
  const out: Record<string, Prisma.InputJsonValue> = {};
  for (const [key, value] of Object.entries(gathered)) {
    if (ANALYTICS_SKIP.has(key) || value === null || value === undefined) continue;
    out[key] = value as Prisma.InputJsonValue;
  }
  return out;
}

/** What the agent gathered, as readable lines for the conversation's notes. */
function notesFrom(gathered: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(gathered)) {
    if (INTERNAL_KEYS.has(key)) continue;
    const text = Array.isArray(value) ? value.join(', ') : str(value);
    if (!text || text === 'false' || text === 'not_stated' || text === 'not_applicable') continue;
    lines.push(`${key.replace(/_/g, ' ')}: ${text}`);
  }
  return lines.join('\n');
}

/**
 * Dograh transcripts are one turn per line — `[2026-10-08T06:27:02.926+00:00] user: …`
 * — with an occasional continuation line that has no prefix, which belongs to
 * the turn above it.
 */
function parseTranscript(text: string): { role: 'CALLER' | 'AI'; text: string; at: Date }[] {
  const turns: { role: 'CALLER' | 'AI'; text: string; at: Date }[] = [];
  for (const line of text.split(/\r?\n/)) {
    const m = /^\[([^\]]+)\]\s*(user|assistant|bot|agent)\s*:\s?(.*)$/i.exec(line);
    if (m) {
      const at = new Date(m[1]!);
      turns.push({
        role: m[2]!.toLowerCase() === 'user' ? 'CALLER' : 'AI',
        text: m[3]!.trim(),
        at: Number.isNaN(at.getTime()) ? (turns.at(-1)?.at ?? new Date()) : at,
      });
    } else if (line.trim() && turns.length) {
      turns.at(-1)!.text += `\n${line.trim()}`;
    }
  }
  return turns.filter((t) => t.text);
}
