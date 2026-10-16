'use client';

import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  DEMO_DIALER_LABELS,
  type DemoCallsView,
  type DemoDialerKind,
} from '@superdemo/contracts';
import { api } from '@/lib/api';
import { CalendarCheck, Loader2, Sparkles } from 'lucide-react';
import { Badge, Button, Card, Select, Spinner } from '@/components/composites';

/**
 * The three demo-call slots, wired by the platform operator.
 *
 * This is the picker that used to sit inside a centre's own Settings. It moved
 * because the list behind it is every workflow on the voice host — and a centre
 * without its own Dograh key is using the deployment's, so that list names
 * other clients' agents. See apps/api/src/platform/platform-voice.controller.ts.
 *
 * A centre's admin keeps the half that only concerns them: they can see which
 * agent answers each slot, ring it, and talk to it in the browser.
 */
export function PlatformDialers({ orgId }: { orgId: string }) {
  const queryClient = useQueryClient();
  const base = `/platform/orgs/${orgId}/voice`;

  const view = useQuery({
    queryKey: ['platform-voice', orgId],
    queryFn: async () => (await api.get<{ demoCalls: DemoCallsView }>(base)).demoCalls,
  });

  const save = useMutation({
    mutationFn: (body: { kind: DemoDialerKind; enabled?: boolean; workflowId?: number | null }) =>
      api.put<DemoCallsView>(`${base}/dialers`, body),
    onSuccess: (r) => queryClient.setQueryData(['platform-voice', orgId], r),
    onError: (e) => toast.error((e as Error).message),
  });

  /*
   * The background build's progress, polled only while one is running.
   *
   * Separate from the view above so the slot pickers do not re-render, and
   * lose a half-open dropdown, every five seconds while agents are built.
   */
  const build = useQuery({
    queryKey: ['platform-voice-build', orgId],
    queryFn: async () =>
      (await api.get<{ build: { status: string; error: string | null } }>(base)).build,
    refetchInterval: (q) =>
      q.state.data && ['queued', 'running'].includes(q.state.data.status) ? 5000 : false,
  });
  const building = ['queued', 'running'].includes(build.data?.status ?? '');

  // When a build finishes, show the slots it filled.
  const wasBuilding = useRef(false);
  useEffect(() => {
    if (wasBuilding.current && !building) {
      void queryClient.invalidateQueries({ queryKey: ['platform-voice', orgId] });
      // A centre with no page agent gets one from the build, shown above.
      void queryClient.invalidateQueries({ queryKey: ['dograh', orgId] });
      if (build.data?.status === 'ready') toast.success('Demo agents are ready');
      else if (build.data?.status === 'failed' && build.data.error) toast.error(build.data.error);
    }
    wasBuilding.current = building;
  }, [building, build.data, orgId, queryClient]);

  const missing = (view.data?.dialers ?? []).filter((d) => !d.workflowId).map((d) => d.kind);

  const buildAgents = useMutation({
    mutationFn: () => api.post<{ queued: true }>(`${base}/build-agents`, { kinds: missing }),
    onSuccess: () => {
      toast.success('Building demo agents — this takes two or three minutes');
      void queryClient.invalidateQueries({ queryKey: ['platform-voice-build', orgId] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const booking = useMutation({
    mutationFn: () =>
      api.post<{ ok: boolean; detail: string; workflows: number[] }>(`${base}/booking`),
    onSuccess: (r) => (r.ok ? toast.success(r.detail) : toast.error(r.detail)),
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <Card
      className="mt-3"
      title="Demo calls"
      subtitle="Which agent answers each slot on this centre's Demo calls page"
      contentClassName="p-4"
    >
      {view.isLoading ? (
        <Spinner label="Loading…" />
      ) : view.isError ? (
        <p className="text-sm text-muted-foreground">
          Could not read the dialers — {(view.error as Error).message}
        </p>
      ) : !view.data?.dograhConnected ? (
        <p className="max-w-prose text-sm text-muted-foreground">
          Connect a voice host and key above first — there is nothing to point these at yet.
        </p>
      ) : (
        <>
          {view.data.workflowsError && (
            <p className="mb-3 max-w-prose text-[11px] leading-relaxed text-muted-foreground">
              The agent list could not be fetched — {view.data.workflowsError}. Slots already set
              up keep working; you cannot change them until this clears.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            {view.data.dialers.map((dialer) => (
              <div key={dialer.kind} className="rounded-md border border-border p-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    className="size-4 shrink-0 accent-[var(--primary)]"
                    checked={dialer.enabled}
                    disabled={save.isPending}
                    onChange={(e) => save.mutate({ kind: dialer.kind, enabled: e.target.checked })}
                  />
                  {DEMO_DIALER_LABELS[dialer.kind].label}
                </label>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {DEMO_DIALER_LABELS[dialer.kind].note}
                </p>
                <p className="mt-2">
                  <Badge dot={dialer.ready ? 'bg-live' : 'bg-muted-foreground'}>
                    {dialer.ready ? 'Ready' : dialer.enabled ? 'Not set up' : 'Off'}
                  </Badge>
                </p>
                <Select
                  aria-label={`Agent for the ${DEMO_DIALER_LABELS[dialer.kind].label} dialer`}
                  className="mt-2"
                  value={dialer.workflowId ?? ''}
                  disabled={save.isPending || view.data!.workflows.length === 0}
                  onChange={(e) =>
                    save.mutate({
                      kind: dialer.kind,
                      workflowId: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                >
                  <option value="">
                    {view.data!.workflows.length === 0 ? 'No agents available' : 'Choose an agent…'}
                  </option>
                  {view.data!.workflows.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </div>

          {/*
            For centres whose slots nothing ever filled: anything made before
            agents were built automatically, or made without a website.
          */}
          {(missing.length > 0 || building) && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted/40 p-3">
              <Button onClick={() => buildAgents.mutate()} disabled={building || buildAgents.isPending}>
                {building ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Sparkles className="size-4" aria-hidden />
                )}
                {building
                  ? 'Building agents…'
                  : `Build ${missing.length === 3 ? 'all three' : missing.map((k) => DEMO_DIALER_LABELS[k].label.toLowerCase()).join(' and ')} agent${missing.length === 1 ? '' : 's'}`}
              </Button>
              <p className="max-w-prose text-[11px] leading-relaxed text-muted-foreground">
                {building
                  ? 'The voice provider is writing each agent from this centre\u2019s website or its own copy. Keep this open or come back in a few minutes.'
                  : 'Creates agents for the empty slots from this centre\u2019s website — or, without one, from its landing page and knowledge — and switches on calendar booking. The landing page\u2019s agent becomes the inbound one.'}
              </p>
            </div>
          )}

          {/*
            Booking rides on whichever agents are wired above, so it is a
            separate press after choosing them rather than a side effect of
            each pick. Safe to press again: tools and prompt are not duplicated.
          */}
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3">
            <Button
              variant="outline"
              onClick={() => booking.mutate()}
              disabled={booking.isPending}
            >
              <CalendarCheck className="size-4" aria-hidden />
              {booking.isPending ? 'Enabling…' : 'Enable calendar booking'}
            </Button>
            <p className="max-w-prose text-[11px] leading-relaxed text-muted-foreground">
              Gives the landing-page, inbound and outbound agents tools to check free times and
              book into this centre&apos;s Calendar during a call. Press again after changing
              agents.
            </p>
          </div>
        </>
      )}
    </Card>
  );
}
