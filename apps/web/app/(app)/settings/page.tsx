'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  DEMO_DIALER_LABELS,
  type CrmDriver,
  type DemoCallsView,
  type DemoDialerKind,
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
import { useSession } from '@/components/providers';
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
  const { refreshSession } = useSession();

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
      api.get<{
        drivers: Record<string, string>;
        instituteName: string;
        websiteEnabled: boolean;
        simulatorEnabled: boolean;
        demoCallsEnabled: boolean;
        slug: string | null;
      }>('/settings'),
  });

  /*
   * Each flag defaults to on when the row has not loaded yet — and, until now,
   * also whenever the field was simply absent from the response (an API build
   * that predates the flag, mid-rollout). Reading the raw field in three
   * places per toggle meant the checkbox and its own label could disagree on
   * exactly that undefined case: `x ?? true` checks the box, but `x ? … : …`
   * treats undefined as falsy and prints "is off" beside a checked box.
   * Normalising once here is what keeps every reader of the same value seeing
   * the same answer.
   */
  const websiteOn = settings.data?.websiteEnabled ?? true;
  const simulatorOn = settings.data?.simulatorEnabled ?? true;
  const demoCallsOn = settings.data?.demoCallsEnabled ?? true;

  /*
   * Refreshes the session as well as the settings row. The Website nav item is
   * drawn from the session, so without that the toggle appears to do nothing
   * until the next reload — the same reason refreshSession exists for branding.
   */
  /*
   * The three demo dialers, mirrored from the Demo calls page.
   *
   * Same endpoint and same controls, because the two audiences arrive at
   * different moments: somebody setting a centre up works through Settings top
   * to bottom, and somebody about to show it opens Demo calls and expects to
   * fix a slot where they found it.
   */
  const demoCalls = useQuery({
    queryKey: ['demo-calls'],
    queryFn: () => api.get<DemoCallsView>('/demo-calls'),
    // The API now refuses this route once demoCallsEnabled is off, and firing
    // a request doomed to 404 on every load of this page would just print a
    // console error nobody asked for — undefined here means "not loaded yet",
    // not "off", so the very first paint still fetches as before.
    enabled: demoCallsOn,
  });

  const setDemoCallsEnabled = useMutation({
    mutationFn: (demoCallsEnabled: boolean) => api.put('/settings', { demoCallsEnabled }),
    onSuccess: (_r, demoCallsEnabled) => {
      toast.success(
        demoCallsEnabled
          ? 'Demo calls enabled'
          : 'Demo calls disabled — the section is hidden and its endpoints refuse',
      );
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
      if (demoCallsEnabled) void queryClient.invalidateQueries({ queryKey: ['demo-calls'] });
      void refreshSession();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const setSimulatorEnabled = useMutation({
    mutationFn: (simulatorEnabled: boolean) => api.put('/settings', { simulatorEnabled }),
    onSuccess: (_r, simulatorEnabled) => {
      toast.success(
        simulatorEnabled
          ? 'Simulator enabled'
          : 'Simulator disabled — the section and its shortcuts are hidden',
      );
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
      void refreshSession();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const setWebsiteEnabled = useMutation({
    mutationFn: (websiteEnabled: boolean) => api.put('/settings', { websiteEnabled }),
    onSuccess: (_r, websiteEnabled) => {
      toast.success(
        websiteEnabled
          ? 'Website enabled — the page is live and the section is back in the sidebar'
          : 'Website disabled — the public page now returns 404. Nothing was deleted.',
      );
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
      void refreshSession();
    },
    onError: (e) => toast.error((e as Error).message),
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
        <p className="mt-0.5 text-sm text-muted-foreground">
          Website, numbers, CRM connection, and active drivers.
        </p>
      </header>

      {/*
        Website on/off.
        First card because it is the one setting that changes what the rest of
        the product looks like — it adds or removes a whole section — and
        because a client who does not want a public page should not have to
        scroll past numbers and CRM to say so.
      */}
      <Card
        className="mb-4"
        title="Website"
        subtitle="A public landing page for this centre, at its own handle"
        contentClassName="p-4"
      >
        {settings.isLoading ? (
          <Spinner label="Loading…" />
        ) : (
          <label className="flex cursor-pointer items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
              checked={websiteOn}
              disabled={setWebsiteEnabled.isPending}
              onChange={(e) => setWebsiteEnabled.mutate(e.target.checked)}
            />
            <span>
              <span className="font-medium">
                {websiteOn ? 'Website is on' : 'Website is off'}
              </span>
              <span className="mt-0.5 block max-w-prose text-[11px] leading-relaxed text-muted-foreground">
                {websiteOn ? (
                  <>
                    Your page is served at{' '}
                    <code className="font-mono">/{settings.data?.slug ?? ''}</code>, and the Website
                    section in the sidebar is where you edit it. Turn this off if you already have a
                    website — the public page stops resolving and the section disappears, but nothing
                    you have written is deleted.
                  </>
                ) : (
                  <>
                    Nothing is served at{' '}
                    <code className="font-mono">/{settings.data?.slug ?? ''}</code> and the Website
                    section is hidden. Turning it back on restores the page exactly as it was —
                    disabling never deleted the content.
                  </>
                )}
              </span>
            </span>
          </label>
        )}
      </Card>

      <Card
        className="mb-4"
        title="Call simulator"
        subtitle="A scripted caller driven through the real routing — no carrier involved"
        contentClassName="p-4"
      >
        {settings.isLoading ? (
          <Spinner label="Loading…" />
        ) : (
          <label className="flex cursor-pointer items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
              checked={simulatorOn}
              disabled={setSimulatorEnabled.isPending}
              onChange={(e) => setSimulatorEnabled.mutate(e.target.checked)}
            />
            <span>
              <span className="font-medium">
                {simulatorOn ? 'Simulator is on' : 'Simulator is off'}
              </span>
              <span className="mt-0.5 block max-w-prose text-[11px] leading-relaxed text-muted-foreground">
                {simulatorOn ? (
                  <>
                    The Simulator section invents a caller and walks a scripted conversation through
                    your real routing, AI handoff and queueing. Useful while setting a centre up and
                    for training; turn it off once you are live on real traffic and a button that
                    invents a call is a distraction.
                  </>
                ) : (
                  <>
                    The Simulator section is hidden, along with the &ldquo;Simulate a call&rdquo;
                    shortcuts on Live ops, and the endpoints refuse. Real calls, the softphone and
                    everything else are untouched.
                  </>
                )}
              </span>
            </span>
          </label>
        )}
      </Card>

      <Card
        className="mb-4"
        title="Demo calls"
        subtitle="Three Dograh-backed dialer slots — which agent answers each is set by the platform operator"
        contentClassName="p-4"
      >
        {settings.isLoading ? (
          <Spinner label="Loading…" />
        ) : (
          <label className="flex cursor-pointer items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
              checked={demoCallsOn}
              disabled={setDemoCallsEnabled.isPending}
              onChange={(e) => setDemoCallsEnabled.mutate(e.target.checked)}
            />
            <span>
              <span className="font-medium">
                {demoCallsOn ? 'Demo calls is on' : 'Demo calls is off'}
              </span>
              <span className="mt-0.5 block max-w-prose text-[11px] leading-relaxed text-muted-foreground">
                {demoCallsOn ? (
                  <>
                    Inbound, outbound and info slots, ready to ring or talk to in the browser from{' '}
                    <Link href="/demo-calls" className="underline underline-offset-2">
                      Demo calls
                    </Link>
                    .
                  </>
                ) : (
                  <>
                    The Demo calls section is hidden and its endpoints refuse. Turning this back
                    on does not clear any agent already wired to a slot.
                  </>
                )}
              </span>
            </span>
          </label>
        )}

        {demoCallsOn &&
          (demoCalls.isLoading ? (
            <div className="mt-3">
              <Spinner label="Loading…" />
            </div>
          ) : demoCalls.isError ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Could not read the dialers — {(demoCalls.error as Error).message}
            </p>
          ) : !demoCalls.data?.dograhConnected ? (
            <p className="mt-3 max-w-prose text-sm text-muted-foreground">
              No voice platform is connected for this centre yet. Your platform operator sets this
              up.
            </p>
          ) : (
            <>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {demoCalls.data.dialers.map((dialer) => (
                  <div key={dialer.kind} className="rounded-md border border-border p-3">
                    <p className="text-sm font-medium">{DEMO_DIALER_LABELS[dialer.kind].label}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      {DEMO_DIALER_LABELS[dialer.kind].note}
                    </p>
                    <p className="mt-2">
                      <Badge dot={dialer.ready ? 'bg-live' : 'bg-muted-foreground'}>
                        {dialer.ready ? 'Ready' : dialer.enabled ? 'Not set up' : 'Off'}
                      </Badge>
                    </p>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      {dialer.workflowName || 'No agent chosen'}
                    </p>
                  </div>
                ))}
              </div>
              {/*
                Read-only, deliberately.
                Choosing an agent means listing every workflow on the voice host,
                and a centre without its own key is on the deployment's — so that
                list is other clients' agents. Picking from it is the operator's
                act, not a tenant admin's. See PlatformVoiceController.
              */}
              <p className="mt-3 max-w-prose text-[11px] leading-relaxed text-muted-foreground">
                Changing which agent answers is done by your platform operator — the agent list
                spans the whole voice host, so it is not shown inside a single centre.
              </p>
            </>
          ))}
      </Card>

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
