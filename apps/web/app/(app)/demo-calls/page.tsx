'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Mic, PhoneOutgoing, X } from 'lucide-react';
import {
  DEFAULT_DIALLING_COUNTRY,
  DEMO_DIALER_LABELS,
  DIALLING_COUNTRIES,
  type DemoCallOutput,
  type DemoCallsView,
  type DemoDialerKind,
  type DemoDialerView,
  type WebCallOutput,
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

  const view = useQuery({
    queryKey: ['demo-calls'],
    queryFn: () => api.get<DemoCallsView>('/demo-calls'),
  });

  /*
   * One web call at a time, held here rather than in a card.
   *
   * Dograh's widget bundle gives every floating instance the same element ids —
   * `dograh-widget-root` and `dograh-widget-cta` — and knows exactly one
   * position. Two mounted at once do not overlap, they fight over an id. So the
   * page owns which slot is talking and there is only ever one script tag.
   */
  const [webCall, setWebCall] = useState<{ kind: DemoDialerKind; src: string } | null>(null);

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
          Ring one of this centre&rsquo;s agents, or talk to it in the browser. Which agent
          answers each slot is set in{' '}
          <Link href="/settings" className="underline underline-offset-2">
            Settings
          </Link>
          .
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
            configured still dial and still talk; you just cannot change which agent they use in
            Settings until this clears.
          </p>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {d.dialers.map((dialer) => (
          <DialerCard
            key={dialer.kind}
            dialer={dialer}
            talking={webCall?.kind === dialer.kind}
            anyTalking={Boolean(webCall)}
            onWebCall={(src) => setWebCall({ kind: dialer.kind, src })}
          />
        ))}
      </div>

      {webCall && <WebCallHost kind={webCall.kind} src={webCall.src} />}
    </div>
  );
}

/**
 * Mounts Dograh's widget for one slot, and takes it away again.
 *
 * The bundle renders a floating button into elements it creates itself and
 * offers no teardown, so closing removes those elements by hand. What it cannot
 * undo is the script having run: switching to a second agent in the same page
 * load may keep talking to the first, which is why the other cards say so
 * rather than pretending otherwise.
 */
function WebCallHost({ kind, src }: { kind: DemoDialerKind; src: string }) {
  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = src;
    tag.async = true;
    tag.dataset.dograhContext = JSON.stringify({
      surface: 'dashboard-demo-calls',
      dialer: kind,
      today: new Date().toISOString().slice(0, 10),
    });
    document.body.appendChild(tag);

    return () => {
      tag.remove();
      /*
       * `querySelectorAll`, not `getElementById`: the bundle ends up with more
       * than one element carrying `dograh-widget-root`, so removing "the" one
       * by id left a stray behind that the next mount then fought with. Matching
       * the id prefix also catches whatever else it names that way.
       */
      document
        .querySelectorAll('[id^="dograh-widget"]')
        .forEach((el) => el.remove());
    };
  }, [src, kind]);

  return (
    // Bottom centre, not bottom left: the sidebar's presence and theme controls
    // live in that corner, and a notice sitting on top of them trades one
    // problem for a worse one.
    <div className="fixed bottom-4 left-1/2 z-50 max-w-sm -translate-x-1/2 rounded-lg border border-border bg-popover p-3 text-xs shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <p className="leading-relaxed text-muted-foreground">
          The <strong className="text-foreground">{DEMO_DIALER_LABELS[kind].label}</strong> agent is
          loaded. Its call button is in the bottom-right corner — press it and allow the
          microphone.
        </p>
        <button
          type="button"
          aria-label="Finish and reload"
          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => window.location.reload()}
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      {/*
        Hanging up inside Dograh's own widget tells this page nothing — the
        bundle fires no event we can listen for — so the three cards would
        otherwise sit locked after a finished call with no obvious way back.
        Hence an explicit way out, said in words rather than a bare icon.

        Reload rather than clearing state: the script has already run and can
        stay bound to this workflow, so dropping the React state alone would
        re-enable the other two cards while a stale bundle is still live —
        offering agents that would quietly keep talking to this one. A fresh
        page is the only honest way to hand the other two back.
      */}
      <button
        type="button"
        className="mt-2.5 w-full rounded-md border border-border px-2 py-1.5 font-medium transition hover:bg-muted"
        onClick={() => window.location.reload()}
      >
        Done — reload to free the other agents
      </button>
    </div>
  );
}

function DialerCard({
  dialer,
  talking,
  anyTalking,
  onWebCall,
}: {
  dialer: DemoDialerView;
  talking: boolean;
  anyTalking: boolean;
  onWebCall: (src: string) => void;
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

  const webCall = useMutation({
    mutationFn: () => api.post<WebCallOutput>('/demo-calls/web-call', { kind: dialer.kind }),
    onSuccess: (r) => {
      if (!r.ok || !r.scriptSrc) {
        toast.error(r.detail);
        return;
      }
      onWebCall(r.scriptSrc);
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

        {/*
          Which agent answers, read-only.
          Configuration lives in Settings: these cards sit in front of a client
          while somebody presses the call button, and a dropdown one misclick
          away from it is the wrong place to keep the wiring.
        */}
        <p className="text-sm">
          <span className="text-muted-foreground">Agent: </span>
          {dialer.workflowName ? (
            <span className="font-medium">{dialer.workflowName}</span>
          ) : (
            <span className="text-muted-foreground">none chosen</span>
          )}
        </p>

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

        {/*
          Talk in the browser: no number, no carrier, no cost. Offered second
          because the phone path is the one that proves the whole loop, but it
          is the faster of the two to try.
        */}
        {/*
          While this slot is loaded the button becomes the way out, not a dead
          label. Dograh tells us nothing when a call ends, so if the only exit
          were the floating notice's icon, a finished call would leave all three
          cards stuck — which is exactly what it did.
        */}
        <Button
          variant={talking ? 'outline' : 'default'}
          disabled={!dialer.canWebCall || webCall.isPending || (anyTalking && !talking)}
          title={
            anyTalking && !talking
              ? 'Finish the other browser call first — the widget only supports one at a time'
              : undefined
          }
          onClick={() => (talking ? window.location.reload() : webCall.mutate())}
        >
          <Mic className="size-4" aria-hidden />
          {talking
            ? 'Done — reload to free the others'
            : webCall.isPending
              ? 'Connecting…'
              : 'Talk in browser'}
        </Button>

        {!dialer.ready && (
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {dialer.blockedReason ?? 'This dialer is switched off.'}{' '}
            <Link href="/settings" className="underline underline-offset-2">
              Set it up in Settings
            </Link>
            .
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
