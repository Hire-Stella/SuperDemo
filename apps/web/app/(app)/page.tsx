'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  MessageCircle,
  PhoneCall,
  Sparkles,
  Timer,
  UserCheck,
  Users,
} from 'lucide-react';
import type { ActiveCallRow, AgentSummary, LiveOpsSnapshot, QueueDto } from '@superdemo/contracts';
import { api } from '@/lib/api';
import { useSession, useUser } from '@/components/providers';
import { AGENT_STATUS_STYLE, CALL_STATE_STYLE, duration, pct, phone } from '@/lib/format';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Metric,
  SkeletonRows,
  Table,
  Td,
  Th,
  cn,
} from '@/components/composites';

/** Ticks once a second so live durations count up without refetching. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

export default function LiveOpsPage() {
  const { socket } = useSession();
  const user = useUser();
  const queryClient = useQueryClient();

  const snapshot = useQuery({
    queryKey: ['liveops'],
    queryFn: () => api.get<LiveOpsSnapshot>('/analytics/live'),
    // Socket events drive most updates; this is the safety net if one is missed.
    refetchInterval: 20_000,
  });

  const active = useQuery({
    queryKey: ['active-calls'],
    queryFn: () => api.get<ActiveCallRow[]>('/analytics/active-calls'),
    refetchInterval: 10_000,
  });

  const queues = useQuery({
    queryKey: ['queues'],
    queryFn: () => api.get<QueueDto[]>('/queues'),
    refetchInterval: 20_000,
  });

  const roster = useQuery({
    queryKey: ['presence-roster'],
    queryFn: () => api.get<AgentSummary[]>('/presence/roster'),
    refetchInterval: 30_000,
  });

  const now = useNow((active.data?.length ?? 0) > 0);

  /* Any call-lifecycle event refreshes the board immediately. */
  useEffect(() => {
    if (!socket) return;
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ['liveops'] });
      void queryClient.invalidateQueries({ queryKey: ['active-calls'] });
      void queryClient.invalidateQueries({ queryKey: ['queues'] });
    };
    const events = [
      'call.ringing',
      'call.ai_answered',
      'call.state_changed',
      'call.escalating',
      'call.completed',
      'queue.updated',
      'presence.changed',
    ] as const;
    for (const e of events) socket.on(e, refresh);
    return () => {
      for (const e of events) socket.off(e, refresh);
    };
  }, [socket, queryClient]);

  const s = snapshot.data;
  const slaBreaching = (s?.longestWaitMs ?? 0) > 20_000;

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Activity className="size-5 text-primary" aria-hidden />
            Live operations
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Good{' '}
            {new Date().getHours() < 12
              ? 'morning'
              : new Date().getHours() < 18
                ? 'afternoon'
                : 'evening'}
            , {user.name.split(' ')[0]}. Everything happening right now, across all channels.
          </p>
        </div>
        {/* Both simulator shortcuts follow the centre's own switch: a button
            that leads to a section this centre has turned off is a dead end. */}
        {(user.role === 'ADMIN' || user.role === 'SUPERVISOR') &&
          user.orgSimulatorEnabled !== false && (
            <Link href="/simulator">
              <Button variant="default">
                <PhoneCall className="size-4" aria-hidden /> Simulate a call
              </Button>
            </Link>
          )}
      </header>

      {/* live tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
        <Metric
          label="Live calls"
          value={s?.activeCalls ?? '—'}
          hint="on the line right now"
          tone={s?.activeCalls ? 'live' : 'default'}
          icon={<PhoneCall className="size-4" />}
        />
        <Metric
          label="AI handling"
          value={s?.aiHandling ?? '—'}
          hint="no agent involved yet"
          tone="ai"
          icon={<Sparkles className="size-4" />}
        />
        <Metric
          label="With an agent"
          value={s?.withAgents ?? '—'}
          hint="escalated and connected"
          icon={<UserCheck className="size-4" />}
        />
        <Metric
          label="Waiting"
          value={s?.waitingInQueue ?? '—'}
          hint={s?.longestWaitMs ? `longest ${duration(s.longestWaitMs)}` : 'nobody in a queue'}
          tone={slaBreaching ? 'danger' : 'default'}
          icon={slaBreaching ? <AlertTriangle className="size-4" /> : <Timer className="size-4" />}
        />
        <Metric
          label="Agents available"
          value={s ? `${s.agentsAvailable}` : '—'}
          hint={s ? `${s.agentsOnCall} busy · ${s.agentsOnBreak} on break` : undefined}
          icon={<Users className="size-4" />}
        />
        <Metric
          label="Open WhatsApp"
          value={s?.openWhatsApp ?? '—'}
          hint="threads needing attention"
          icon={<MessageCircle className="size-4" />}
        />
      </div>

      {/* today's KPIs — containment is the number that justifies the platform */}
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          label="AI containment today"
          value={pct(s?.today.containmentPct, 1)}
          hint={
            s
              ? `${s.today.aiContained} of ${s.today.calls} calls resolved with no agent`
              : undefined
          }
          tone="ai"
        />
        <Metric
          label="Answered within SLA"
          value={pct(s?.today.answeredWithinSlaPct, 1)}
          hint="escalated calls picked up in time"
          tone={s && s.today.answeredWithinSlaPct < 80 && s.today.calls > 0 ? 'warn' : 'live'}
        />
        <Metric
          label="Avg handle time"
          value={s ? `${s.today.avgHandleSeconds}s` : '—'}
          hint="talk + wrap-up, agent calls only"
        />
        <Metric
          label="Abandoned today"
          value={s?.today.abandoned ?? '—'}
          hint="hung up while waiting"
          tone={s?.today.abandoned ? 'danger' : 'default'}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {/* active calls */}
        <Card
          className="xl:col-span-2"
          title="Calls in progress"
          subtitle="Updates live over WebSocket"
        >
          {active.isLoading ? (
            <SkeletonRows rows={4} cols={5} />
          ) : (active.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<PhoneCall className="size-7" />}
              title="No calls in progress"
              hint="When a call arrives it appears here instantly — AI-handled calls in purple, agent calls in green."
              action={
                (user.role === 'ADMIN' || user.role === 'SUPERVISOR') &&
                user.orgSimulatorEnabled !== false ? (
                  <Link href="/simulator">
                    <Button variant="secondary" size="sm">
                      Simulate one
                    </Button>
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Caller</Th>
                  <Th>State</Th>
                  <Th>Asking about</Th>
                  <Th>Queue / agent</Th>
                  <Th className="text-right">Elapsed</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {active.data!.map((c) => {
                  const style = CALL_STATE_STYLE[c.state];
                  const elapsed = now - new Date(c.startedAt).getTime();
                  return (
                    <tr key={c.callId} className="transition hover:bg-muted">
                      <Td>
                        <Link
                          href={`/conversations/${c.conversationId}`}
                          className="flex items-center gap-2.5 hover:underline"
                        >
                          <Avatar name={c.contactName ?? 'Unknown'} size={26} />
                          <span className="min-w-0">
                            <span className="block truncate font-medium">
                              {c.contactName ?? 'Unknown caller'}
                            </span>
                            <span className="tnum block truncate text-xs text-muted-foreground">
                              {phone(c.fromNumber)}
                            </span>
                          </span>
                        </Link>
                      </Td>
                      <Td>
                        <Badge className={style.className}>
                          <span
                            className={cn(
                              'size-1.5 rounded-full bg-current',
                              (c.state === 'AI_HANDLING' || c.state === 'AGENT_TALKING') && 'pulse',
                            )}
                            aria-hidden
                          />
                          {style.label}
                        </Badge>
                      </Td>
                      <Td className="max-w-[16rem]">
                        {c.detectedIntent ? (
                          <span className="text-xs">{c.detectedIntent.replace(/_/g, ' ')}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground/70">listening…</span>
                        )}
                        {c.lastUtterance && (
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                            “{c.lastUtterance}”
                          </span>
                        )}
                      </Td>
                      <Td className="text-xs">
                        {c.agentName ?? c.queueName ?? (
                          <span className="text-muted-foreground/70">—</span>
                        )}
                      </Td>
                      <Td className="tnum text-right text-sm">{duration(elapsed)}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>

        {/* queues */}
        <Card title="Queues" subtitle="Where escalated calls land">
          {queues.isLoading ? (
            <SkeletonRows rows={5} cols={2} />
          ) : (
            <ul className="divide-y divide-border">
              {queues.data?.map((q) => {
                const breaching = q.live.longestWaitMs > q.slaSeconds * 1000;
                return (
                  <li key={q.id} className="px-4 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{q.name}</span>
                      <Badge
                        className={
                          q.live.waiting === 0
                            ? 'bg-muted text-muted-foreground'
                            : breaching
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-warn-soft text-warn'
                        }
                      >
                        {q.live.waiting} waiting
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {q.live.agentsAvailable} available · {q.live.agentsOnCall} on a call
                      {q.live.longestWaitMs > 0 && (
                        <span className={breaching ? 'text-destructive' : undefined}>
                          {' '}
                          · longest {duration(q.live.longestWaitMs)}
                        </span>
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* agent grid — the three locations are the client's actual setup */}
      <Card
        className="mt-4"
        title="Agents on shift"
        subtitle="Remote agents work in the browser — no SIM, no roaming"
      >
        {roster.isLoading ? (
          <SkeletonRows rows={3} cols={4} />
        ) : (
          <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {roster.data?.map((a) => {
              const style = AGENT_STATUS_STYLE[a.status];
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2"
                >
                  <Avatar name={a.name} color={a.avatarColor} size={30} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.name}</p>
                    <p className="flex items-center gap-1.5 text-xs">
                      <span className={cn('size-1.5 rounded-full', style.dot)} aria-hidden />
                      <span className={style.text}>{style.label}</span>
                      <span className="text-muted-foreground/70">· {a.location.toLowerCase()}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tnum text-sm font-semibold">{a.today.callsHandled}</p>
                    <p className="text-[11px] text-muted-foreground/70">today</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
