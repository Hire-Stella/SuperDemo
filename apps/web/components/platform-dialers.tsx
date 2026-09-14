'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  DEMO_DIALER_LABELS,
  type DemoCallsView,
  type DemoDialerKind,
} from '@superdemo/contracts';
import { api } from '@/lib/api';
import { Badge, Card, Select, Spinner } from '@/components/composites';

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
        </>
      )}
    </Card>
  );
}
