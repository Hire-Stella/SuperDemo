'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { categoryLabel, type AgentScorecard, type AgentSummary } from '@superdemo/contracts';
import { api, qs } from '@/lib/api';
import { AGENT_STATUS_STYLE, dateRange, pct, seconds } from '@/lib/format';
import { useUser } from '@/components/providers';
import { Avatar, Badge, Card, Select, SkeletonRows, Table, Td, Th, cn } from '@/components/composites';

export default function AgentsPage() {
  // Skill chips read in this centre's own vocabulary.
  const user = useUser();
  const [days, setDays] = useState('7');
  const range = dateRange(Number(days));

  const roster = useQuery({
    queryKey: ['presence-roster'],
    queryFn: () => api.get<AgentSummary[]>('/presence/roster'),
    refetchInterval: 20_000,
  });

  const scores = useQuery({
    queryKey: ['scorecards', days],
    queryFn: () => api.get<AgentScorecard[]>(`/analytics/agents${qs(range)}`),
  });

  const byId = new Map((scores.data ?? []).map((s) => [s.userId, s]));

  // Was a hardcoded "Dubai 8 · India 2 · Egypt 2" — one tenant's headcount, on
  // every tenant's page. Counted from the roster instead.
  const agents = roster.data ?? [];
  const byLocation = agents.reduce<Record<string, number>>((acc, a) => {
    const key = a.location.charAt(0) + a.location.slice(1).toLowerCase();
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const teamSubtitle =
    agents.length === 0
      ? 'No agents yet'
      : Object.entries(byLocation)
          .sort(([, a], [, b]) => b - a)
          .map(([place, n]) => `${place} ${n}`)
          .join(' · ');

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Users className="size-5 text-primary" aria-hidden /> Agents
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Productivity comes from the append-only state log, not the current status — so numbers
            don&apos;t shift when someone toggles availability.
          </p>
        </div>
        <Select className="w-auto" value={days} onChange={(e) => setDays(e.target.value)}>
          <option value="1">Today</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
        </Select>
      </header>

      <Card title="Team" subtitle={teamSubtitle}>
        {roster.isLoading ? (
          <SkeletonRows rows={8} cols={7} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Agent</Th>
                <Th>Status</Th>
                <Th>Skills</Th>
                <Th className="text-right">Handled</Th>
                <Th className="text-right">Talk time</Th>
                <Th className="text-right">AHT</Th>
                <Th className="text-right">Occupancy</Th>
                <Th className="text-right">Missing dispositions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {roster.data?.map((a) => {
                const style = AGENT_STATUS_STYLE[a.status];
                const s = byId.get(a.id);
                return (
                  <tr key={a.id} className="transition hover:bg-muted">
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={a.name} color={a.avatarColor} size={28} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{a.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {a.location.toLowerCase()} · {a.role.toLowerCase()}
                            {a.extension ? ` · ext ${a.extension}` : ''}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <span className="flex items-center gap-1.5 text-xs">
                        <span className={cn('size-1.5 rounded-full', style.dot)} aria-hidden />
                        <span className={style.text}>{style.label}</span>
                      </span>
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {a.skills.map((sk) => (
                          <Badge key={sk} className="text-[10px]">
                            {categoryLabel(user.orgIndustry, sk)}
                          </Badge>
                        ))}
                      </div>
                    </Td>
                    <Td className="tnum text-right">{s?.callsHandled ?? 0}</Td>
                    <Td className="tnum text-right">{seconds(s?.talkSeconds)}</Td>
                    <Td className="tnum text-right">{seconds(s?.avgHandleSeconds)}</Td>
                    <Td className="tnum text-right">
                      <span className={(s?.occupancyPct ?? 0) > 85 ? 'text-warn' : undefined}>
                        {pct(s?.occupancyPct, 0)}
                      </span>
                    </Td>
                    <Td className="tnum text-right">
                      {s?.dispositionsMissing ? (
                        <span className="text-warn">{s.dispositionsMissing}</span>
                      ) : (
                        <span className="text-muted-foreground/70">0</span>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
