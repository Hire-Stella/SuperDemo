'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PhoneOutgoing } from 'lucide-react';
import {
  DEFAULT_DIALLING_COUNTRY,
  DEMO_DIALER_LABELS,
  DIALLING_COUNTRIES,
  type DemoCallOutput,
  type DemoCallsView,
  type DemoDialerKind,
  type DemoDialerView,
} from '@superdemo/contracts';
import { api } from '@/lib/api';
import { Badge, Button, Card, Input, Select, Spinner } from '@/components/composites';

/**
 * Three dialers, one page.
 *
 * Each card is both the switch and the button: the agent a slot points at is
 * chosen here rather than only in Settings, because the moment anyone discovers
 * a slot is unconfigured is the moment they are trying to use it, and sending
 * them to another page to fix it is how a demo stalls. Settings carries the
 * same controls for whoever is setting a centre up rather than testing it.
 */
export default function DemoCallsPage() {
  const queryClient = useQueryClient();

  const view = useQuery({
    queryKey: ['demo-calls'],
    queryFn: () => api.get<DemoCallsView>('/demo-calls'),
  });

  const save = useMutation({
    mutationFn: (body: { kind: DemoDialerKind; enabled?: boolean; workflowId?: number | null }) =>
      api.put<DemoCallsView>('/demo-calls', body),
    onSuccess: (r) => {
      queryClient.setQueryData(['demo-calls'], r);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (view.isLoading) return <Spinner label="Loading dialers…" />;
  if (view.isError) {
    return (
      <p className="p-6 text-sm text-destructive">{(view.error as Error).message}</p>
    );
  }

  const d = view.data!;

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-6">
      <header className="mb-4">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <PhoneOutgoing className="size-5 text-primary" aria-hidden /> Demo calls
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Three agents, three buttons. Point each slot at one of this centre&rsquo;s Dograh
          workflows and hear it answer.
        </p>
      </header>

      {!d.dograhConnected && (
        <Card className="mb-4" title="No Dograh connected" contentClassName="p-4">
          <p className="max-w-prose text-sm text-muted-foreground">
            These dialers ring through this centre&rsquo;s own Dograh, and none is configured yet.
            Connect a host and key on the{' '}
            <Link href="/website" className="underline underline-offset-2">
              Website
            </Link>{' '}
            page, then come back and choose an agent for each slot.
          </p>
        </Card>
      )}

      {d.workflowsError && (
        <Card className="mb-4" title="Could not list agents" contentClassName="p-4">
          <p className="max-w-prose text-sm text-muted-foreground">
            Dograh answered, but not with a workflow list — {d.workflowsError}. Slots already
            configured still dial; you just cannot change which agent they use until this clears.
          </p>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {d.dialers.map((dialer) => (
          <DialerCard
            key={dialer.kind}
            dialer={dialer}
            workflows={d.workflows}
            connected={d.dograhConnected}
            saving={save.isPending}
            onSave={(body) => save.mutate({ kind: dialer.kind, ...body })}
          />
        ))}
      </div>
    </div>
  );
}

function DialerCard({
  dialer,
  workflows,
  connected,
  saving,
  onSave,
}: {
  dialer: DemoDialerView;
  workflows: DemoCallsView['workflows'];
  connected: boolean;
  saving: boolean;
  onSave: (body: { enabled?: boolean; workflowId?: number | null }) => void;
}) {
  const meta = DEMO_DIALER_LABELS[dialer.kind];
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState(DEFAULT_DIALLING_COUNTRY);
  const [note, setNote] = useState('');
  const [last, setLast] = useState<DemoCallOutput | null>(null);

  const call = useMutation({
    mutationFn: (body: { phone: string; country: string; note?: string }) =>
      api.post<DemoCallOutput>('/demo-calls/call', { kind: dialer.kind, ...body }),
    onSuccess: (r) => {
      setLast(r);
      if (r.ok) toast.success(r.detail);
      else toast.error(r.detail);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          {meta.label}
          <Badge dot={dialer.ready ? 'bg-live' : 'bg-muted-foreground'}>
            {dialer.ready ? 'Ready' : dialer.enabled ? 'Not set up' : 'Off'}
          </Badge>
        </span>
      }
      subtitle={meta.note}
      contentClassName="p-4"
    >
      <div className="grid gap-3">
        <p className="text-[11px] leading-relaxed text-muted-foreground">{meta.hint}</p>

        {/* ------------------------------ setup ------------------------------ */}
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            className="size-4 shrink-0 accent-[var(--primary)]"
            checked={dialer.enabled}
            disabled={!connected || saving}
            onChange={(e) => onSave({ enabled: e.target.checked })}
          />
          <span>Use this dialer</span>
        </label>

        <label className="block text-sm">
          <span className="text-muted-foreground">Agent</span>
          <Select
            className="mt-1.5"
            value={dialer.workflowId ?? ''}
            disabled={!connected || saving || workflows.length === 0}
            onChange={(e) =>
              onSave({ workflowId: e.target.value ? Number(e.target.value) : null })
            }
          >
            <option value="">
              {workflows.length === 0 ? 'No agents available' : 'Choose an agent…'}
            </option>
            {workflows.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} · {w.status}
              </option>
            ))}
          </Select>
          {dialer.workflowName && !workflows.some((w) => w.id === dialer.workflowId) && (
            <span className="mt-1 block text-[11px] text-muted-foreground">
              Currently {dialer.workflowName}, which is not in the list Dograh returned.
            </span>
          )}
        </label>

        {/* ------------------------------ dial ------------------------------- */}
        <div className="grid grid-cols-[7rem_1fr] gap-2">
          <Select
            aria-label={`Country for the ${meta.label.toLowerCase()} call`}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {DIALLING_COUNTRIES.map((c) => (
              <option key={`${c.code}-${c.dial}`} value={c.code}>
                {c.flag} +{c.dial}
              </option>
            ))}
          </Select>
          <Input
            aria-label={`Number for the ${meta.label.toLowerCase()} call`}
            inputMode="tel"
            placeholder="50 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <Input
          aria-label="Anything the agent should know first"
          placeholder="Optional: what the agent should know"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <Button
          variant="outline"
          disabled={!phone || !dialer.ready || call.isPending}
          onClick={() => call.mutate({ phone, country, note: note || undefined })}
        >
          {call.isPending ? 'Dialling…' : `Call me — ${meta.label.toLowerCase()}`}
        </Button>

        {!dialer.ready && (
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {dialer.blockedReason ??
              'Switch this dialer on and choose an agent before it can place a call.'}
          </p>
        )}

        {last?.dialled && (
          <p className="text-[11px] text-muted-foreground">
            Last dialled <span className="font-mono">{last.dialled}</span>
            {last.workflowRunId ? ` · run ${last.workflowRunId}` : ''}
          </p>
        )}
      </div>
    </Card>
  );
}
