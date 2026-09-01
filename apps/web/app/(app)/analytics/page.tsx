'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, Download, PiggyBank } from 'lucide-react';
import { dispositionLabel, type AnalyticsOverview } from '@superdemo/contracts';
import { api, qs } from '@/lib/api';
import { useUser } from '@/components/providers';
import { dateRange, ESCALATION_LABEL, money, pct, seconds } from '@/lib/format';
import { Badge, Button, Card, Metric, Select, Spinner, Table, Td, Th } from '@/components/composites';

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
const C = {
  brand: 'var(--chart-1)',
  ai: 'var(--chart-2)',
  live: 'var(--chart-3)',
  warn: 'var(--chart-4)',
  danger: 'var(--destructive)',
  grid: 'var(--border)',
  muted: 'var(--muted-foreground)',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AnalyticsPage() {
  // Outcome labels read in this centre's own vocabulary.
  const user = useUser();
  const [days, setDays] = useState('30');
  const range = dateRange(Number(days));

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
          <Button onClick={() => void api.download(`/reports/analytics.csv${qs(range)}`).catch(() => undefined)}>
            <Download className="size-4" aria-hidden /> Report CSV
          </Button>
          <Button onClick={() => void api.download(`/reports/agents.csv${qs(range)}`).catch(() => undefined)}>
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
        <Metric
          label="Escalated"
          value={t.escalated.toLocaleString()}
          hint="reached a human"
        />
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
        <Metric
          label="WhatsApp threads"
          value={t.whatsappConversations.toLocaleString()}
        />
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
        <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-4">
          <Metric label="Calls contained" value={d.savings.containedCalls.toLocaleString()} tone="ai" />
          <Metric label="Agent hours saved" value={d.savings.agentHoursSaved.toLocaleString()} />
          <Metric
            label="Estimated saving"
            value={money(d.savings.estimatedCostSavedUsd)}
            tone="live"
          />
          <Metric
            label="Assumed agent cost"
            value={`${money(d.savings.assumedAgentHourlyUsd)}/hr`}
            hint="editable in Settings — replace with your real figure before quoting"
          />
        </div>
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {/* volume over time */}
        <Card title="Volume and containment over time">
          <div className="h-72 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={d.daily} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid stroke={C.grid} vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: C.muted }}
                  tickFormatter={(v: string) => v.slice(5)}
                  stroke={C.grid}
                />
                <YAxis tick={{ fontSize: 11, fill: C.muted }} stroke={C.grid} />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: `1px solid ${C.grid}`,
                    background: 'var(--popover)',
                    color: 'var(--popover-foreground)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="calls"
                  name="All calls"
                  stroke={C.brand}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="aiContained"
                  name="AI resolved"
                  stroke={C.ai}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="abandoned"
                  name="Abandoned"
                  stroke={C.warn}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* why the AI handed off */}
        <Card
          title="Why the AI handed off"
          subtitle="The most actionable chart here — each reason implies a different fix"
        >
          <div className="h-72 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={d.escalationReasons.map((r) => ({
                  reason: ESCALATION_LABEL[r.reason],
                  count: r.count,
                }))}
                layout="vertical"
                margin={{ top: 6, right: 16, bottom: 0, left: 58 }}
              >
                <CartesianGrid stroke={C.grid} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: C.muted }} stroke={C.grid} />
                <YAxis
                  type="category"
                  dataKey="reason"
                  tick={{ fontSize: 10, fill: C.muted }}
                  width={120}
                  stroke={C.grid}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: `1px solid ${C.grid}`,
                    background: 'var(--popover)',
                    color: 'var(--popover-foreground)',
                  }}
                />
                <Bar dataKey="count" name="Calls" radius={[0, 4, 4, 0]}>
                  {d.escalationReasons.map((r) => (
                    <Cell
                      key={r.reason}
                      fill={
                        r.reason === 'CALLER_REQUESTED' || r.reason === 'HUMAN_ONLY_INTENT'
                          ? C.brand
                          : C.warn
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="border-t border-border px-4 py-2 text-xs leading-relaxed text-muted-foreground">
            Red reasons are working as designed — the caller asked for a person, or the topic is
            configured human-only. Amber reasons are fixable: they usually mean a gap in the
            knowledge base.
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
                                : `color-mix(in oklch, ${C.brand} ${Math.round(18 + intensity * 82)}%, transparent)`,
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
            Friday and Saturday are the UAE weekend — light traffic there is expected.
          </p>
        </div>
      </Card>

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
        <Card title="Most-asked-about courses" subtitle="Where the demand actually is">
          {d.topCourses.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No course interest recorded in this range.</p>
          ) : (
            <ul className="divide-y divide-border">
              {d.topCourses.map((c) => (
                <li key={c.course} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="truncate text-sm">{c.course}</span>
                  <Badge className="bg-brand-soft text-primary">{c.enquiries}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Call outcomes" subtitle="Agent-recorded dispositions">
          {d.dispositions.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No dispositions recorded in this range.</p>
          ) : (
            <ul className="divide-y divide-border">
              {d.dispositions
                .sort((a, b) => b.count - a.count)
                .map((x) => (
                  <li
                    key={x.disposition}
                    className="flex items-center justify-between gap-3 px-4 py-2.5"
                  >
                    <span className="truncate text-sm">{dispositionLabel(user.orgIndustry, x.disposition)}</span>
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
