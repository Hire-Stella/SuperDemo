'use client';

import type { ReactNode } from 'react';
import { GitBranch, Sparkles } from 'lucide-react';
import type { CallInsights } from '@superdemo/contracts';
import { Card, Metric, cn } from '@/components/composites';
import { pct, seconds } from '@/lib/format';

/*
 * "Call insights": what the voice workflow gathered on each call.
 *
 * Every field comes from the data, not from a schema, so this renders the same
 * way for a property intake, a shipping enquiry or a tutoring call. Bars are
 * scaled to the largest value in their own list (so three calls still read
 * clearly) while the labelled percentage is always of the calls that answered.
 */

type Field = CallInsights['fields'][number];

export function CallInsightsSection({
  data,
  className,
}: {
  data: CallInsights;
  className?: string;
}) {
  const categories = data.fields.filter(
    (f): f is Extract<Field, { kind: 'category' }> => f.kind === 'category',
  );
  const booleans = data.fields.filter(
    (f): f is Extract<Field, { kind: 'boolean' }> => f.kind === 'boolean',
  );
  const n = data.calls;

  return (
    <Card
      className={className}
      title={
        <span className="inline-flex items-center gap-2">
          <Sparkles className="size-4 text-ai" aria-hidden /> Call insights
        </span>
      }
      subtitle={`What the voice workflow gathered on ${n.toLocaleString()} call${n === 1 ? '' : 's'} in this range`}
    >
      <div className="space-y-4 p-4">
        {/* headline + lead capture */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-5">
          <Metric label="Calls with workflow data" value={n.toLocaleString()} tone="ai" />
          <Metric label="Avg call length" value={seconds(data.avgDurationSeconds)} />
          {data.capture.map((c) => (
            <Metric
              key={c.kind}
              label={c.label}
              value={pct(c.pct, 0)}
              hint={`${c.count.toLocaleString()} of ${n.toLocaleString()} calls`}
              tone={c.pct >= 60 ? 'live' : c.pct >= 30 ? 'default' : 'warn'}
            />
          ))}
        </div>

        {/* outcome + journey */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title={data.outcomes.label} meta={answeredOf(sum(data.outcomes.values), n)}>
            {data.outcomes.values.length === 0 ? (
              <p className="text-sm text-muted-foreground">The workflow recorded no outcome.</p>
            ) : (
              <BarList items={data.outcomes.values} total={n} colour="var(--chart-2)" />
            )}
          </Panel>

          <Panel
            title={
              <span className="inline-flex items-center gap-1.5">
                <GitBranch className="size-3.5 text-muted-foreground" aria-hidden /> Call journey
              </span>
            }
            meta="calls reaching each step"
          >
            {data.journey.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                The workflow did not report its steps.
              </p>
            ) : (
              <ol className="space-y-2.5">
                {data.journey.map((step, i) => (
                  <li key={step.node} className="flex items-center gap-3">
                    <span className="tnum flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-sm" title={step.node}>
                          {step.node}
                        </span>
                        <span className="tnum shrink-0 text-xs text-muted-foreground">
                          {step.count.toLocaleString()} · {pct(step.pct, 0)}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${step.pct}%`, background: 'var(--chart-2)' }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>

        {/* per-field breakdowns */}
        {(categories.length > 0 || booleans.length > 0) && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              What callers told the assistant
            </p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {categories.map((f) => (
                <Panel key={f.key} title={f.label} meta={answeredOf(f.answered, n)}>
                  <BarList
                    items={
                      f.other > 0
                        ? [...f.values, { value: '__other', label: 'Other', count: f.other }]
                        : f.values
                    }
                    total={f.answered}
                    colour="var(--chart-1)"
                  />
                </Panel>
              ))}

              {booleans.length > 0 && (
                <Panel title="Yes / no answers" meta="share answering yes">
                  <ul className="space-y-2.5">
                    {booleans.map((b) => (
                      <li key={b.key}>
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="truncate text-sm">{b.label}</span>
                          <span className="tnum shrink-0 text-xs text-muted-foreground">
                            {pct(b.truePct, 0)}
                            <span className="text-muted-foreground/70">
                              {' '}
                              · {b.trueCount}/{b.answered}
                            </span>
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${b.truePct}%`, background: 'var(--chart-3)' }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function Panel({
  title,
  meta,
  children,
  className,
}: {
  title: ReactNode;
  meta?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-lg border bg-card p-3.5', className)}>
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="truncate text-sm font-medium">{title}</h3>
        {meta && <span className="shrink-0 text-[11px] text-muted-foreground">{meta}</span>}
      </header>
      {children}
    </section>
  );
}

/** Horizontal bars, widest = the top value; the % is of `total`. */
function BarList({
  items,
  total,
  colour,
}: {
  items: { value: string; label: string; count: number }[];
  total: number;
  colour: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li
          key={item.value}
          className="relative flex items-center gap-3 overflow-hidden rounded-md px-2 py-1.5"
        >
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 rounded-md"
            style={{
              width: `${(item.count / max) * 100}%`,
              background: `color-mix(in oklch, ${colour} ${item.value === '__other' ? 8 : 16}%, transparent)`,
            }}
          />
          <span className="relative min-w-0 flex-1 truncate text-sm" title={item.label}>
            {item.label}
          </span>
          <span className="tnum relative shrink-0 text-xs">
            {item.count.toLocaleString()}
            <span className="ml-1.5 inline-block w-9 text-right text-muted-foreground">
              {pct(total ? (item.count / total) * 100 : 0, 0)}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function sum(values: { count: number }[]): number {
  return values.reduce((s, v) => s + v.count, 0);
}

function answeredOf(answered: number, of: number): string {
  if (answered !== of) return `${answered.toLocaleString()} of ${of.toLocaleString()} calls`;
  return of === 1 ? '1 call' : `all ${of.toLocaleString()} calls`;
}
