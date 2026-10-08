'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Clock,
  Globe,
  PhoneCall,
  Radio,
  Sparkles,
  Target,
  UserCheck,
} from 'lucide-react';
import type { AiLiveOps } from '@superdemo/contracts';
import { duration, phone, relative, seconds } from '@/lib/format';
import { Badge, Card, EmptyState, Metric, cn } from '@/components/composites';

/**
 * Live ops for a centre whose calls are answered by its voice workflow.
 *
 * The standard board is built around people — queues, agents on shift, SLA,
 * handle time — and for a centre with no human queue every one of those reads
 * zero. This shows what is actually happening instead: who is on the phone
 * with the assistant now, how today is going, and the calls that just ended.
 */
export function AiLiveBoard({ data }: { data: AiLiveOps }) {
  const now = useNow(data.live.length > 0);
  const { today } = data;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Metric
          label="Live now"
          value={data.live.length}
          hint="callers talking to the assistant"
          tone={data.live.length ? 'live' : 'default'}
          icon={<Radio className="size-4" />}
        />
        <Metric
          label="Calls today"
          value={today.calls}
          hint="all answered by the assistant"
          tone="ai"
          icon={<Sparkles className="size-4" />}
        />
        <Metric
          label="Avg call length"
          value={today.calls ? seconds(today.avgDurationSeconds) : '—'}
          hint="today"
          icon={<Clock className="size-4" />}
        />
        <Metric
          label="Leads captured"
          value={today.leadsCaptured}
          hint={
            today.calls
              ? `of ${today.calls} calls left their details`
              : 'callers who left their details'
          }
          tone={today.leadsCaptured ? 'brand' : 'default'}
          icon={<UserCheck className="size-4" />}
        />
        <Metric
          label="Top enquiry"
          value={today.topIntent ? label(today.topIntent.value) : '—'}
          hint={
            today.topIntent
              ? `${today.topIntent.count} call${today.topIntent.count === 1 ? '' : 's'} today`
              : 'no enquiries yet today'
          }
          icon={<Target className="size-4" />}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card
          className="lg:col-span-2"
          title="Calls in progress"
          subtitle="Refreshes every few seconds"
          action={
            data.live.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-live">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-live" />
                </span>
                Live
              </span>
            )
          }
        >
          {data.live.length === 0 ? (
            <EmptyState
              icon={<PhoneCall className="size-5" />}
              title="No calls right now"
              hint="A call appears here the moment a caller connects, and moves to Recent calls when it ends."
            />
          ) : (
            <ul className="divide-y divide-border">
              {data.live.map((call) => (
                <li key={call.runId} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-live-soft text-live">
                    {call.channel === 'phone' ? (
                      <PhoneCall className="size-4" />
                    ) : (
                      <Globe className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {call.caller
                        ? phone(call.caller)
                        : call.channel === 'web'
                          ? 'Website visitor'
                          : 'Unknown caller'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {call.step ?? (call.channel === 'phone' ? 'Phone call' : 'Browser call')}
                    </p>
                  </div>
                  <span className="tnum text-sm font-medium text-live">
                    {duration(Math.max(0, now - new Date(call.startedAt).getTime()))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          className="lg:col-span-3"
          title="Recent calls"
          subtitle="The latest calls the assistant finished"
        >
          {data.recent.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="size-5" />}
              title="No calls yet"
              hint="Finished calls appear here within seconds, with what the caller wanted."
            />
          ) : (
            <ul className="divide-y divide-border">
              {data.recent.map((call) => (
                <li key={call.conversationId}>
                  <Link
                    href={`/conversations/${call.conversationId}`}
                    className="group flex items-start gap-3 px-4 py-3 transition hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="text-sm font-medium">
                          {call.callerName ??
                            (call.callerPhone ? phone(call.callerPhone) : 'Website visitor')}
                        </p>
                        {call.callerName && call.callerPhone && (
                          <span className="tnum text-xs text-muted-foreground">
                            {phone(call.callerPhone)}
                          </span>
                        )}
                        {call.intent && (
                          <Badge className="bg-ai-soft text-ai">{label(call.intent)}</Badge>
                        )}
                        {call.outcome && (
                          <Badge className={cn(outcomeTone(call.outcome))}>
                            {label(call.outcome)}
                          </Badge>
                        )}
                      </div>
                      {call.summary && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {call.summary}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right text-xs text-muted-foreground">
                      <p>{relative(call.startedAt)}</p>
                      <p className="tnum mt-0.5">{duration(call.durationMs)}</p>
                    </div>
                    <ChevronRight
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground/50 transition group-hover:text-foreground"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

/** Ticks once a second while there is something live to count up. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

/** "user_hangup" → "User hangup", "LEAD_QUALIFIED" → "Lead qualified". */
function label(value: string): string {
  const words = value.replace(/[_-]+/g, ' ').trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function outcomeTone(outcome: string): string {
  const o = outcome.toLowerCase();
  if (/qualified|booked|resolved|success|info_provided/.test(o)) return 'bg-live-soft text-live';
  if (/error|fail|busy|no.?answer/.test(o)) return 'bg-warn-soft text-warn';
  return 'bg-muted text-muted-foreground';
}
