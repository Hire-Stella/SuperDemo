import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import {
  countryByCode,
  readPhoneNumber,
  DograhDialers,
  type CreateVoiceCampaignInput,
  type CreateVoiceCampaignResult,
  type VoiceCampaignDetail,
  type VoiceCampaignRow,
  type VoiceCampaignsView,
} from '@superdemo/contracts';
import { PrismaService } from '../../prisma/prisma.service';
import { DograhService } from './dograh.service';
import type { DograhCampaign, DograhClient } from './dograh.client';

/** Dograh's own defaults, used when its campaign-defaults endpoint cannot be read. */
const FALLBACK_RETRY = {
  enabled: true,
  maxRetries: 2,
  delaySeconds: 120,
  onBusy: true,
  onNoAnswer: true,
  onVoicemail: true,
};

/**
 * Campaigns on the voice platform, run from this dashboard.
 *
 * Every campaign is created, started and paused on Dograh through its API, so
 * the calls are placed by its campaign dispatcher exactly as its own campaigns
 * are — the same pacing, caller-ID rotation, retries, schedule and circuit
 * breaker — and the finished runs come back through the usual import.
 *
 * ## Scope
 *
 * The centre's key is not scoped to the centre: a deployment key sees every
 * campaign and agent on the host, other clients' included. So a centre sees
 * and touches only campaigns whose agent is one of its own (its import list
 * and its dialer slots), and can only create campaigns with those agents.
 */
