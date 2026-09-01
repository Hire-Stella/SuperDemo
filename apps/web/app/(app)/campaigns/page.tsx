'use client';

import { Fragment, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, Pause, Play, PhoneOutgoing, Plus, Users, X } from 'lucide-react';
import {
  CAMPAIGN_STATUS_LABELS,
  TARGET_STATUS_LABELS,
  type AiAgentDto,
  type CampaignSummary,
  type CampaignTargetRow,
  type ContactSummary,
  type PhoneNumberDto,
  type QueueDto,
} from '@superdemo/contracts';
import { api } from '@/lib/api';
import { dateTime } from '@/lib/format';
import {
  Badge,
  Button,
  Card,
  Input,
  Metric,
  MockNotice,
  Select,
  SkeletonRows,
  Table,
  Td,
  Th,
  cn,
} from '@/components/composites';

const BLANK = {
  name: '',
  opener: '',
  consentBasis: '',
  aiAgentId: '',
  queueId: '',
  fromNumberId: '',
  maxConcurrent: 2,
  windowStartHour: 9,
  windowEndHour: 18,
  maxAttempts: 2,
  retryAfterMinutes: 120,
};

/**
 * Outbound campaigns.
 *
 * The page is arranged around the two questions an admin actually has — is it
 * calling, and if not why not — which is why `idleReason` is shown as prominently
 * as the status itself. "Running" with nothing happening and no explanation is
 * the classic outbound-tool failure.
 */
