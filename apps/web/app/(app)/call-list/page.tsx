'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Download,
  ListPlus,
  Pause,
  Play,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  DEFAULT_DIALLING_COUNTRY,
  VOICE_CAMPAIGN_MAX_CONTACTS,
  type CreateVoiceCampaignInput,
  type CreateVoiceCampaignResult,
  type VoiceCampaignDetail,
  type VoiceCampaignRetry,
  type VoiceCampaignRow,
  type VoiceCampaignSlot,
  type VoiceCampaignsView,
} from '@superdemo/contracts';
import { api } from '@/lib/api';
import { dateTime, phone as formatPhone } from '@/lib/format';
import { parseCsv, peopleFromCsv } from '@/lib/csv';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Select,
  SkeletonRows,
  Table,
  Td,
  Th,
  cn,
} from '@/components/composites';

/**
 * Campaigns, run on the voice platform.
 *
 * This page is the platform's own New Campaign form and campaign list, reached
 * through its API: the dashboard uploads the contacts and creates, starts and
 * pauses the campaign there, and the platform's dispatcher places every call —
 * its pacing, caller-ID rotation, retries, schedule and circuit breaker. See
 * apps/api/src/integrations/dograh/voice-campaigns.service.ts.
 */

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SAMPLE_CSV = 'phone_number,name,preferred_area\n+971501234567,Aisha Khan,Downtown Dubai\n055 765 4321,Rahul Mehta,Business Bay\n';
/** Columns that are the number or the name; everything else reaches the agent as a variable. */
const RESERVED_COLUMN = /phone|mobile|number|tel|whatsapp|^name$|first.?name|last.?name|full.?name/i;

type Contact = CreateVoiceCampaignInput['contacts'][number];
type ParsedCsv = { fileName: string; contacts: Contact[]; unreadable: number[]; columns: string[] };

