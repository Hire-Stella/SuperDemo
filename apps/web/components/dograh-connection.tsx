'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, Link2, Mic, PlugZap, TriangleAlert } from 'lucide-react';
import {
  DOGRAH_CALL_MODE_LABELS,
  type ConnectDograhSiteOutput,
  type DograhCallMode,
  type DograhConnectionView,
  type DograhWorkflowRow,
  type TestDograhConnectionOutput,
} from '@superdemo/contracts';
import { api } from '@/lib/api';
import { Badge, Button, Card, Input, Label, Select, Spinner } from '@/components/composites';

/**
 * Point this centre's landing page at its own Dograh voice agent.
 *
 * Two steps rather than one form, because they fail for different reasons and a
 * single "Save" would not say which happened: first the host and key are stored
 * and proved against Dograh's own /auth/me, then a workflow is chosen and an
 * embed token minted for it. Someone whose key is wrong should not be left
 * wondering whether their workflow id was also wrong.
 *
 * The API key is write-only here. It is never returned by the API — the view
 * carries `hasApiKey` and nothing else — so this form can offer "replace" but
 * can never redisplay a credential, and a shoulder-surfer gets nothing from an
 * open editor tab.
 */
export function DograhConnection({ orgId }: { orgId: string }) {
  /*
   * Operator-scoped, not tenant-scoped.
   *
   * Picking a workflow means listing every workflow on the voice host, and a
   * centre without its own key is using the deployment's — so that list is
   * other clients' agents. These routes therefore live under /platform and
   * only a SUPERADMIN reaches them. See PlatformVoiceController.
   */
  const base = `/platform/orgs/${orgId}/voice`;
  const queryClient = useQueryClient();
  const conn = useQuery({
    queryKey: ['dograh', orgId],
    queryFn: async () =>
      (await api.get<{ connection: DograhConnectionView }>(base)).connection,
  });

  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [test, setTest] = useState<TestDograhConnectionOutput | null>(null);

  /** Only fetched once a credential exists — it is an authenticated round-trip
   *  to the client's own host, so it should not run on an empty form. */
  const workflows = useQuery({
    queryKey: ['dograh-workflows', orgId],
    queryFn: () => api.get<DograhWorkflowRow[]>(`${base}/workflows`),
    enabled: Boolean(conn.data?.hasApiKey && conn.data?.baseUrl),
    retry: false,
  });

  const save = useMutation({
    mutationFn: (body: {
      baseUrl: string;
      apiKey?: string;
      workflowId?: number | null;
      callMode?: DograhCallMode;
      chatEnabled?: boolean;
    }) => api.put<DograhConnectionView>(`${base}/connection`, body),
    onSuccess: async (fresh) => {
      /*
       * Keyed by centre, the same as the query above. This used to write to
       * ['dograh'] — the tenant Website page's key — so the panel never saw its
       * own save: the agent picker stayed hidden until a reload, and the
       * tenant's cache was handed a view of whichever centre was edited here.
       */
      queryClient.setQueryData(['dograh', orgId], fresh);
      setApiKey('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dograh-workflows', orgId] }),
        // The demo-call slots below unlock on the same connection.
        queryClient.invalidateQueries({ queryKey: ['platform-voice', orgId] }),
      ]);
      toast.success('Dograh connection saved');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const runTest = useMutation({
    mutationFn: () => api.post<TestDograhConnectionOutput>(`${base}/test`),
    onSuccess: (r) => {
      setTest(r);
      if (r.ok) void queryClient.invalidateQueries({ queryKey: ['dograh-workflows', orgId] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const connect = useMutation({
    mutationFn: () => api.post<ConnectDograhSiteOutput>(`${base}/connect`),
    onSuccess: async (r) => {
      if (r.ok) {
        toast.success(r.detail);
        await queryClient.invalidateQueries({ queryKey: ['dograh', orgId] });
      } else {
        toast.error(r.detail);
      }
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (conn.isLoading) {
    return (
      <Card className="mt-4" title="Voice agent">
        <Spinner label="Checking your Dograh connection…" />
      </Card>
    );
  }
  if (conn.isError) {
    return (
      <Card className="mt-4" title="Voice agent">
        <p className="text-sm text-muted-foreground">
          Could not read the connection — {(conn.error as Error).message}
        </p>
      </Card>
    );
  }

  const c = conn.data!;
  const host = baseUrl ?? c.baseUrl ?? '';
  const live = c.connected;

  return (
    <Card
      className="mt-4"
      title={
        <span className="flex items-center gap-2">
          <Mic className="size-4" aria-hidden />
          Voice agent
          {live ? (
            <Badge dot="bg-live">Connected</Badge>
          ) : (
            <Badge dot="bg-muted-foreground">Not connected</Badge>
          )}
        </span>
      }
      subtitle="Let a visitor talk to your Dograh agent from this page, instead of only reading a phone number."
    >
      <div className="grid gap-4">
        {/* ── step 1: the host and the credential ─────────────────────────── */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="dograh-host">Dograh address</Label>
            <Input
              id="dograh-host"
              placeholder="https://voice.hirestella.ai"
              value={host}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="dograh-key">
              API key {c.hasApiKey ? <span className="text-muted-foreground">— stored</span> : null}
            </Label>
            <Input
              id="dograh-key"
              type="password"
              autoComplete="off"
              placeholder={c.hasApiKey ? 'Leave blank to keep the stored key' : 'Paste a Dograh API key'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>

        {c.inheritedFromDeployment ? (
          <p className="rounded-lg bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
            Using the deployment&rsquo;s <code>DOGRAH_API_KEY</code>, because this centre has saved
            none of its own. That is convenient for a demo and wrong for a real client — a key saved
            here is encrypted at rest and scoped to this centre alone.
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() =>
              save.mutate({ baseUrl: host, apiKey: apiKey.trim() || undefined })
            }
            disabled={!host || save.isPending}
          >
            {save.isPending ? 'Saving…' : 'Save connection'}
          </Button>
          <Button
            variant="outline"
            onClick={() => runTest.mutate()}
            disabled={!c.hasApiKey || runTest.isPending}
          >
            <PlugZap className="size-4" aria-hidden />
            {runTest.isPending ? 'Testing…' : 'Test'}
          </Button>
        </div>

        {test ? (
          <p
            className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs leading-relaxed ${
              test.ok ? 'bg-live-soft text-live' : 'bg-destructive/10 text-destructive'
            }`}
          >
            {test.ok ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
            ) : (
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            )}
            {test.detail}
          </p>
        ) : null}

        {/* ── step 2: which agent, and how the page offers it ─────────────── */}
        {c.hasApiKey ? (
          <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="dograh-workflow">Agent</Label>
              <Select
                id="dograh-workflow"
                value={c.workflowId?.toString() ?? ''}
                onChange={(e) =>
                  save.mutate({
                    baseUrl: host,
                    workflowId: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="mt-1.5"
                disabled={workflows.isLoading || save.isPending}
              >
                <option value="">
                  {workflows.isLoading
                    ? 'Loading your workflows…'
                    : workflows.isError
                      ? 'Could not list workflows — test the connection'
                      : 'Choose a workflow'}
                </option>
                {workflows.data?.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.status}
                    {w.totalRuns ? `, ${w.totalRuns} runs` : ''})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="dograh-mode">What the page offers</Label>
              <Select
                id="dograh-mode"
                value={c.callMode}
                onChange={(e) =>
                  save.mutate({ baseUrl: host, callMode: e.target.value as DograhCallMode })
                }
                className="mt-1.5"
                disabled={save.isPending}
              >
                {(Object.keys(DOGRAH_CALL_MODE_LABELS) as DograhCallMode[]).map((m) => (
                  <option key={m} value={m}>
                    {DOGRAH_CALL_MODE_LABELS[m].label}
                  </option>
                ))}
              </Select>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {DOGRAH_CALL_MODE_LABELS[c.callMode].note}
              </p>
            </div>

            <label className="flex items-start gap-2 text-xs text-muted-foreground sm:col-span-2">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={c.chatEnabled}
                disabled={save.isPending}
                onChange={(ev) => save.mutate({ baseUrl: host, chatEnabled: ev.target.checked })}
              />
              <span>
                Also show a <strong>chat</strong> panel on the page — the same agent in writing, for
                a visitor who will not make a phone call from a laptop.
                {c.hasChatToken ? '' : ' Re-issue the page token below to create it.'}
              </span>
            </label>
          </div>
        ) : null}

        {/* ── step 3: mint the token the public page carries ──────────────── */}
        {c.workflowId ? (
          <div className="grid gap-2 border-t border-border pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={c.hasEmbedToken ? 'outline' : 'default'}
                onClick={() => connect.mutate()}
                disabled={connect.isPending}
              >
                <Link2 className="size-4" aria-hidden />
                {connect.isPending
                  ? 'Connecting…'
                  : c.hasEmbedToken
                    ? 'Re-issue the page token'
                    : 'Connect this page'}
              </Button>
              {c.allowedDomains.length > 0 ? (
                <span className="text-xs text-muted-foreground">
                  Valid on {c.allowedDomains.join(', ')}
                </span>
              ) : null}
            </div>
            {c.snippetHostWarning ? (
              <p className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2.5 text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  Your Dograh is handing out <code>{c.snippetHostWarning}</code> as its widget
                  address, which is not its own. This page works anyway — we load the widget from{' '}
                  <code>{c.baseUrl}</code> — but the embed snippet Dograh shows you is broken for
                  anywhere else you paste it. Worth setting the public address in your Dograh
                  configuration.
                </span>
              </p>
            ) : null}
            <p className="rounded-lg bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
              {c.hasEmbedToken ? (
                <>
                  The page carries {c.hasChatToken ? 'two tokens' : 'a token'} Dograh will only
                  honour on the domains above, so copying{' '}
                  {c.hasChatToken ? 'them' : 'it'} out of the HTML does not let anyone else spend
                  your voice minutes. Re-issue if this page moves to a new domain.
                </>
              ) : (
                <>
                  Connecting mints a token for this workflow, locked to the domains this page is
                  served from. Until then the page keeps its plain phone link and nothing changes for
                  a visitor.
                </>
              )}
            </p>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
