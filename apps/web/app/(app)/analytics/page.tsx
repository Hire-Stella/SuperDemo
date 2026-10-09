'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BarList, LineChart } from '@hire-stella/ui';
import { BarChart3, Download, PiggyBank, ShieldCheck } from 'lucide-react';
import {
  dispositionLabel,
  interestLabel,
  evalBand,
  type AnalyticsOverview,
  type CallInsights,
  type EvalSummary,
} from '@superdemo/contracts';
import { api, qs } from '@/lib/api';
import { useUser } from '@/components/providers';
import { dateRange, ESCALATION_LABEL, money, pct, seconds } from '@/lib/format';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Metric,
  Select,
  Spinner,
  Table,
  Td,
  Th,
  cn,
} from '@/components/composites';
import { CallInsightsSection } from '@/components/call-insights';

/*
 * Chart palette — read from the theme, not hardcoded.
 *
 * These are CSS variable references, which SVG resolves at paint time, so the
 * charts follow the active tenant brand and flip correctly between light and dark
 * without a re-render or a JS colour lookup.
 *
 * Series meanings are kept consistent with the rest of the app: brand red for
 * the headline series, purple for AI, green for healthy, amber/red for problems.
 */

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AnalyticsPage() {
  // Outcome labels read in this centre's own vocabulary.
  const user = useUser();
  const [days, setDays] = useState('30');
  const range = dateRange(Number(days));

  const evals = useQuery({
    queryKey: ['analytics-evals', days],
    queryFn: () => api.get<EvalSummary>(`/analytics/evals${qs(range)}`),
  });

  // Only centres whose calls come from a voice workflow have any.
  const insights = useQuery({
    queryKey: ['analytics-insights', days],
    queryFn: () => api.get<CallInsights>(`/analytics/insights${qs(range)}`),
  });

  const query = useQuery({
    queryKey: ['analytics', days],
    queryFn: () => api.get<AnalyticsOverview>(`/analytics/overview${qs(range)}`),
  });

  if (query.isLoading) return <Spinner label="Crunching the numbers…" />;
  if (query.isError || !query.data) {
    return <p className="p-6 text-sm text-destructive">{(query.error as Error)?.message}</p>;
  }

  const d = query.data;
  const t = d.totals;

  // Heatmap grid: weekday × hour, restricted to plausible operating hours so the
  // grid isn't 24 mostly-empty columns wide.
  const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 07:00–21:00
  const heat = new Map(d.hourlyHeatmap.map((h) => [`${h.weekday}-${h.hour}`, h.calls]));
  const maxHeat = Math.max(1, ...d.hourlyHeatmap.map((h) => h.calls));

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <BarChart3 className="size-5 text-primary" aria-hidden />
            Analytics
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {range.from} to {range.to} · bucketed in Asia/Dubai
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              void api.download(`/reports/analytics.csv${qs(range)}`).catch(() => undefined)
            }
          >
            <Download className="size-4" aria-hidden /> Report CSV
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              void api.download(`/reports/agents.csv${qs(range)}`).catch(() => undefined)
            }
          >
            <Download className="size-4" aria-hidden /> Agents CSV
          </Button>
          <Select className="w-auto" value={days} onChange={(e) => setDays(e.target.value)}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="60">Last 60 days</option>
          </Select>
        </div>
      </header>

      {/* headline */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
        <Metric label="Total calls" value={t.calls.toLocaleString()} />
        <Metric
          label="AI containment"
          value={pct(t.containmentPct, 1)}
          hint={`${t.aiContained.toLocaleString()} resolved without an agent`}
          tone="ai"
        />
        <Metric label="Escalated" value={t.escalated.toLocaleString()} hint="reached a human" />
        <Metric
          label="Abandonment"
          value={pct(t.abandonmentPct, 1)}
          hint="hung up while waiting"
          tone={t.abandonmentPct > 5 ? 'danger' : 'default'}
        />
        <Metric
          label="Answered in SLA"
          value={pct(t.answeredWithinSlaPct, 1)}
          tone={t.answeredWithinSlaPct < 80 ? 'warn' : 'live'}
        />
        <Metric label="WhatsApp threads" value={t.whatsappConversations.toLocaleString()} />
      </div>

      {/* the commercial argument */}
      <Card
        className="mt-3"
        title={
          <span className="flex items-center gap-1.5">
            <PiggyBank className="size-4 text-live" aria-hidden /> What the AI saved
          </span>
        }
        subtitle="Contained calls consumed no agent time, valued at the average handle time of calls that did reach an agent"
      >
        <div
          className={cn(
            'grid grid-cols-2 gap-3 p-4',
            user.simplifiedUi ? 'lg:grid-cols-3' : 'lg:grid-cols-4',
          )}
        >
          <Metric
            label="Calls contained"
            value={d.savings.containedCalls.toLocaleString()}
            tone="ai"
          />
          <Metric label="Agent hours saved" value={d.savings.agentHoursSaved.toLocaleString()} />
          <Metric
            label="Estimated saving"
            value={money(d.savings.estimatedCostSavedUsd)}
            tone="live"
          />
          {/* An internal assumption, hidden from a simplified (client demo) account. */}
          {!user.simplifiedUi && (
            <Metric
              label="Assumed agent cost"
              value={`${money(d.savings.assumedAgentHourlyUsd)}/hr`}
              hint="editable in Settings — replace with your real figure before quoting"
            />
          )}
        </div>
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {/* volume over time */}
        <Card>
          <div className="p-4">
            <LineChart
              title="Volume and containment over time"
              height={260}
              categories={d.daily.map((x) => x.day.slice(5))}
              series={[
                { key: 'calls', label: 'All calls', values: d.daily.map((x) => x.calls) },
                { key: 'ai', label: 'AI resolved', values: d.daily.map((x) => x.aiContained) },
                { key: 'abandoned', label: 'Abandoned', values: d.daily.map((x) => x.abandoned) },
              ]}
            />
          </div>
        </Card>

        {/* why the AI handed off */}
        <Card
          title="Why the AI handed off"
          subtitle="The most actionable chart here — each reason implies a different fix"
        >
          <div className="p-4">
            {d.escalationReasons.length === 0 ? (
              <EmptyState
                title="No handoffs in this period"
                hint="When the AI routes a call to a person, the reason shows up here."
              />
            ) : (
              <BarList
                items={d.escalationReasons.map((r) => {
                  // A person was meant to take these — the handoff worked as designed (Mist).
                  // Everything else usually means a knowledge-base gap someone can fix (orange).
                  const asDesigned =
                    r.reason === 'CALLER_REQUESTED' || r.reason === 'HUMAN_ONLY_INTENT';
                  return {
                    label: ESCALATION_LABEL[r.reason],
                    value: r.count,
                    tone: asDesigned ? 'handoff' : 'signal',
                    tag: asDesigned ? 'As designed' : 'Fixable',
                  };
                })}
              />
            )}
          </div>
          <p className="border-t border-border px-4 py-2.5 text-xs leading-relaxed text-muted-foreground">
            “As designed” handoffs are working: the caller asked for a person, or the topic is
            configured human-only. “Fixable” ones usually mean a gap in the knowledge base.
          </p>
        </Card>
      </div>

      {/* heatmap */}
      <Card
        className="mt-4"
        title="When calls arrive"
        subtitle="Hour × weekday, centre local time — this is the staffing chart"
      >
        <div className="overflow-x-auto p-4">
          <table className="border-separate border-spacing-0.5">
            <thead>
              <tr>
                <th className="w-10" />
                {HOURS.map((h) => (
                  <th key={h} className="w-8 pb-1 text-[10px] font-normal text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WEEKDAYS.map((label, weekday) => (
                <tr key={label}>
                  <td className="pr-2 text-right text-[10px] text-muted-foreground">{label}</td>
                  {HOURS.map((hour) => {
                    const calls = heat.get(`${weekday}-${hour}`) ?? 0;
                    const intensity = calls / maxHeat;
                    return (
                      <td key={hour}>
                        <div
                          className="size-7 rounded"
                          style={{
                            background:
                              calls === 0
                                ? 'var(--muted)'
                                : `color-mix(in oklch, var(--chart-1) ${Math.round(18 + intensity * 82)}%, transparent)`,
                          }}
                          title={`${label} ${hour}:00 — ${calls} call${calls === 1 ? '' : 's'}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted-foreground">
            Friday and Saturday are the UAE weekend. Whether that is your quietest stretch or your
            busiest depends on the business — an office empties, a rental desk fills up.
          </p>
        </div>
      </Card>

      {insights.data && insights.data.calls > 0 && (
        <CallInsightsSection className="mt-4" data={insights.data} />
      )}

      {/* ── assistant quality ─────────────────────────────────────────────── */}
      {evals.data && evals.data.scored > 0 && (
        <Card
          className="mt-4"
          title={
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4" aria-hidden /> Assistant quality
            </span>
          }
          subtitle={
            /*
             * The denominator is part of the headline, not a footnote.
             *
             * An average over only the calls that happen to have been scored
             * flatters itself, and a supervisor reading 92 needs to know
             * whether that is 92 across everything or across a third of it.
             */
            `${evals.data.scored} of ${evals.data.scored + evals.data.unscored} AI-handled calls scored` +
            (evals.data.humanReviewed > 0
              ? ` · ${evals.data.humanReviewed} reviewed by a person`
              : '')
          }
        >
          <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,20rem)_1fr]">
            <div className="space-y-4">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-semibold tnum">{evals.data.avgScore}</span>
                <span className="text-sm text-muted-foreground">average score</span>
              </div>

              {/* Bands as one bar: the shape says more than three numbers. */}
              <div>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                  {(
                    [
                      ['good', evals.data.bands.good, 'var(--chart-3)'],
                      ['watch', evals.data.bands.watch, 'var(--chart-4)'],
                      ['poor', evals.data.bands.poor, 'var(--destructive)'],
                    ] as const
                  ).map(([k, n, colour]) => (
                    <div
                      key={k}
                      style={{
                        width: `${(n / Math.max(1, evals.data!.scored)) * 100}%`,
                        background: colour,
                      }}
                      title={`${n} ${k}`}
                    />
                  ))}
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                  <span>{evals.data.bands.good} good (85+)</span>
                  <span>{evals.data.bands.watch} watch</span>
                  <span className={evals.data.bands.poor > 0 ? 'font-medium text-destructive' : ''}>
                    {evals.data.bands.poor} poor (&lt;70)
                  </span>
                </div>
              </div>

              {/* Per dimension, weakest first — that is the one worth fixing. */}
              <ul className="space-y-2 border-t border-border pt-3">
                {[...evals.data.dimensions]
                  .sort((a, b) => a.avg - b.avg)
                  .map((dim) => (
                    <li key={dim.key} className="flex items-center gap-3">
                      <span className="w-20 shrink-0 text-xs text-muted-foreground">
                        {dim.label}
                      </span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${dim.avg}%`,
                            background: dim.avg >= 85 ? 'var(--chart-3)' : 'var(--chart-4)',
                          }}
                        />
                      </div>
                      <span className="tnum w-9 text-right text-xs">{dim.avg}</span>
                    </li>
                  ))}
              </ul>

              <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
                <div>
                  <p className="text-muted-foreground">AI spend</p>
                  <p className="tnum mt-0.5 text-base font-medium">
                    ${evals.data.cost.totalUsd.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Per call</p>
                  <p className="tnum mt-0.5 text-base font-medium">
                    ${evals.data.cost.perCallUsd.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Anchored at 50, not 0: the interesting range is the top half, and a 0-100 axis
                  flattens every movement in it. */}
              <LineChart
                title="Average evaluation score"
                height={180}
                yMin={50}
                area
                categories={evals.data.trend.map((x) => x.day.slice(5))}
                series={[
                  { key: 'avg', label: 'Avg score', values: evals.data.trend.map((x) => x.avg) },
                ]}
              />

              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Worth listening to
                </p>
                <ul className="divide-y divide-border rounded-md border border-border">
                  {evals.data.worst.slice(0, 5).map((w) => (
                    <li key={w.conversationId}>
                      <Link
                        href={`/conversations/${w.conversationId}`}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50"
                      >
                        <Badge
                          className={
                            evalBand(w.score) === 'poor'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-ai-soft text-ai'
                          }
                        >
                          {w.score}
                        </Badge>
                        <span className="w-32 shrink-0 truncate text-xs">
                          {w.contactName ?? 'Unknown'}
                        </span>
                        <span className="truncate text-[11px] text-muted-foreground">{w.note}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {/* per queue */}

        <Card className="xl:col-span-2" title="By queue">
          <Table>
            <thead>
              <tr>
                <Th>Queue</Th>
                <Th className="text-right">Calls</Th>
                <Th className="text-right">Containment</Th>
                <Th className="text-right">Avg answer</Th>
                <Th className="text-right">SLA</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {d.byQueue.map((q) => (
                <tr key={q.queueId}>
                  <Td className="font-medium">{q.queueName}</Td>
                  <Td className="tnum text-right">{q.calls}</Td>
                  <Td className="tnum text-right text-ai">{pct(q.containmentPct, 1)}</Td>
                  <Td className="tnum text-right">{seconds(q.avgSpeedOfAnswerSeconds)}</Td>
                  <Td className="tnum text-right">
                    <span className={q.slaPct < 80 ? 'text-warn' : 'text-live'}>
                      {pct(q.slaPct, 0)}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        {/* per location — the client's three sites */}
        <Card title="By location" subtitle="Dubai · India · Egypt">
          <Table>
            <thead>
              <tr>
                <Th>Site</Th>
                <Th className="text-right">Agents</Th>
                <Th className="text-right">Handled</Th>
                <Th className="text-right">AHT</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {d.byLocation.map((l) => (
                <tr key={l.location}>
                  <Td className="text-xs font-medium capitalize">{l.location.toLowerCase()}</Td>
                  <Td className="tnum text-right">{l.agents}</Td>
                  <Td className="tnum text-right">{l.callsHandled}</Td>
                  <Td className="tnum text-right">{seconds(l.avgHandleSeconds)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card title={interestLabel(user.orgIndustry).title} subtitle="Where the demand actually is">
          {d.topCourses.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              {interestLabel(user.orgIndustry).empty}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {d.topCourses.map((c) => (
                <li key={c.course} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="truncate text-sm">{c.course}</span>
                  <Badge className="text-foreground">{c.enquiries}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Call outcomes" subtitle="Agent-recorded dispositions">
          {d.dispositions.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No dispositions recorded in this range.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {d.dispositions
                .sort((a, b) => b.count - a.count)
                .map((x) => (
                  <li
                    key={x.disposition}
                    className="flex items-center justify-between gap-3 px-4 py-2.5"
                  >
                    <span className="truncate text-sm">
                      {dispositionLabel(user.orgIndustry, x.disposition)}
                    </span>
                    <Badge>{x.count}</Badge>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