function readCsv(fileName: string, text: string): ParsedCsv {
  const rows = parseCsv(text);
  const { people, skipped } = peopleFromCsv(rows);
  const hasHeader = people[0]?.line === 2 || skipped[0] === 2 || (people.length === 0 && rows.length > 1);
  const header = hasHeader ? (rows[0] ?? []) : [];
  const extraCols = header
    .map((h, i) => ({ i, key: h.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') }))
    .filter(({ key }) => key && !RESERVED_COLUMN.test(key));
  const contacts = people.map((p) => {
    const cells = rows[p.line - 1] ?? [];
    const extra = Object.fromEntries(
      extraCols.map(({ i, key }) => [key, (cells[i] ?? '').trim()] as const).filter(([, v]) => v),
    );
    return { phone: p.phone, name: p.name, extra: Object.keys(extra).length ? extra : undefined };
  });
  return { fileName, contacts, unreadable: skipped, columns: extraCols.map((c) => c.key) };
}

function stateBadge(state: string) {
  return (
    <Badge dot={state === 'running' ? 'bg-live' : 'bg-muted-foreground'}>
      {state.charAt(0).toUpperCase() + state.slice(1)}
    </Badge>
  );
}

export default function CallListPage() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);

  const view = useQuery({
    queryKey: ['voice-campaigns'],
    queryFn: () => api.get<VoiceCampaignsView>('/voice-campaigns'),
    refetchInterval: 15_000,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['voice-campaigns'] });
    void queryClient.invalidateQueries({ queryKey: ['voice-campaign'] });
  };

  const act = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'start' | 'pause' | 'resume' }) =>
      api.post<VoiceCampaignRow>(`/voice-campaigns/${id}/${action}`),
    onSuccess: (c) => {
      toast.success(`${c.name}: ${c.state}`);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const d = view.data;

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-6">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <ListPlus className="size-5 text-primary" aria-hidden /> Campaigns
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Run on the voice platform: it dials, paces, retries and rotates caller IDs. Finished calls arrive in
            Conversations.
          </p>
        </div>
        {!creating && d?.connected && (
          <Button onClick={() => setCreating(true)} disabled={!d.agents.length}>
            <Plus className="size-4" aria-hidden /> New campaign
          </Button>
        )}
      </header>

      {view.isPending ? (
        <SkeletonRows rows={4} cols={4} />
      ) : view.isError ? (
        <p className="text-sm text-destructive">{(view.error as Error).message}</p>
      ) : !d!.connected ? (
        <EmptyState
          icon={<AlertTriangle className="size-5" />}
          title="No voice platform connected"
          hint={d!.error ?? 'Ask your platform operator to connect this centre’s voice agents.'}
        />
      ) : (
        <>
          {d!.error && (
            <p className="mb-3 flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="size-4" aria-hidden /> The voice platform did not answer: {d!.error}
            </p>
          )}
          {creating && (
            <NewCampaignForm
              view={d!}
              onCancel={() => setCreating(false)}
              onCreated={(r) => {
                setCreating(false);
                setOpenId(r.campaign.id);
                refresh();
              }}
            />
          )}

          <Card
            title="Campaigns"
            subtitle={`${d!.campaigns.length} on the voice platform for this centre`}
            contentClassName="p-0"
          >
            {d!.campaigns.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No campaigns yet. Create one with a CSV of contacts.
              </p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Campaign</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Progress</Th>
                    <Th>Created</Th>
                    <Th className="text-right">
                      <span className="sr-only">Actions</span>
                    </Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {d!.campaigns.map((c) => (
                    <CampaignRows
                      key={c.id}
                      campaign={c}
                      open={openId === c.id}
                      onToggle={() => setOpenId(openId === c.id ? null : c.id)}
                      busy={act.isPending && act.variables?.id === c.id}
                      onAction={(action) => act.mutate({ id: c.id, action })}
                    />
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

/* ------------------------------ list + detail ------------------------------ */

function CampaignRows({
  campaign: c,
  open,
  onToggle,
  busy,
  onAction,
}: {
  campaign: VoiceCampaignRow;
  open: boolean;
  onToggle: () => void;
  busy: boolean;
  onAction: (action: 'start' | 'pause' | 'resume') => void;
}) {
  // The platform calls a new campaign "created"; its docs call it a draft.
  const action =
    c.state === 'created' || c.state === 'draft'
      ? 'start'
      : c.state === 'running'
        ? 'pause'
        : c.state === 'paused'
          ? 'resume'
          : null;
  return (
    <>
      <tr>
        <Td>
          <button type="button" onClick={onToggle} className="flex items-center gap-1.5 text-left font-medium">
            {open ? <ChevronDown className="size-4" aria-hidden /> : <ChevronRight className="size-4" aria-hidden />}
            {c.name}
          </button>
          <p className="ml-5.5 text-xs text-muted-foreground">
            {c.workflowName}
            {c.telephonyConfigurationName ? ` · ${c.telephonyConfigurationName}` : ''}
          </p>
        </Td>
        <Td>{stateBadge(c.state)}</Td>
        <Td className="text-right tnum text-sm">
          {c.processedRows}
          {c.totalRows !== null ? ` / ${c.totalRows}` : ''}
          {c.failedRows > 0 && <span className="block text-xs text-muted-foreground">{c.failedRows} failed</span>}
        </Td>
        <Td className="text-xs text-muted-foreground">{dateTime(c.createdAt)}</Td>
        <Td className="text-right">
          {action && (
            <Button
              variant="outline"
              size="xs"
              loading={busy}
              disabled={busy}
              onClick={() => {
                if (action !== 'start' || window.confirm(`Start "${c.name}"? The voice platform begins calling now.`))
                  onAction(action);
              }}
            >
              {action === 'pause' ? <Pause className="size-3.5" aria-hidden /> : <Play className="size-3.5" aria-hidden />}
              {action === 'start' ? 'Start' : action === 'pause' ? 'Pause' : 'Resume'}
            </Button>
          )}
        </Td>
      </tr>
      {open && (
        <tr>
          <Td colSpan={5} className="bg-muted/30">
            <CampaignDetailPanel id={c.id} />
          </Td>
        </tr>
      )}
    </>
  );
}

function CampaignDetailPanel({ id }: { id: number }) {
  const detail = useQuery({
    queryKey: ['voice-campaign', id],
    queryFn: () => api.get<VoiceCampaignDetail>(`/voice-campaigns/${id}`),
    refetchInterval: (q) => (q.state.data?.progress.state === 'running' ? 5_000 : false),
  });
  if (detail.isPending) return <SkeletonRows rows={3} cols={4} />;
  if (detail.isError) return <p className="text-sm text-destructive">{(detail.error as Error).message}</p>;
  const { campaign: c, progress: p, runs, runsTotal } = detail.data;
  const pct = Math.min(100, Math.round(p.percent));

  return (
    <div className="grid gap-4 py-2">
      <div>
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>
            {p.processedRows} of {p.totalRows} contacts called · {p.failedCalls} without a connection
          </span>
          <span className="tnum">{pct}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <dl className="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-3">
        <Setting label="Phone line" value={c.telephonyConfigurationName ?? 'Platform default'} />
        <Setting label="Max concurrent calls" value={c.maxConcurrency ?? 'Organisation limit'} />
        <Setting label="Calls started per second" value={c.ratePerSecond} />
        <Setting
          label="Retries"
          value={
            c.retry.enabled
              ? `${c.retry.maxRetries} after ${c.retry.delaySeconds}s (${[
                  c.retry.onBusy && 'busy',
                  c.retry.onNoAnswer && 'no answer',
                  c.retry.onVoicemail && 'voicemail',
                ]
                  .filter(Boolean)
                  .join(', ')})`
              : 'Off'
          }
        />
        <Setting
          label="Schedule"
          value={
            c.schedule?.enabled
              ? `${c.schedule.slots.map((s) => `${DAYS[s.day]} ${s.start}–${s.end}`).join(', ')} (${c.schedule.timezone})`
              : 'Any time'
          }
        />
        <Setting
          label="Circuit breaker"
          value={
            c.circuitBreaker?.enabled
              ? `Pause at ${c.circuitBreaker.failurePercent}% failed over ${c.circuitBreaker.windowSeconds}s (min ${c.circuitBreaker.minCalls} calls)`
              : 'Off'
          }
        />
      </dl>

      {runs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No calls placed yet.</p>
      ) : (
        <div>
          <p className="mb-1 text-xs text-muted-foreground">
            {runsTotal > runs.length ? `Latest ${runs.length} of ${runsTotal} calls` : `${runsTotal} calls`}
          </p>
          <Table>
            <thead>
              <tr>
                <Th>Contact</Th>
                <Th>Called</Th>
                <Th className="text-right">Duration</Th>
                <Th>Outcome</Th>
                <Th className="text-right">
                  <span className="sr-only">Conversation</span>
                </Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {runs.map((r) => (
                <tr key={r.id}>
                  <Td>
                    <span className="font-medium">{r.name ?? 'No name'}</span>
                    <span className="block tnum text-xs text-muted-foreground">
                      {r.phone ? formatPhone(r.phone) : '—'}
                      {r.isRetry ? ' · retry' : ''}
                    </span>
                  </Td>
                  <Td className="text-xs text-muted-foreground">{dateTime(r.createdAt)}</Td>
                  <Td className="text-right tnum text-xs">
                    {r.durationSeconds !== null ? `${Math.round(r.durationSeconds)}s` : r.completed ? '—' : 'live'}
                  </Td>
                  <Td className="text-xs">{r.outcome?.replace(/_/g, ' ') ?? (r.completed ? '—' : 'in progress')}</Td>
                  <Td className="text-right text-xs">
                    {r.conversationId ? (
                      <Link href={`/conversations/${r.conversationId}`} className="font-medium underline">
                        View call
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">{r.completed ? 'importing' : ''}</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}

function Setting({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

/* --------------------------------- the form -------------------------------- */

function NewCampaignForm({
  view,
  onCancel,
  onCreated,
}: {
  view: VoiceCampaignsView;
  onCancel: () => void;
  onCreated: (r: CreateVoiceCampaignResult) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [agentId, setAgentId] = useState<number | null>(view.defaultAgentId);
  const [lineId, setLineId] = useState<number | null>(view.defaultLineId);
  const [csv, setCsv] = useState<ParsedCsv | null>(null);
  const [advanced, setAdvanced] = useState(false);

  const [maxConcurrency, setMaxConcurrency] = useState('');
  const [rate, setRate] = useState('1');
  const [retry, setRetry] = useState<VoiceCampaignRetry>(view.defaultRetry);
  const [scheduleOn, setScheduleOn] = useState(false);
  const [timezone, setTimezone] = useState('Asia/Dubai');
  const [slots, setSlots] = useState<VoiceCampaignSlot[]>(
    [0, 1, 2, 3, 4, 5].map((day) => ({ day, start: '09:00', end: '18:00' })),
  );
  const [breakerOn, setBreakerOn] = useState(true);
  const [breaker, setBreaker] = useState({ failurePercent: '50', windowSeconds: '120', minCalls: '5' });

  const timezones = useMemo(() => {
    const all = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.('timeZone');
    return all?.length ? all : ['Asia/Dubai', 'UTC'];
  }, []);

  const agent = view.agents.find((a) => a.id === agentId);
  const line = view.lines.find((l) => l.id === lineId);
  const limit = view.concurrentCallLimit;

  const create = useMutation({
    mutationFn: (body: CreateVoiceCampaignInput) => api.post<CreateVoiceCampaignResult>('/voice-campaigns', body),
    onSuccess: (r) => {
      const notes = [
        r.invalid.length && `${r.invalid.length} unreadable`,
        r.duplicates && `${r.duplicates} repeated`,
        r.optedOut && `${r.optedOut} opted out`,
      ].filter(Boolean);
      toast.success(
        `Created "${r.campaign.name}" with ${r.uploaded} contacts${notes.length ? ` (${notes.join(', ')} left out)` : ''}. Press Start to begin calling.`,
      );
      onCreated(r);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = () => {
    if (!agentId || !lineId || !csv?.contacts.length || !name.trim()) return;
    const concurrency = maxConcurrency.trim() ? Number(maxConcurrency) : null;
    if (concurrency !== null && (!Number.isInteger(concurrency) || concurrency < 1 || (limit && concurrency > limit))) {
      toast.error(`Max concurrent calls must be between 1 and ${limit ?? 'your organisation limit'}`);
      return;
    }
    const perSecond = Number(rate);
    if (!Number.isInteger(perSecond) || perSecond < 1 || (limit && perSecond > limit)) {
      toast.error(`Calls started per second must be between 1 and ${limit ?? 'your organisation limit'}`);
      return;
    }
    if (scheduleOn && slots.some((s) => s.start >= s.end)) {
      toast.error('Each time slot must end after it starts');
      return;
    }
    create.mutate({
      name: name.trim(),
      workflowId: agentId,
      telephonyConfigurationId: lineId,
      country: DEFAULT_DIALLING_COUNTRY,
      contacts: csv.contacts,
      fileName: csv.fileName,
      maxConcurrency: concurrency,
      ratePerSecond: perSecond,
      retry,
      schedule: scheduleOn ? { enabled: true, timezone, slots } : null,
      circuitBreaker: {
        enabled: breakerOn,
        failurePercent: Number(breaker.failurePercent) || 50,
        windowSeconds: Number(breaker.windowSeconds) || 120,
        minCalls: Number(breaker.minCalls) || 5,
      },
    });
  };

  const readFile = async (file: File) => {
    const parsed = readCsv(file.name, await file.text());
    if (parsed.contacts.length > VOICE_CAMPAIGN_MAX_CONTACTS) {
      toast.error(`That file has ${parsed.contacts.length} contacts; one campaign takes up to ${VOICE_CAMPAIGN_MAX_CONTACTS}.`);
      return;
    }
    setCsv(parsed);
    if (!name.trim()) setName(file.name.replace(/\.csv$/i, ''));
  };

  return (
    <Card
      className="mb-4"
      title="New campaign"
      subtitle="Created on the voice platform as a draft; nobody is called until you press Start"
      action={
        <Button variant="ghost" size="icon-xs" aria-label="Close" onClick={onCancel}>
          <X className="size-4" aria-hidden />
        </Button>
      }
      contentClassName="p-4"
    >
      <div className="grid gap-4">
        <Field label="Campaign name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter campaign name" maxLength={255} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Agent" hint="The voice agent that makes every call.">
            <Select value={agentId ?? ''} onChange={(e) => setAgentId(Number(e.target.value) || null)}>
              {view.agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Telephony configuration" hint="Outbound calls use this line’s caller IDs, rotated per call.">
            <Select value={lineId ?? ''} onChange={(e) => setLineId(Number(e.target.value) || null)}>
              {view.lines.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.provider}) · {l.numbers} {l.numbers === 1 ? 'number' : 'numbers'}
                  {l.isDefault ? ' - default' : ''}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {agent?.unpublished && (
          <p className="flex items-start gap-2 rounded-md border border-primary/40 bg-primary/5 p-3 text-xs">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            This agent has changes that are not published. Campaigns run the published version, so publish it on the
            voice platform first or the calls will not use those changes.
          </p>
        )}
        {line && line.numbers === 0 && (
          <p className="text-xs text-destructive">This line has no phone numbers, so it has no caller ID to call from.</p>
        )}

        <Field
          label="Contacts (CSV file)"
          hint="One row per person: a phone number column, an optional name, and any other columns, which the agent can use as variables. Numbers without a country code are read as UAE numbers."
        >
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void readFile(f);
                e.target.value = '';
              }}
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" aria-hidden /> {csv ? 'Choose another file' : 'Upload CSV'}
            </Button>
            <a
              href={`data:text/csv;charset=utf-8,${encodeURIComponent(SAMPLE_CSV)}`}
              download="campaign-sample.csv"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground underline"
            >
              <Download className="size-3.5" aria-hidden /> Sample file
            </a>
          </div>
          {csv && (
            <div className="mt-2 rounded-md border border-border p-3 text-xs">
              <p>
                <span className="font-medium">{csv.fileName}</span>: {csv.contacts.length}{' '}
                {csv.contacts.length === 1 ? 'contact' : 'contacts'} ready
                {csv.unreadable.length > 0 &&
                  ` · ${csv.unreadable.length} rows without a number (line ${csv.unreadable.slice(0, 8).join(', ')}${csv.unreadable.length > 8 ? '…' : ''})`}
              </p>
              {csv.columns.length > 0 && (
                <p className="mt-1 text-muted-foreground">Also sent to the agent: {csv.columns.join(', ')}</p>
              )}
              <ul className="mt-2 grid gap-0.5 text-muted-foreground">
                {csv.contacts.slice(0, 3).map((c, i) => (
                  <li key={i} className="tnum">
                    {c.phone}
                    {c.name ? ` · ${c.name}` : ''}
                  </li>
                ))}
                {csv.contacts.length > 3 && <li>…</li>}
              </ul>
            </div>
          )}
        </Field>

        <div className="rounded-md border border-border">
          <button
            type="button"
            onClick={() => setAdvanced(!advanced)}
            className="flex w-full items-center justify-between p-3 text-sm font-medium"
          >
            Advanced settings
            {advanced ? <ChevronDown className="size-4" aria-hidden /> : <ChevronRight className="size-4" aria-hidden />}
          </button>
          {advanced && (
            <div className="grid gap-5 border-t border-border p-3">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Max concurrent calls"
                  hint={`Calls live at the same time. Leave empty for the organisation limit${limit ? ` (${limit})` : ''}.`}
                >
                  <Input
                    type="number"
                    min={1}
                    max={limit ?? undefined}
                    placeholder={limit ? `Default: ${limit}` : 'Default'}
                    value={maxConcurrency}
                    onChange={(e) => setMaxConcurrency(e.target.value)}
                  />
                </Field>
                <Field label="Calls started per second" hint="How fast new calls are dialled.">
                  <Input type="number" min={1} max={limit ?? undefined} value={rate} onChange={(e) => setRate(e.target.value)} />
                </Field>
              </div>

              <Toggle label="Enable retries" hint="Automatically retry failed calls" checked={retry.enabled} onChange={(v) => setRetry({ ...retry, enabled: v })} />
              {retry.enabled && (
                <div className="grid gap-4 pl-6 sm:grid-cols-2">
                  <Field label="Max retries">
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={retry.maxRetries}
                      onChange={(e) => setRetry({ ...retry, maxRetries: Math.max(0, Math.min(10, Number(e.target.value) || 0)) })}
                    />
                  </Field>
                  <Field label="Retry delay (seconds)">
                    <Input
                      type="number"
                      min={30}
                      max={3600}
                      value={retry.delaySeconds}
                      onChange={(e) => setRetry({ ...retry, delaySeconds: Number(e.target.value) || 120 })}
                    />
                  </Field>
                  <div className="flex flex-wrap gap-4 text-sm sm:col-span-2">
                    <span className="text-muted-foreground">Retry on</span>
                    <Check label="Busy" checked={retry.onBusy} onChange={(v) => setRetry({ ...retry, onBusy: v })} />
                    <Check label="No answer" checked={retry.onNoAnswer} onChange={(v) => setRetry({ ...retry, onNoAnswer: v })} />
                    <Check label="Voicemail" checked={retry.onVoicemail} onChange={(v) => setRetry({ ...retry, onVoicemail: v })} />
                  </div>
                </div>
              )}

              <Toggle label="Call schedule" hint="Only call within these hours" checked={scheduleOn} onChange={setScheduleOn} />
              {scheduleOn && (
                <div className="grid gap-3 pl-6">
                  <Field label="Timezone">
                    <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                      {timezones.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <div className="grid gap-2">
                    <span className="text-sm font-medium">Time slots</span>
                    {slots.map((s, i) => (
                      <div key={i} className="grid grid-cols-[5rem_1fr_1fr_auto] items-center gap-2">
                        <Select
                          aria-label="Day"
                          value={s.day}
                          onChange={(e) => setSlots(slots.map((x, j) => (j === i ? { ...x, day: Number(e.target.value) } : x)))}
                        >
                          {DAYS.map((day, d) => (
                            <option key={day} value={d}>
                              {day}
                            </option>
                          ))}
                        </Select>
                        <Input
                          type="time"
                          aria-label="Start"
                          value={s.start}
                          onChange={(e) => setSlots(slots.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))}
                        />
                        <Input
                          type="time"
                          aria-label="End"
                          value={s.end}
                          onChange={(e) => setSlots(slots.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))}
                        />
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Remove slot"
                          disabled={slots.length === 1}
                          onClick={() => setSlots(slots.filter((_, j) => j !== i))}
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="xs"
                      className="justify-self-start"
                      disabled={slots.length >= 50}
                      onClick={() => setSlots([...slots, { day: 0, start: '09:00', end: '17:00' }])}
                    >
                      <Plus className="size-3.5" aria-hidden /> Add time slot
                    </Button>
                  </div>
                </div>
              )}

              <Toggle
                label="Circuit breaker"
                hint="Pause the campaign automatically when too many calls fail"
                checked={breakerOn}
                onChange={setBreakerOn}
              />
              {breakerOn && (
                <div className="grid gap-4 pl-6 sm:grid-cols-3">
                  <Field label="Failure threshold (%)">
                    <Input type="number" min={1} max={100} value={breaker.failurePercent} onChange={(e) => setBreaker({ ...breaker, failurePercent: e.target.value })} />
                  </Field>
                  <Field label="Window (seconds)">
                    <Input type="number" min={30} max={600} value={breaker.windowSeconds} onChange={(e) => setBreaker({ ...breaker, windowSeconds: e.target.value })} />
                  </Field>
                  <Field label="Min calls in window">
                    <Input type="number" min={1} max={100} value={breaker.minCalls} onChange={(e) => setBreaker({ ...breaker, minCalls: e.target.value })} />
                  </Field>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            loading={create.isPending}
            disabled={create.isPending || !name.trim() || !agentId || !lineId || !csv?.contacts.length}
            onClick={submit}
          >
            Create campaign
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-2">
      <input
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className={cn('block text-xs text-muted-foreground')}>{hint}</span>
      </span>
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-1.5">
      <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
