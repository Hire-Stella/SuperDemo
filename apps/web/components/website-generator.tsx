'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Globe, PhoneCall, RefreshCw, Sparkles, TriangleAlert } from 'lucide-react';
import {
  DEFAULT_DIALLING_COUNTRY,
  DIALLING_COUNTRIES,
  ENRICH_STATUS_LABELS,
  type DemoCallOutput,
  type DograhConnectionView,
  type EnrichmentView,
} from '@superdemo/contracts';
import { api } from '@/lib/api';
import { Badge, Button, Card, Input, Label, Select, Spinner } from '@/components/composites';
import { dateTime } from '@/lib/format';

/**
 * The website-generated half of a centre: what was built from their URL, and a
 * phone box to hear the result.
 *
 * Two things in one card because they are one workflow. An operator regenerates
 * the page and agent from a website and then immediately wants to ring a number
 * and hear whether it worked; splitting those across two cards would put a
 * scroll between an action and its only real verification.
 */
export function WebsiteGenerator() {
  const queryClient = useQueryClient();

  const enrichment = useQuery({
    queryKey: ['enrichment'],
    queryFn: () => api.get<EnrichmentView>('/sites/mine/dograh/enrichment'),
    /**
     * Poll only while something is happening.
     *
     * The pipeline is a scrape, an LLM call and a workflow build — tens of
     * seconds — and the operator is watching. Polling a settled centre forever
     * would be a request every three seconds for the life of the tab.
     */
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === 'queued' || s === 'running' ? 3000 : false;
    },
  });

  const dograh = useQuery({
    queryKey: ['dograh'],
    queryFn: () => api.get<DograhConnectionView>('/sites/mine/dograh'),
  });

  const [url, setUrl] = useState<string | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState(DEFAULT_DIALLING_COUNTRY);
  const [note, setNote] = useState('');
  const [lastCall, setLastCall] = useState<DemoCallOutput | null>(null);

  const regenerate = useMutation({
    mutationFn: (body: { websiteUrl: string; overwriteContent: boolean }) =>
      api.post<{ ok: true }>('/sites/mine/dograh/enrichment', body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['enrichment'] });
      toast.success('Reading the website — this takes under a minute');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const demoCall = useMutation({
    mutationFn: (body: { phone: string; country: string; note?: string }) =>
      api.post<DemoCallOutput>('/sites/mine/dograh/demo-call', body),
    onSuccess: (r) => {
      setLastCall(r);
      if (r.ok) toast.success(r.detail);
      else toast.error(r.detail);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (enrichment.isLoading) {
    return (
      <Card className="mt-4" title="Built from their website">
        <Spinner label="Checking…" />
      </Card>
    );
  }
  if (enrichment.isError) {
    return (
      <Card className="mt-4" title="Built from their website">
        <p className="p-4 text-sm text-muted-foreground">
          Could not read the status — {(enrichment.error as Error).message}
        </p>
      </Card>
    );
  }

  const e = enrichment.data!;
  const status = ENRICH_STATUS_LABELS[e.status];
  const busy = e.status === 'queued' || e.status === 'running';
  const href = url ?? e.websiteUrl ?? '';
  const canCall = dograh.data?.canDemoCall ?? false;

  return (
    <Card
      className="mt-4"
      title={
        <span className="flex items-center gap-2">
          <Sparkles className="size-4" aria-hidden />
          Built from their website
          <Badge
            dot={
              e.status === 'ready'
                ? 'bg-live'
                : e.status === 'failed'
                  ? 'bg-destructive'
                  : busy
                    ? 'bg-amber-500'
                    : 'bg-muted-foreground'
            }
          >
            {status.label}
          </Badge>
        </span>
      }
      subtitle="Read the client's own site to write this page and brief the voice agent"
    >
      <div className="grid gap-4 p-4">
        {/* ---------------------------- regenerate ---------------------------- */}
        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <Label htmlFor="enrich-url">Their website</Label>
            <Input
              id="enrich-url"
              type="url"
              className="mt-1.5"
              placeholder="https://theirbusiness.com"
              value={href}
              onChange={(ev) => setUrl(ev.target.value)}
              disabled={busy}
            />
          </div>
          <Button
            onClick={() => regenerate.mutate({ websiteUrl: href, overwriteContent: overwrite })}
            disabled={!href || busy || regenerate.isPending}
          >
            <RefreshCw className={`size-4 ${busy ? 'animate-spin' : ''}`} aria-hidden />
            {busy ? 'Working…' : e.status === 'none' ? 'Generate' : 'Regenerate'}
          </Button>
        </div>

        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={overwrite}
            onChange={(ev) => setOverwrite(ev.target.checked)}
            disabled={busy}
          />
          <span>
            Replace the copy on this page. Off by default, so retrying after a failure cannot quietly
            overwrite wording someone has edited by hand — the voice agent is rebuilt either way.
          </span>
        </label>

        <p className="rounded-lg bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          {status.note}
          {e.status === 'ready' && e.enrichedAt ? ` Generated ${dateTime(e.enrichedAt)}.` : ''}
          {e.sourceUrl && e.status !== 'none' ? ` Read from ${e.sourceUrl}.` : ''}
        </p>

        {e.error ? (
          <p className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-xs leading-relaxed text-destructive">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {e.error}
          </p>
        ) : null}

        {e.workflowId ? (
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <Globe className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Voice agent: <strong className="text-foreground">{e.workflowName ?? `#${e.workflowId}`}</strong>
              {e.hasEmbedToken ? ' — live on this page as “Talk to Stella”.' : ' — not yet on the page.'}
            </span>
          </p>
        ) : null}

        {/* ---------------------------- demo call ----------------------------- */}
        <div className="grid gap-2 border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <PhoneCall className="size-4 text-muted-foreground" aria-hidden />
            <span className="text-sm font-medium">Hear it — call a number now</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-[7rem_1fr_auto] sm:items-end">
            <div>
              <Label htmlFor="demo-country">Country</Label>
              <Select
                id="demo-country"
                className="mt-1.5"
                value={country}
                onChange={(ev) => setCountry(ev.target.value)}
              >
                {DIALLING_COUNTRIES.map((c) => (
                  <option key={`${c.code}-${c.dial}`} value={c.code}>
                    {c.flag} +{c.dial}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="demo-phone">Number</Label>
              <Input
                id="demo-phone"
                className="mt-1.5"
                inputMode="tel"
                placeholder="50 123 4567"
                value={phone}
                onChange={(ev) => setPhone(ev.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => demoCall.mutate({ phone, country, note: note || undefined })}
              disabled={!phone || !canCall || demoCall.isPending}
            >
              {demoCall.isPending ? 'Dialling…' : 'Call me'}
            </Button>
          </div>
          <Input
            aria-label="Anything the agent should know first"
            placeholder="Optional: anything the agent should know before it speaks"
            value={note}
            onChange={(ev) => setNote(ev.target.value)}
          />
          <p className="rounded-lg bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
            {canCall ? (
              <>
                This rings a real telephone on the client&rsquo;s own carrier account and their agent
                answers it — so use a number you are allowed to ring. Three calls a minute. It does
                not go through the dialler, so there is no campaign, pacing or opt-out list in front
                of it: the number you type is the number that rings.
              </>
            ) : (
              <>
                No agent is connected yet, so there is nothing to call with. Generate one from the
                website above, or pick a workflow in <strong>Voice agent</strong>.
              </>
            )}
          </p>
          {lastCall?.dialled ? (
            <p className="text-xs text-muted-foreground">
              Dialled <strong className="text-foreground">{lastCall.dialled}</strong>
              {lastCall.workflowRunId ? ` — Dograh run #${lastCall.workflowRunId}` : ''}
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