@Injectable()
export class VoiceCampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dograh: DograhService,
  ) {}

  /** This centre's agents, and the one its outbound slot uses. Call inside its tenant context. */
  private async ownAgents(orgId: string): Promise<{ ids: Set<number>; outbound: number | null }> {
    const [org, setting] = await Promise.all([
      this.prisma.organization.findUnique({ where: { id: orgId }, select: { dograhWorkflowIds: true } }),
      this.prisma.setting.findFirst({ select: { dograhDialers: true } }),
    ]);
    const dialers = DograhDialers.safeParse(setting?.dograhDialers ?? {});
    const slots = dialers.success ? Object.values(dialers.data) : [];
    const ids = new Set<number>([
      ...(org?.dograhWorkflowIds ?? []),
      ...slots.flatMap((s) => (s.workflowId ? [s.workflowId] : [])),
    ]);
    const outbound = dialers.success ? dialers.data.outbound.workflowId : null;
    return { ids, outbound };
  }

  private async scope(orgId: string): Promise<{ client: DograhClient; ids: Set<number>; outbound: number | null }> {
    const { client } = await this.dograh.clientFor(orgId);
    return { client, ...(await this.ownAgents(orgId)) };
  }

  /** A campaign of this centre's, or a refusal that does not say whether it exists. */
  private async ownCampaign(client: DograhClient, ids: Set<number>, id: number): Promise<DograhCampaign> {
    const campaign = await client.getCampaign(id).catch(() => null);
    if (!campaign || !ids.has(campaign.workflow_id)) {
      throw new ForbiddenException('That campaign is not one of this centre’s');
    }
    return campaign;
  }

  async view(orgId: string): Promise<VoiceCampaignsView> {
    const empty: VoiceCampaignsView = {
      connected: false,
      campaigns: [],
      agents: [],
      defaultAgentId: null,
      lines: [],
      defaultLineId: null,
      concurrentCallLimit: null,
      defaultRetry: FALLBACK_RETRY,
      error: null,
    };
    let scoped: Awaited<ReturnType<VoiceCampaignsService['scope']>>;
    try {
      scoped = await this.scope(orgId);
    } catch (e) {
      return { ...empty, error: e instanceof Error ? e.message : 'No voice platform is connected' };
    }
    const { client, ids, outbound } = scoped;

    try {
      const [campaigns, workflows, lines, defaults, setting] = await Promise.all([
        client.listCampaigns(),
        client.listWorkflows(),
        client.listTelephonyConfigs(),
        client.campaignDefaults().catch(() => null),
        this.prisma.setting.findFirst({ select: { dograhDialers: true } }),
      ]);
      const dialers = DograhDialers.safeParse(setting?.dograhDialers ?? {});
      // The line the centre's caller ID was chosen on, else the platform default.
      const slotLine = dialers.success ? dialers.data.outbound.telephonyConfigId : null;
      const defaultLine =
        lines.find((l) => l.id === slotLine) ?? lines.find((l) => l.is_default_outbound) ?? lines[0];

      const own = workflows.filter((w) => ids.has(w.id) && w.status !== 'archived');
      const statuses = await Promise.all(own.map((w) => client.workflowVersionStatus(w.id).catch(() => null)));
      const agents = own.map((w, i) => ({ id: w.id, name: w.name, unpublished: statuses[i] === 'draft' }));

      return {
        connected: true,
        campaigns: campaigns
          .filter((c) => ids.has(c.workflow_id))
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .map(toRow),
        agents,
        defaultAgentId: agents.find((a) => a.id === outbound)?.id ?? agents[0]?.id ?? null,
        lines: lines.map((l) => ({
          id: l.id,
          name: l.name,
          provider: l.provider,
          numbers: l.phone_number_count,
          isDefault: l.is_default_outbound,
        })),
        defaultLineId: defaultLine?.id ?? null,
        concurrentCallLimit: defaults?.concurrent_call_limit ?? null,
        defaultRetry: defaults ? toRetry(defaults.default_retry_config) : FALLBACK_RETRY,
        error: null,
      };
    } catch (e) {
      return { ...empty, connected: true, error: e instanceof Error ? e.message : 'The voice platform did not answer' };
    }
  }

  /**
   * Read the rows, drop what cannot be dialled or must not be, upload the CSV,
   * create the campaign. It is created as a draft: starting it is a separate
   * press, as on the platform.
   */
  async create(orgId: string, input: CreateVoiceCampaignInput): Promise<CreateVoiceCampaignResult> {
    const { client, ids } = await this.scope(orgId);
    if (!ids.has(input.workflowId)) throw new ForbiddenException('That agent is not one of this centre’s');

    const country = countryByCode(input.country);
    const seen = new Set<string>();
    const invalid: number[] = [];
    let duplicates = 0;
    const rows: { phone: string; name?: string; extra?: Record<string, string> }[] = [];
    input.contacts.forEach((c, i) => {
      const phone = readPhoneNumber(country, c.phone);
      if (!phone) return void invalid.push(i + 2); // + header line, 1-based
      if (seen.has(phone)) return void duplicates++;
      seen.add(phone);
      rows.push({ ...c, phone });
    });

    // Opted out in this dashboard — the platform has no way to know.
    const optedOutPhones = new Set(
      (
        await this.prisma.contact.findMany({
          where: { phoneE164: { in: rows.map((r) => r.phone) }, doNotCall: true },
          select: { phoneE164: true },
        })
      ).map((c) => c.phoneE164),
    );
    const dialable = rows.filter((r) => !optedOutPhones.has(r.phone));
    if (!dialable.length) {
      throw new BadRequestException('None of these contacts can be called: every number was unreadable, repeated or opted out.');
    }

    const fileName = /\.csv$/i.test(input.fileName) ? input.fileName : `${input.fileName}.csv`;
    const sourceId = await client.uploadCampaignCsv(fileName, toCsv(dialable));
    const created = await client.createCampaign({
      name: input.name,
      workflow_id: input.workflowId,
      source_type: 'csv',
      source_id: sourceId,
      telephony_configuration_id: input.telephonyConfigurationId,
      retry_config: {
        enabled: input.retry.enabled,
        max_retries: input.retry.maxRetries,
        retry_delay_seconds: input.retry.delaySeconds,
        retry_on_busy: input.retry.onBusy,
        retry_on_no_answer: input.retry.onNoAnswer,
        retry_on_voicemail: input.retry.onVoicemail,
      },
      max_concurrency: input.maxConcurrency,
      rate_limit_per_second: input.ratePerSecond,
      schedule_config: input.schedule
        ? {
            enabled: input.schedule.enabled,
            timezone: input.schedule.timezone,
            slots: input.schedule.slots.map((s) => ({ day_of_week: s.day, start_time: s.start, end_time: s.end })),
          }
        : null,
      circuit_breaker: {
        enabled: input.circuitBreaker.enabled,
        failure_threshold: input.circuitBreaker.failurePercent / 100,
        window_seconds: input.circuitBreaker.windowSeconds,
        min_calls_in_window: input.circuitBreaker.minCalls,
      },
    });

    return {
      campaign: toRow(created),
      uploaded: dialable.length,
      invalid,
      optedOut: rows.length - dialable.length,
      duplicates,
    };
  }

  async detail(orgId: string, id: number): Promise<VoiceCampaignDetail> {
    const { client, ids } = await this.scope(orgId);
    const campaign = await this.ownCampaign(client, ids, id);
    const [progress, runs] = await Promise.all([client.campaignProgress(id), client.campaignRuns(id, 1, 100)]);

    // Runs the import has already brought in, so the row can open the call.
    const imported = await this.prisma.call.findMany({
      where: { providerCallId: { in: runs.runs.map((r) => `dograh-run-${r.id}`) } },
      select: { providerCallId: true, conversationId: true },
    });
    const conversationOf = new Map(imported.map((c) => [c.providerCallId, c.conversationId]));

    return {
      campaign: toRow(campaign),
      progress: {
        state: progress.state,
        totalRows: progress.total_rows,
        processedRows: progress.processed_rows,
        failedCalls: progress.failed_calls,
        percent: progress.progress_percentage,
      },
      runs: runs.runs.map((r) => {
        const ic = (r.initial_context ?? {}) as Record<string, unknown>;
        const gc = (r.gathered_context ?? {}) as Record<string, unknown>;
        const cost = (r.cost_info ?? {}) as Record<string, unknown>;
        const str = (v: unknown) => (typeof v === 'string' && v ? v : null);
        return {
          id: Number(r.id),
          phone: str(ic.phone_number) ?? str(ic.called_number),
          name: str(ic.name) ?? str(ic.first_name),
          createdAt: String(r.created_at),
          completed: r.is_completed === true,
          durationSeconds: typeof cost.call_duration_seconds === 'number' ? cost.call_duration_seconds : null,
          outcome: str(gc.call_outcome) ?? str(gc.mapped_call_disposition) ?? str(gc.call_status),
          isRetry: ic.is_retry === true || ic.is_retry === 'true',
          conversationId: conversationOf.get(`dograh-run-${r.id}`) ?? null,
        };
      }),
      runsTotal: runs.total_count,
    };
  }

  async action(orgId: string, id: number, action: 'start' | 'pause' | 'resume'): Promise<VoiceCampaignRow> {
    const { client, ids } = await this.scope(orgId);
    await this.ownCampaign(client, ids, id);
    return toRow(await client.campaignAction(id, action));
  }
}

