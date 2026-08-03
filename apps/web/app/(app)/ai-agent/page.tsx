'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Sparkles, Search, Save } from 'lucide-react';
import type { AiAgentDto, KnowledgeSearchResult } from '@fit-ai/contracts';
import { api, qs } from '@/lib/api';
import { pct } from '@/lib/format';
import {
  Badge,
  Button,
  Card,
  Input,
  Metric,
  Spinner,
  Textarea,
  cn,
} from '@/components/ui';

export default function AiAgentPage() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['ai-agents'],
    queryFn: () => api.get<AiAgentDto[]>('/ai-agents'),
  });

  const agent = query.data?.[0];

  const [greeting, setGreeting] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [confidenceFloor, setConfidenceFloor] = useState(0.45);
  const [maxTurns, setMaxTurns] = useState(12);
  const [sentimentFloor, setSentimentFloor] = useState(-0.5);
  const [keywords, setKeywords] = useState('');
  const [humanOnly, setHumanOnly] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!agent) return;
    setGreeting(agent.greeting);
    setSystemPrompt(agent.systemPrompt);
    setConfidenceFloor(agent.escalationRules.confidenceFloor);
    setMaxTurns(agent.escalationRules.maxTurns);
    setSentimentFloor(agent.escalationRules.sentimentFloor);
    setKeywords(agent.escalationRules.handoffKeywords.join(', '));
    setHumanOnly(agent.escalationRules.humanOnlyIntents.join(', '));
    setDirty(false);
  }, [agent?.id]);

  const save = useMutation({
    mutationFn: () =>
      api.put(`/ai-agents/${agent!.id}`, {
        name: agent!.name,
        greeting,
        systemPrompt,
        voice: agent!.voice,
        language: agent!.language,
        defaultQueueId: agent!.defaultQueueId,
        isActive: agent!.isActive,
        escalationRules: {
          handoffKeywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
          confidenceFloor,
          maxTurns,
          sentimentFloor,
          humanOnlyIntents: humanOnly.split(',').map((k) => k.trim()).filter(Boolean),
        },
      }),
    onSuccess: () => {
      toast.success('AI assistant updated');
      setDirty(false);
      void queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  /* --------------------------- KB test harness --------------------------- */

  const [probe, setProbe] = useState('');
  const [submitted, setSubmitted] = useState('');

  const search = useQuery({
    queryKey: ['kb-probe', submitted],
    queryFn: () =>
      api.get<KnowledgeSearchResult[]>(`/knowledge/search${qs({ q: submitted, limit: 4 })}`),
    enabled: submitted.length > 0,
  });

  if (query.isLoading) return <Spinner label="Loading assistant…" />;
  if (!agent) return <p className="p-6 text-sm text-danger">No AI agent configured.</p>;

  const topScore = search.data?.[0]?.score ?? 0;
  const wouldEscalate = submitted.length > 0 && topScore < confidenceFloor;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6">
      <header className="mb-4">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Sparkles className="size-5 text-ai" aria-hidden /> {agent.name}
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          What the assistant says, and — more importantly — when it stops and fetches a human.
        </p>
      </header>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Metric label="Calls (30 days)" value={agent.stats?.calls30d ?? 0} />
        <Metric
          label="Containment"
          value={pct(agent.stats?.containmentPct, 1)}
          hint="resolved with no agent"
          tone="ai"
        />
        <Metric
          label="Avg turns"
          value={agent.stats?.avgTurns.toFixed(1) ?? '—'}
          hint="caller exchanges per call"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card title="Greeting" subtitle="Spoken after the recording-consent line">
            <div className="p-4">
              <Textarea
                rows={3}
                value={greeting}
                onChange={(e) => {
                  setGreeting(e.target.value);
                  setDirty(true);
                }}
              />
            </div>
          </Card>

          <Card
            title="Instructions"
            subtitle="Applies to the generative drivers; the scripted driver answers only from the knowledge base"
          >
            <div className="p-4">
              <Textarea
                rows={14}
                className="font-mono text-xs"
                value={systemPrompt}
                onChange={(e) => {
                  setSystemPrompt(e.target.value);
                  setDirty(true);
                }}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card
            title="When to fetch a human"
            subtitle="These rules are the safety net — they run regardless of which AI driver is active"
          >
            <div className="space-y-4 p-4">
              <label className="block">
                <span className="text-xs font-medium text-muted">
                  Knowledge-base confidence floor — {(confidenceFloor * 100).toFixed(0)}%
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={confidenceFloor}
                  onChange={(e) => {
                    setConfidenceFloor(Number(e.target.value));
                    setDirty(true);
                  }}
                  className="mt-1.5 w-full accent-[var(--color-brand)]"
                />
                <span className="mt-1 block text-[11px] leading-relaxed text-faint">
                  Below this, the assistant says it isn&apos;t sure and hands off rather than
                  guessing. Higher = more cautious, more escalations.
                </span>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-muted">
                  Escalate if sentiment drops below {sentimentFloor.toFixed(2)}
                </span>
                <input
                  type="range"
                  min={-1}
                  max={0}
                  step={0.05}
                  value={sentimentFloor}
                  onChange={(e) => {
                    setSentimentFloor(Number(e.target.value));
                    setDirty(true);
                  }}
                  className="mt-1.5 w-full accent-[var(--color-brand)]"
                />
              </label>

              <label className="block text-xs font-medium text-muted">
                Hard cap on AI turns
                <Input
                  className="mt-1"
                  type="number"
                  min={2}
                  max={40}
                  value={maxTurns}
                  onChange={(e) => {
                    setMaxTurns(Number(e.target.value));
                    setDirty(true);
                  }}
                />
              </label>

              <label className="block text-xs font-medium text-muted">
                Phrases that mean “get me a person”
                <Textarea
                  className="mt-1 text-xs"
                  rows={3}
                  value={keywords}
                  onChange={(e) => {
                    setKeywords(e.target.value);
                    setDirty(true);
                  }}
                />
              </label>

              <label className="block text-xs font-medium text-muted">
                Topics the AI must never handle alone
                <Textarea
                  className="mt-1 text-xs"
                  rows={2}
                  value={humanOnly}
                  onChange={(e) => {
                    setHumanOnly(e.target.value);
                    setDirty(true);
                  }}
                />
                <span className="mt-1 block text-[11px] leading-relaxed text-faint">
                  Refunds, complaints, visas and attestation are here by default — these carry real
                  consequences for a student and belong with a person.
                </span>
              </label>

              <Button
                variant="primary"
                className="w-full"
                disabled={!dirty}
                loading={save.isPending}
                onClick={() => save.mutate()}
              >
                <Save className="size-4" aria-hidden /> Save changes
              </Button>
            </div>
          </Card>

          {/* KB probe — lets the client's own staff test the assistant */}
          <Card
            title="Test the knowledge base"
            subtitle="Ask what a caller would ask, and see exactly what the assistant would retrieve"
          >
            <div className="p-4">
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(probe.trim());
                }}
              >
                <Input
                  value={probe}
                  onChange={(e) => setProbe(e.target.value)}
                  placeholder="e.g. how much is the ABA certification?"
                />
                <Button type="submit" variant="secondary">
                  <Search className="size-4" aria-hidden />
                </Button>
              </form>

              {submitted && search.isLoading && <Spinner />}

              {submitted && search.data && (
                <div className="mt-3">
                  <div
                    className={cn(
                      'rounded-lg px-3 py-2 text-xs',
                      wouldEscalate ? 'bg-warn-soft text-warn' : 'bg-live-soft text-live',
                    )}
                  >
                    Top match scores <strong>{(topScore * 100).toFixed(0)}%</strong> against a{' '}
                    {(confidenceFloor * 100).toFixed(0)}% floor —{' '}
                    {wouldEscalate
                      ? 'the assistant would hand this to a human.'
                      : 'the assistant would answer this.'}
                  </div>

                  <ul className="mt-2 space-y-2">
                    {search.data.map((r, i) => (
                      <li key={r.chunkId} className="rounded-lg border border-border p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-medium">{r.docTitle}</span>
                          <Badge className={i === 0 ? 'bg-brand-soft text-brand' : undefined}>
                            {(r.score * 100).toFixed(0)}%
                          </Badge>
                        </div>
                        <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-muted">
                          {r.content}
                        </p>
                      </li>
                    ))}
                  </ul>

                  {search.data.length === 0 && (
                    <p className="mt-2 text-xs text-muted">
                      Nothing retrieved — the assistant would hand this straight to a human.
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
