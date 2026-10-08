'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarCheck, ExternalLink, RefreshCw } from 'lucide-react';
import type { CalcomLookupOutput, CalcomStatus } from '@superdemo/contracts';
import { api } from '@/lib/api';
import { relative } from '@/lib/format';
import { Badge, Button, Card, Input, Label, Select } from '@/components/composites';

/**
 * Connecting the centre's Cal.com.
 *
 * Two steps, because an event type can only be picked from the account a key
 * belongs to: paste the key and look it up, then choose which event type the
 * dashboard, the website and the voice agent book into. Once connected the key
 * is never shown again — only its last four characters — and changing the
 * event type does not ask for it.
 */
export function CalcomCard({ status, canManage }: { status: CalcomStatus; canManage: boolean }) {
  const qc = useQueryClient();
  const [apiKey, setApiKey] = useState('');
  const [found, setFound] = useState<CalcomLookupOutput | null>(null);
  const [eventTypeId, setEventTypeId] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);

  const refresh = (next: CalcomStatus) => {
    qc.setQueryData(['calendar', 'calcom'], next);
    void qc.invalidateQueries({ queryKey: ['calendar'] });
  };

  const lookup = useMutation({
    mutationFn: () =>
      api.post<CalcomLookupOutput>('/calendar/calcom/lookup', apiKey ? { apiKey } : {}),
    onSuccess: (out) => {
      setFound(out);
      setEventTypeId(
        out.eventTypes.find((e) => e.id === status.eventType?.id)?.id ?? out.eventTypes[0]?.id ?? null,
      );
      if (out.eventTypes.length === 0) toast.error('This Cal.com account has no event types yet');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const connect = useMutation({
    mutationFn: () =>
      api.put<CalcomStatus>('/calendar/calcom', {
        ...(apiKey ? { apiKey } : {}),
        eventTypeId,
      }),
    onSuccess: (next) => {
      refresh(next);
      setApiKey('');
      setFound(null);
      setEditing(false);
      toast.success(`Connected to Cal.com: ${next.eventType?.title ?? 'event type'}`);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const disconnect = useMutation({
    mutationFn: () => api.del<CalcomStatus>('/calendar/calcom'),
    onSuccess: (next) => {
      refresh(next);
      toast.success('Cal.com disconnected — back to the built-in calendar');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const sync = useMutation({
    mutationFn: () => api.post<CalcomStatus>('/calendar/calcom/sync', {}),
    onSuccess: (next) => {
      refresh(next);
      if (next.lastError) toast.error(next.lastError);
      else toast.success('Synced with Cal.com');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const title = (
    <span className="flex items-center gap-2">
      <CalendarCheck className="size-4 text-muted-foreground" aria-hidden /> Cal.com
      {status.connected && <Badge className="bg-live-soft text-live">Connected</Badge>}
    </span>
  );

  if (status.connected && !editing) {
    return (
      <Card
        title={title}
        subtitle="Free times come from your Cal.com availability, and every booking is created there."
        contentClassName="p-4"
      >
        <dl className="grid gap-2 text-sm">
          <Row label="Account">
            {status.account?.name ?? status.account?.username}{' '}
            <span className="text-muted-foreground">{status.account?.email}</span>
          </Row>
          <Row label="Event type">
            {status.eventType?.title}{' '}
            <span className="text-muted-foreground">· {status.eventType?.lengthMinutes} min</span>
          </Row>
          {status.bookingUrl && (
            <Row label="Booking page">
              <a
                href={status.bookingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                {status.bookingUrl.replace(/^https:\/\//, '')}
                <ExternalLink className="size-3" aria-hidden />
              </a>
            </Row>
          )}
          <Row label="Updates">
            {status.webhook ? 'Instant (webhook) and every minute' : 'Checked every minute'}
            {status.lastSyncedAt && (
              <span className="text-muted-foreground"> · last {relative(status.lastSyncedAt)}</span>
            )}
          </Row>
          {status.keyHint && (
            <Row label="API key">
              <span className="tnum text-muted-foreground">{status.keyHint}</span>
            </Row>
          )}
        </dl>
        {status.lastError && (
          <p className="mt-3 rounded-md bg-warn-soft px-3 py-2 text-xs text-warn">
            Last sync failed: {status.lastError}
          </p>
        )}
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button variant="outline" disabled={sync.isPending} onClick={() => sync.mutate()}>
            <RefreshCw className={sync.isPending ? 'animate-spin' : undefined} aria-hidden />
            Sync now
          </Button>
          {canManage && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(true);
                  lookup.mutate();
                }}
              >
                Change event type
              </Button>
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={disconnect.isPending}
                onClick={() => disconnect.mutate()}
              >
                Disconnect
              </Button>
            </>
          )}
        </div>
      </Card>
    );
  }

  if (!canManage) return null;

  return (
    <Card
      title={title}
      subtitle="Use your Cal.com calendar: its free times are offered here, on the website and by the voice agent, and bookings land in your Cal.com."
      contentClassName="p-4"
    >
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (found && eventTypeId) connect.mutate();
          else lookup.mutate();
        }}
      >
        {!status.connected && (
          <div className="grid gap-1.5">
            <Label htmlFor="calcom-key">API key</Label>
            <Input
              id="calcom-key"
              type="password"
              autoComplete="off"
              placeholder="cal_live_…"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setFound(null);
              }}
            />
            <p className="text-[11px] text-muted-foreground">
              Create one in{' '}
              <a
                href="https://app.cal.com/settings/developer/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                Cal.com → Settings → Developer → API keys
              </a>
              . It is stored encrypted and never shown again.
            </p>
          </div>
        )}

        {found && (
          <div className="grid gap-1.5">
            <Label htmlFor="calcom-event">
              Event type for{' '}
              <span className="font-normal text-muted-foreground">
                {found.account.username ?? found.account.email}
              </span>
            </Label>
            <Select
              id="calcom-event"
              value={eventTypeId ?? ''}
              onChange={(e) => setEventTypeId(Number(e.target.value))}
            >
              {found.eventTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} · {t.lengthMinutes} min
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="flex justify-end gap-2">
          {editing && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setFound(null);
              }}
            >
              Cancel
            </Button>
          )}
          {found ? (
            <Button type="submit" disabled={!eventTypeId || connect.isPending}>
              {connect.isPending ? 'Connecting…' : status.connected ? 'Save' : 'Connect'}
            </Button>
          ) : (
            <Button type="submit" disabled={(!status.connected && apiKey.length < 10) || lookup.isPending}>
              {lookup.isPending ? 'Checking…' : 'Continue'}
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate">{children}</dd>
    </div>
  );
}