function toRetry(r: DograhCampaign['retry_config']) {
  return {
    enabled: r.enabled,
    maxRetries: r.max_retries,
    delaySeconds: r.retry_delay_seconds,
    onBusy: r.retry_on_busy,
    onNoAnswer: r.retry_on_no_answer,
    onVoicemail: r.retry_on_voicemail,
  };
}

function toRow(c: DograhCampaign): VoiceCampaignRow {
  return {
    id: c.id,
    name: c.name,
    workflowId: c.workflow_id,
    workflowName: c.workflow_name,
    state: c.state,
    totalRows: c.total_rows,
    processedRows: c.processed_rows,
    failedRows: c.failed_rows,
    createdAt: c.created_at,
    startedAt: c.started_at,
    completedAt: c.completed_at,
    telephonyConfigurationName: c.telephony_configuration_name ?? null,
    maxConcurrency: c.max_concurrency,
    ratePerSecond: c.rate_limit_per_second,
    retry: toRetry(c.retry_config),
    schedule: c.schedule_config
      ? {
          enabled: c.schedule_config.enabled,
          timezone: c.schedule_config.timezone,
          slots: c.schedule_config.slots.map((s) => ({ day: s.day_of_week, start: s.start_time, end: s.end_time })),
        }
      : null,
    circuitBreaker: c.circuit_breaker
      ? {
          enabled: c.circuit_breaker.enabled,
          failurePercent: Math.round(c.circuit_breaker.failure_threshold * 100),
          windowSeconds: c.circuit_breaker.window_seconds,
          minCalls: c.circuit_breaker.min_calls_in_window,
        }
      : null,
  };
}

/**
 * The CSV Dograh reads: `phone_number` first, then `first_name` and `name` —
 * which the agent's greeting uses — then any other columns the file had, each
 * reaching the agent as a template variable.
 */
function toCsv(rows: { phone: string; name?: string; extra?: Record<string, string> }[]): string {
  const extraKeys = [...new Set(rows.flatMap((r) => Object.keys(r.extra ?? {})))].filter(
    (k) => !['phone_number', 'first_name', 'name'].includes(k),
  );
  const cell = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const lines = [['phone_number', 'first_name', 'name', ...extraKeys].join(',')];
  for (const r of rows) {
    const name = r.name?.trim() ?? '';
    lines.push(
      [r.phone, name.split(/\s+/)[0] ?? '', name, ...extraKeys.map((k) => r.extra?.[k] ?? '')].map(cell).join(','),
    );
  }
  return lines.join('\n') + '\n';
}
