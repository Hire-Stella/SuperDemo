'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, Mic, PlugZap, TriangleAlert } from 'lucide-react';
import type {
  PlatformDograhView,
  SavePlatformDograhInput,
  SavePlatformDograhOutput,
  TestPlatformDograhOutput,
} from '@superdemo/contracts';
import { api } from '@/lib/api';
import { Badge, Button, Card, Input, Label, Spinner } from '@/components/composites';

/** Whether the host field holds something the API's `.url()` will accept. */
const isUrl = (s: string) => {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * The Dograh every centre without its own falls back to.
 *
 * Set once here rather than per centre, because a new centre builds its
 * demo-call agents the moment it is created — and without a voice host to
 * build them on, it simply gets none. Before this, the only fallback was the
 * deployment's environment, which an operator cannot change from a browser.
 *
 * Same write-only rule as a centre's own connection: the API returns the last
 * four characters of the key and nothing more, and the field is cleared the
 * moment a save succeeds.
 */
export function PlatformDograhSettings() {
  const queryClient = useQueryClient();
  const base = '/platform/settings/dograh';
  const view = useQuery({
    queryKey: ['platform-dograh'],
    queryFn: () => api.get<PlatformDograhView>(base),
  });

  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [test, setTest] = useState<TestPlatformDograhOutput | null>(null);
  /* The save's own outcome, inline — a 400 here is "Dograh refused", worth reading. */
  const [saved, setSaved] = useState<{ ok: boolean; detail: string } | null>(null);

  const save = useMutation({
    mutationFn: (body: SavePlatformDograhInput) =>
      api.put<SavePlatformDograhOutput>(base, body),
    onSuccess: async (r) => {
      queryClient.setQueryData(['platform-dograh'], r.view);
      setApiKey('');
      setBaseUrl(null);
      setTest(null);
      const detail = `Saved — agents queued for ${r.queuedCentres} ${r.queuedCentres === 1 ? 'centre' : 'centres'}`;
      setSaved({ ok: true, detail });
      toast.success(detail);
      // Every centre's Voice panel now resolves through this setting.
      await queryClient.invalidateQueries({ queryKey: ['dograh'] });
    },
    // The server tests the connection before storing it; its message says why.
    onError: (e) => setSaved({ ok: false, detail: (e as Error).message }),
  });

  const runTest = useMutation({
    mutationFn: (body: { baseUrl: string; apiKey?: string }) =>
      api.post<TestPlatformDograhOutput>(`${base}/test`, body),
    onSuccess: (r) => setTest(r),
    onError: (e) => setTest({ ok: false, detail: (e as Error).message }),
  });

  const title = (
    <span className="flex items-center gap-2">
      <Mic className="size-4" aria-hidden />
      Platform voice (Dograh)
      {view.data?.effectiveSource === 'platform' ? (
        <Badge dot="bg-live">Connected</Badge>
      ) : view.data?.effectiveSource === 'deployment' ? (
        <Badge dot="bg-muted-foreground">Environment</Badge>
      ) : view.data ? (
        <Badge dot="bg-warn">Not connected</Badge>
      ) : null}
    </span>
  );
  const subtitle =
    'Centres without their own Dograh use this one, and new centres build their demo-call agents on it automatically.';

  if (view.isLoading) {
    return (
      <Card title={title} subtitle={subtitle} contentClassName="p-4">
        <Spinner label="Reading the platform voice host…" />
      </Card>
    );
  }
  if (view.isError) {
    return (
      <Card title={title} subtitle={subtitle} contentClassName="p-4">
        <p className="text-sm text-muted-foreground">
          Could not read the platform voice host — {(view.error as Error).message}
        </p>
      </Card>
    );
  }

  const v = view.data!;
  const host = (baseUrl ?? v.baseUrl ?? '').trim();
  const key = apiKey.trim();
  const canSave = isUrl(host) && (key.length > 0 || v.hasApiKey) && !save.isPending;
  const body = () => ({ baseUrl: host, ...(key ? { apiKey: key } : {}) });

  return (
    <Card title={title} subtitle={subtitle} contentClassName="p-4">
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {v.effectiveSource === 'platform' ? (
            <span className="flex items-center gap-1.5 text-live">
              <CheckCircle2 className="size-3.5" aria-hidden />
              Connected — key ••••{v.apiKeyLast4 ?? ''}
            </span>
          ) : v.effectiveSource === 'deployment' ? (
            <span className="text-muted-foreground">
              Using the server&rsquo;s environment settings
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-md bg-warn-soft px-2 py-1 text-warn">
              <TriangleAlert className="size-3.5" aria-hidden />
              Not connected — new centres get no demo calls until this is set
            </span>
          )}
          <span className="text-muted-foreground">
            Used by {v.centresUsing} {v.centresUsing === 1 ? 'centre' : 'centres'} without their
            own Dograh
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="platform-dograh-host">Dograh address</Label>
            <Input
              id="platform-dograh-host"
              type="url"
              placeholder="https://voice.hirestella.ai"
              value={baseUrl ?? v.baseUrl ?? ''}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="platform-dograh-key">
              API key {v.hasApiKey ? <span className="text-muted-foreground">— stored</span> : null}
            </Label>
            <Input
              id="platform-dograh-key"
              type="password"
              autoComplete="off"
              placeholder={
                v.hasApiKey
                  ? `Leave blank to keep ••••${v.apiKeyLast4 ?? ''}`
                  : 'Paste a Dograh API key'
              }
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => {
              setSaved(null);
              save.mutate(body());
            }}
            disabled={!canSave}
          >
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setTest(null);
              runTest.mutate(body());
            }}
            // Testing with no key typed tests the stored one — so one must exist.
            disabled={!isUrl(host) || !(key || v.hasApiKey) || runTest.isPending}
          >
            <PlugZap className="size-4" aria-hidden />
            {runTest.isPending ? 'Testing…' : 'Test'}
          </Button>
        </div>

        {[test, saved].map((r, i) =>
          r ? (
            <p
              key={i}
              className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs leading-relaxed ${
                r.ok ? 'bg-live-soft text-live' : 'bg-destructive/10 text-destructive'
              }`}
            >
              {r.ok ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
              ) : (
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              )}
              {r.detail}
            </p>
          ) : null,
        )}
      </div>
    </Card>
  );
}