export default function CampaignsPage() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [openTargets, setOpenTargets] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const campaigns = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => api.get<CampaignSummary[]>('/campaigns'),
    // The dialer ticks every 5s; matching it keeps progress honest without a
    // socket event for something this low-traffic.
    refetchInterval: 5_000,
  });
  const agents = useQuery({
    queryKey: ['ai-agents'],
    queryFn: () => api.get<AiAgentDto[]>('/ai-agents'),
  });
  const queues = useQuery({ queryKey: ['queues'], queryFn: () => api.get<QueueDto[]>('/queues') });
  const numbers = useQuery({
    queryKey: ['numbers'],
    queryFn: () => api.get<PhoneNumberDto[]>('/numbers'),
  });
  const contacts = useQuery({
    queryKey: ['contacts-for-campaign'],
    queryFn: () => api.get<{ items: ContactSummary[] }>('/campaigns/candidates?limit=100'),
    enabled: addingTo !== null,
  });
  const targets = useQuery({
    queryKey: ['campaign-targets', openTargets],
    queryFn: () => api.get<CampaignTargetRow[]>(`/campaigns/${openTargets}/targets`),
    enabled: openTargets !== null,
    refetchInterval: 5_000,
  });

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['campaigns'] });

  const create = useMutation({
    mutationFn: () =>
      api.post('/campaigns', {
        ...form,
        queueId: form.queueId || undefined,
        fromNumberId: form.fromNumberId || undefined,
      }),
    onSuccess: () => {
      toast.success('Campaign created — add people to call, then start it');
      setForm(BLANK);
      setCreating(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: string; status?: string }) =>
      api.put(`/campaigns/${id}`, body),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const addTargets = useMutation({
    mutationFn: ({ id, contactIds }: { id: string; contactIds: string[] }) =>
      api.post<{ added: number; skippedNoPhoneOrOptedOut: number }>(`/campaigns/${id}/targets`, {
        contactIds,
      }),
    onSuccess: (res) => {
      toast.success(
        `Added ${res.added}${
          res.skippedNoPhoneOrOptedOut ? ` · skipped ${res.skippedNoPhoneOrOptedOut}` : ''
        }`,
      );
      setAddingTo(null);
      setPicked(new Set());
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => api.del(`/campaigns/${id}`),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = campaigns.data ?? [];
  const running = rows.filter((c) => c.status === 'RUNNING');
  const liveNow = rows.reduce((n, c) => n + c.counts.calling, 0);
  const answeredAll = rows.reduce((n, c) => n + c.counts.answered, 0);

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-5 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <PhoneOutgoing className="size-5 text-primary" aria-hidden /> Outbound campaigns
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            The assistant calls people who already contacted you — follow-ups, reminders, documents
            outstanding. Pacing and a calling window are per campaign.
          </p>
        </div>
        <Button onClick={() => setCreating((v) => !v)}>
          <Plus className="size-4" aria-hidden /> New campaign
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        <Metric label="Campaigns" value={String(rows.length)} />
        <Metric label="Running" value={String(running.length)} tone={running.length ? 'live' : 'default'} />
        <Metric label="On a call now" value={String(liveNow)} tone={liveNow ? 'live' : 'default'} />
        <Metric label="Answered" value={String(answeredAll)} tone="brand" />
      </div>

      <MockNotice>
        Outbound runs on the <strong>simulated</strong> telephony driver: real conversations, real AI
        turns, real analytics, no carrier. A live dialer needs a carrier with outbound termination —
        the pacing, windows, retries and consent checks below are the production logic.
      </MockNotice>

      {creating && (
        <Card title="New campaign" subtitle="Who it calls comes next — this is what it says and how fast" contentClassName="p-4">
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <label className="space-y-1 text-sm">
              <span className="text-xs text-muted-foreground">Campaign name</span>
              <Input
                required
                minLength={2}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enquiry follow-up"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs text-muted-foreground">AI assistant</span>
              <Select
                required
                value={form.aiAgentId}
                onChange={(e) => setForm({ ...form, aiAgentId: e.target.value })}
              >
                <option value="">Choose…</option>
                {(agents.data ?? []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-xs text-muted-foreground">Opening line</span>
              <Input
                required
                minLength={10}
                value={form.opener}
                onChange={(e) => setForm({ ...form, opener: e.target.value })}
                placeholder="Hello, this is the assistant calling about the enquiry you made with us. Is now a good time?"
              />
            </label>

            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-xs text-muted-foreground">
                Why you may call these people (recorded on every call)
              </span>
              <Input
                required
                minLength={10}
                value={form.consentBasis}
                onChange={(e) => setForm({ ...form, consentBasis: e.target.value })}
                placeholder="Existing enquiry — each person contacted us in the last 30 days and asked for a callback"
              />
              <span className="block text-[11px] text-muted-foreground">
                Required. Cold-calling a list you happen to hold is not a lawful basis, and this
                text is written onto every conversation the campaign creates.
              </span>
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-xs text-muted-foreground">Escalation queue</span>
              <Select
                value={form.queueId}
                onChange={(e) => setForm({ ...form, queueId: e.target.value })}
              >
                <option value="">None — AI only</option>
                {(queues.data ?? []).map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs text-muted-foreground">Call from</span>
              <Select
                value={form.fromNumberId}
                onChange={(e) => setForm({ ...form, fromNumberId: e.target.value })}
              >
                <option value="">First assigned number</option>
                {(numbers.data ?? []).map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.e164} {n.label ? `· ${n.label}` : ''}
                  </option>
                ))}
              </Select>
            </label>

            <div className="md:col-span-2 grid gap-3 border-t border-border pt-3 sm:grid-cols-4">
              <label className="space-y-1 text-sm">
                <span className="text-xs text-muted-foreground">Simultaneous calls</span>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={form.maxConcurrent}
                  onChange={(e) => setForm({ ...form, maxConcurrent: Number(e.target.value) })}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-xs text-muted-foreground">Window from (local)</span>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={form.windowStartHour}
                  onChange={(e) => setForm({ ...form, windowStartHour: Number(e.target.value) })}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-xs text-muted-foreground">Window to (local)</span>
                <Input
                  type="number"
                  min={1}
                  max={24}
                  value={form.windowEndHour}
                  onChange={(e) => setForm({ ...form, windowEndHour: Number(e.target.value) })}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-xs text-muted-foreground">Attempts each</span>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={form.maxAttempts}
                  onChange={(e) => setForm({ ...form, maxAttempts: Number(e.target.value) })}
                />
              </label>
            </div>

            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? 'Creating…' : 'Create campaign'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card title="Campaigns" subtitle={`${rows.length} on this centre`}>
        {campaigns.isPending ? (
          <SkeletonRows rows={3} cols={6} />
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No campaigns yet. Create one above, then add people who have already contacted you.
          </p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Campaign</Th>
                <Th>Status</Th>
                <Th className="text-right">List</Th>
                <Th className="text-right">Answered</Th>
                <Th className="text-right">Waiting</Th>
                <Th>Pacing</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((c) => (
                <Fragment key={c.id}>
                  <tr>
                    <Td>
                      <p className="font-medium">{c.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {c.aiAgentName ?? 'no assistant'} · from {c.fromNumber ?? 'first number'}
                      </p>
                    </Td>
                    <Td>
                      <Badge
                        dot={
                          c.status === 'RUNNING'
                            ? 'bg-live'
                            : c.status === 'PAUSED'
                              ? 'bg-warn'
                              : 'bg-muted-foreground'
                        }
                      >
                        {CAMPAIGN_STATUS_LABELS[c.status]}
                      </Badge>
                      {c.idleReason && (
                        <p className="mt-1 flex items-start gap-1 text-[11px] text-warn">
                          <AlertTriangle className="mt-0.5 size-3 shrink-0" aria-hidden />
                          {c.idleReason}
                        </p>
                      )}
                    </Td>
                    <Td className="text-right tnum">{c.counts.total}</Td>
                    <Td className="text-right tnum">
                      {c.counts.answered}
                      {c.counts.calling > 0 && (
                        <span className="ml-1 text-live">· {c.counts.calling} live</span>
                      )}
                    </Td>
                    <Td className="text-right tnum">{c.counts.pending}</Td>
                    <Td className="text-[11px] text-muted-foreground">
                      {c.maxConcurrent} at a time · {pad(c.windowStartHour)}:00–
                      {pad(c.windowEndHour)}:00 · {c.maxAttempts} attempt
                      {c.maxAttempts === 1 ? '' : 's'}
                    </Td>
                    <Td className="text-right">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          className="h-8 px-2 text-xs"
                          onClick={() => setAddingTo(addingTo === c.id ? null : c.id)}
                        >
                          <Users className="size-3.5" aria-hidden /> Add people
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-8 px-2 text-xs"
                          onClick={() => setOpenTargets(openTargets === c.id ? null : c.id)}
                        >
                          {openTargets === c.id ? 'Hide list' : 'View list'}
                        </Button>
                        {c.status === 'RUNNING' ? (
                          <Button
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            onClick={() => update.mutate({ id: c.id, status: 'PAUSED' })}
                          >
                            <Pause className="size-3.5" aria-hidden /> Pause
                          </Button>
                        ) : (
                          c.status !== 'COMPLETED' &&
                          c.status !== 'CANCELLED' && (
                            <Button
                              variant="ghost"
                              className="h-8 px-2 text-xs"
                              onClick={() => update.mutate({ id: c.id, status: 'RUNNING' })}
                            >
                              <Play className="size-3.5" aria-hidden /> Start
                            </Button>
                          )
                        )}
                        {c.status !== 'CANCELLED' && (
                          <Button
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            onClick={() => {
                              if (window.confirm(`Cancel “${c.name}”? Calls already placed stay.`))
                                cancel.mutate(c.id);
                            }}
                          >
                            <X className="size-3.5" aria-hidden />
                          </Button>
                        )}
                      </div>
                    </Td>
                  </tr>

                  {addingTo === c.id && (
                    <tr>
                      <Td className="bg-muted/40" colSpan={7}>
                        <p className="mb-2 text-xs text-muted-foreground">
                          Pick from contacts this centre already knows — people who called,
                          messaged, or were imported deliberately. Opted-out contacts are skipped.
                        </p>
                        <div className="max-h-56 overflow-y-auto rounded-md border border-border bg-card">
                          {contacts.isPending ? (
                            <SkeletonRows rows={4} cols={2} />
                          ) : (
                            (contacts.data?.items ?? []).map((ct) => (
                              <label
                                key={ct.id}
                                className="flex cursor-pointer items-center gap-2 border-b border-border px-3 py-1.5 text-xs last:border-0 hover:bg-muted"
                              >
                                <input
                                  type="checkbox"
                                  checked={picked.has(ct.id)}
                                  onChange={(e) => {
                                    const next = new Set(picked);
                                    if (e.target.checked) next.add(ct.id);
                                    else next.delete(ct.id);
                                    setPicked(next);
                                  }}
                                />
                                <span className="flex-1 truncate">
                                  {ct.name ?? 'Unknown'}{' '}
                                  <span className="text-muted-foreground">{ct.phoneE164}</span>
                                </span>
                                {ct.courseInterest && (
                                  <span className="truncate text-muted-foreground">
                                    {ct.courseInterest}
                                  </span>
                                )}
                              </label>
                            ))
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            className="h-8 text-xs"
                            disabled={picked.size === 0 || addTargets.isPending}
                            onClick={() =>
                              addTargets.mutate({ id: c.id, contactIds: [...picked] })
                            }
                          >
                            Add {picked.size || ''} to campaign
                          </Button>
                          <Button
                            variant="ghost"
                            className="h-8 text-xs"
                            onClick={() => {
                              setAddingTo(null);
                              setPicked(new Set());
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </Td>
                    </tr>
                  )}

                  {openTargets === c.id && (
                    <tr>
                      <Td className="bg-muted/40" colSpan={7}>
                        {targets.isPending ? (
                          <SkeletonRows rows={4} cols={4} />
                        ) : (targets.data ?? []).length === 0 ? (
                          <p className="py-2 text-xs text-muted-foreground">
                            Nobody on this list yet.
                          </p>
                        ) : (
                          <div className="max-h-64 overflow-y-auto">
                            <table className="w-full text-xs">
                              <tbody>
                                {(targets.data ?? []).map((t) => (
                                  <tr key={t.id} className="border-b border-border last:border-0">
                                    <td className="py-1.5 pr-3">
                                      {t.contactName ?? 'Unknown'}{' '}
                                      <span className="text-muted-foreground">{t.phoneE164}</span>
                                    </td>
                                    <td className="py-1.5 pr-3">
                                      <span
                                        className={cn(
                                          t.status === 'ANSWERED' && 'text-live',
                                          t.status === 'CALLING' && 'text-primary',
                                          (t.status === 'FAILED' || t.status === 'SUPPRESSED') &&
                                            'text-destructive',
                                        )}
                                      >
                                        {TARGET_STATUS_LABELS[t.status]}
                                      </span>
                                    </td>
                                    <td className="py-1.5 pr-3 tnum text-muted-foreground">
                                      {t.attempts} attempt{t.attempts === 1 ? '' : 's'}
                                    </td>
                                    <td className="py-1.5 pr-3 text-muted-foreground">
                                      {t.nextAttemptAt
                                        ? `retry ${dateTime(t.nextAttemptAt)}`
                                        : t.lastAttemptAt
                                          ? dateTime(t.lastAttemptAt)
                                          : ''}
                                    </td>
                                    <td className="py-1.5 text-muted-foreground">
                                      {t.lastError ?? ''}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </Td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');
