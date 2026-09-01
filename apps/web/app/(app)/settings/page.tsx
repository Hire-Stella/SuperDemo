'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Phone,
  PlugZap,
  RefreshCw,
  Settings as SettingsIcon,
  ShoppingCart,
  XCircle,
} from 'lucide-react';
import {
  CRM_DRIVER_LABELS,
  type CrmDriver,
} from '@superdemo/contracts';
import type {
  AvailableNumberDto,
  CrmConnectionDto,
  CrmSyncLogRow,
  PhoneNumberDto,
  QueueDto,
  TestCrmConnectionOutput,
} from '@superdemo/contracts';
import { api, qs } from '@/lib/api';
import { dateTime, money, phone } from '@/lib/format';
import { CrmConfigPanel } from '@/components/crm-config';
import {
  Badge,
  Button,
  Card,
  Input,
  Metric,
  MockNotice,
  Select,
  SkeletonRows,
  Spinner,
  Table,
  Td,
  Th,
} from '@/components/composites';

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const numbers = useQuery({
    queryKey: ['numbers'],
    queryFn: () => api.get<PhoneNumberDto[]>('/numbers'),
  });
  const queues = useQuery({
    queryKey: ['queues'],
    queryFn: () => api.get<QueueDto[]>('/queues'),
  });
  const crm = useQuery({
    queryKey: ['crm-connection'],
    queryFn: () => api.get<CrmConnectionDto>('/crm/connection'),
  });
  const syncLog = useQuery({
    queryKey: ['crm-sync-log'],
    queryFn: () => api.get<CrmSyncLogRow[]>('/crm/sync-log'),
  });
  const roaming = useQuery({
    queryKey: ['roaming'],
    queryFn: () =>
      api.get<{
        remoteAgents: number;
        assumedMonthlyRoamingPerAgentUsd: number;
        currentMonthlyRoamingUsd: number;
        platformNumberCostUsd: number;
        estimatedMonthlySavingUsd: number;
        note: string;
      }>('/numbers/roaming-estimate'),
  });
  const settings = useQuery({
    queryKey: ['settings'],
    queryFn: () =>
      api.get<{ drivers: Record<string, string>; instituteName: string }>('/settings'),
  });

  /* ------------------------------ numbers -------------------------------- */

  const [contains, setContains] = useState('');
  const [showCatalogue, setShowCatalogue] = useState(false);

  const available = useQuery({
    queryKey: ['numbers-available', contains],
    queryFn: () =>
      api.get<AvailableNumberDto[]>(
        `/numbers/available${qs({ country: 'AE', contains: contains || undefined, limit: 12 })}`,
      ),
    enabled: showCatalogue,
  });

  const purchase = useMutation({
    mutationFn: (e164: string) => api.post('/numbers', { e164 }),
    onSuccess: () => {
      toast.success('Number provisioned');
      void queryClient.invalidateQueries({ queryKey: ['numbers'] });
      void queryClient.invalidateQueries({ queryKey: ['numbers-available'] });
      void queryClient.invalidateQueries({ queryKey: ['roaming'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const routeNumber = useMutation({
    mutationFn: ({ id, queueId }: { id: string; queueId: string }) =>
      api.patch(`/numbers/${id}`, { inboundQueueId: queueId || null }),
    onSuccess: () => {
      toast.success('Routing updated');
      void queryClient.invalidateQueries({ queryKey: ['numbers'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const testCrm = useMutation({
    mutationFn: () => api.post<TestCrmConnectionOutput>('/crm/test'),
    onSuccess: (r) => (r.ok ? toast.success(r.detail) : toast.error(r.detail)),
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6">
      <header className="mb-4">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <SettingsIcon className="size-5 text-primary" aria-hidden /> Settings
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Numbers, CRM connection, and active drivers.</p>
      </header>

      {/* Active drivers — the honesty panel */}
      <Card
        className="mb-4"
        title="Active drivers"
        subtitle="Which parts of the platform are real and which are simulated, at a glance"
      >
        <div className="flex flex-wrap gap-2 p-4">
          {settings.data
            ? Object.entries(settings.data.drivers).map(([k, v]) => {
                const mocked = ['simulated', 'mock', 'mock-whatsapp', 'scripted'].includes(v);
                return (
                  <Badge
                    key={k}
                    className={mocked ? 'bg-warn-soft text-warn' : 'bg-live-soft text-live'}
                  >
                    {k}: {v}
                  </Badge>
                );
              })
            : <Spinner />}
        </div>
        <p className="border-t border-border px-4 py-2 text-xs leading-relaxed text-muted-foreground">
          Amber = simulated external system, green = real. Every one of these is an env var away
          from production: <code className="text-[11px]">TELEPHONY_DRIVER</code>,{' '}
          <code className="text-[11px]">LLM_DRIVER</code>,{' '}
          <code className="text-[11px]">CRM_DRIVER</code>.
        </p>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* ---------------------------- numbers --------------------------- */}
        <Card
          className="xl:col-span-2"
          title="Phone numbers"
          subtitle="Virtual numbers replace physical SIMs for remote agents"
          action={
            <Button size="sm" onClick={() => setShowCatalogue((s) => !s)}>
              <ShoppingCart className="size-3.5" aria-hidden />
              {showCatalogue ? 'Hide catalogue' : 'Buy a number'}
            </Button>
          }
        >
          {numbers.isLoading ? (
            <SkeletonRows rows={4} cols={4} />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Number</Th>
                  <Th>Label</Th>
                  <Th>Routes to</Th>
                  <Th className="text-right">Calls (30d)</Th>
                  <Th className="text-right">Cost</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {numbers.data?.map((n) => (
                  <tr key={n.id}>
                    <Td className="tnum font-medium">{phone(n.e164)}</Td>
                    <Td className="text-xs">
                      {n.label}
                      {n.provider === 'existing-carrier' && (
                        <Badge className="ml-1.5 text-[10px]">their carrier</Badge>
                      )}
                    </Td>
                    <Td>
                      <Select
                        className="h-8 text-xs"
                        value={n.inboundQueueId ?? ''}
                        onChange={(e) =>
                          routeNumber.mutate({ id: n.id, queueId: e.target.value })
                        }
                      >
                        <option value="">Unrouted</option>
                        {queues.data?.map((q) => (
                          <option key={q.id} value={q.id}>
                            {q.name}
                          </option>
                        ))}
                      </Select>
                    </Td>
                    <Td className="tnum text-right text-xs">{n.calls30d ?? 0}</Td>
                    <Td className="tnum text-right text-xs">
                      {n.monthlyCostUsd ? `${money(n.monthlyCostUsd)}/mo` : '—'}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          {showCatalogue && (
            <div className="border-t border-border p-4">
              <MockNotice>
                This catalogue is simulated. Real UAE numbers must come from a TDRA-licensed carrier
                — UAE law reserves PSTN-terminating voice to licensed operators. The numbers listed
                are fictional and cannot receive calls.
              </MockNotice>

              <div className="mt-3 flex gap-2">
                <Input
                  placeholder="Filter by digits, e.g. 555"
                  value={contains}
                  onChange={(e) => setContains(e.target.value)}
                />
              </div>

              {available.isLoading ? (
                <Spinner />
              ) : (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {available.data?.map((a) => (
                    <li
                      key={a.e164}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="tnum truncate text-sm font-medium">{phone(a.e164)}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {a.region} · {money(a.monthlyCostUsd)}/mo · {a.capabilities.join(', ')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        loading={purchase.isPending}
                        onClick={() => purchase.mutate(a.e164)}
                      >
                        Buy
                      </Button>
                    </li>
                  ))}
                  {available.data?.length === 0 && (
                    <li className="text-xs text-muted-foreground">No numbers match that filter.</li>
                  )}
                </ul>
              )}
            </div>
          )}
        </Card>

        {/* ------------------------- roaming saving ----------------------- */}
        <Card
          title="The SIM-card question"
          subtitle="Their stated pain: remote agents on physical SIMs paying roaming"
        >
          {roaming.isLoading ? (
            <Spinner />
          ) : roaming.data ? (
            <div className="space-y-3 p-4">
              <div className="grid grid-cols-2 gap-2">
                <Metric label="Remote agents" value={roaming.data.remoteAgents} />
                <Metric
                  label="Est. monthly saving"
                  value={money(roaming.data.estimatedMonthlySavingUsd)}
                  tone="live"
                />
              </div>
              <dl className="space-y-1.5 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Current roaming (assumed)</dt>
                  <dd className="tnum">{money(roaming.data.currentMonthlyRoamingUsd)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Platform numbers</dt>
                  <dd className="tnum">{money(roaming.data.platformNumberCostUsd)}</dd>
                </div>
              </dl>
              <p className="rounded-lg bg-warn-soft px-3 py-2 text-[11px] leading-relaxed text-warn">
                {roaming.data.note}
              </p>
            </div>
          ) : null}
        </Card>
      </div>

      {/* ------------------------------ CRM ------------------------------- */}
      <Card
        className="mt-4"
        title={
          <span className="flex items-center gap-1.5">
            <PlugZap className="size-4" aria-hidden />
            {crm.data?.config
              ? CRM_DRIVER_LABELS[crm.data.config.provider]
              : 'CRM integration'}
          </span>
        }
        subtitle="Calls, recordings and AI transcripts land on the lead's timeline"
        action={
          <Button size="sm" loading={testCrm.isPending} onClick={() => testCrm.mutate()}>
            <RefreshCw className="size-3.5" aria-hidden /> Test connection
          </Button>
        }
      >
        {crm.isLoading ? (
          <Spinner />
        ) : crm.data ? (
          <>
            <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-4">
              <Metric
                label="Provider"
                value={CRM_DRIVER_LABELS[(crm.data.driver as CrmDriver) ?? 'mock']}
                tone={crm.data.driver === 'mock' ? 'warn' : 'live'}
                hint={crm.data.portalUrl ?? undefined}
              />
              <Metric label="Synced (24h)" value={crm.data.succeeded24h} tone="live" />
              <Metric
                label="Failed (24h)"
                value={crm.data.failed}
                tone={crm.data.failed > 0 ? 'danger' : 'default'}
              />
              <Metric
                label="Queued"
                value={crm.data.pending}
                hint="waiting in the outbox"
                tone={crm.data.pending > 10 ? 'warn' : 'default'}
              />
            </div>

            {crm.data.driver === 'mock' && (
              <div className="px-4 pb-4">
                <MockNotice>
                  No external CRM is connected for this centre, so sync runs against an in-process
                  mock. Connect Bitrix24 or Zoho CRM below — each centre connects its own, and
                  credentials are stored encrypted.
                </MockNotice>
              </div>
            )}

            <CrmConfigPanel config={crm.data.config} />

            <div className="border-t border-border">
              <p className="px-4 py-2 text-xs font-semibold text-muted-foreground">Recent sync activity</p>
              {syncLog.isLoading ? (
                <SkeletonRows rows={5} cols={4} />
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>Method</Th>
                      <Th>Entity</Th>
                      <Th>Status</Th>
                      <Th>Error</Th>
                      <Th className="text-right">When</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {syncLog.data?.slice(0, 15).map((r) => (
                      <tr key={r.id}>
                        <Td className="font-mono text-[11px]">{r.method}</Td>
                        <Td className="text-xs">{r.entityType}</Td>
                        <Td>
                          {r.status === 'SUCCESS' ? (
                            <Badge className="bg-live-soft text-live">
                              <CheckCircle2 className="size-3" aria-hidden /> ok
                            </Badge>
                          ) : r.status === 'FAILED' ? (
                            <Badge className="bg-destructive/10 text-destructive">
                              <XCircle className="size-3" aria-hidden /> failed
                            </Badge>
                          ) : (
                            <Badge>{r.status.toLowerCase()}</Badge>
                          )}
                        </Td>
                        <Td className="max-w-[20rem]">
                          <span className="block truncate text-[11px] text-destructive">
                            {r.error ?? ''}
                          </span>
                        </Td>
                        <Td className="text-right text-xs whitespace-nowrap text-muted-foreground">
                          {dateTime(r.createdAt)}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          </>
        ) : null}
      </Card>

      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground/70">
        <Phone className="size-3.5" aria-hidden />
        Recording-consent announcements are on by default — Dubai, India and Egypt all expect one.
      </p>
    </div>
  );
}
