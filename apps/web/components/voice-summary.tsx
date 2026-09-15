'use client';

import { useQuery } from '@tanstack/react-query';
import { Mic } from 'lucide-react';
import type { DograhConnectionView } from '@superdemo/contracts';
import { api } from '@/lib/api';
import { Badge, Card, Spinner } from '@/components/composites';

/**
 * What a centre's own admin is told about its voice agent.
 *
 * Read-only, and that is the point. Choosing the agent means listing every
 * workflow on the voice host — and a centre without its own key is using the
 * deployment's, so that list names other clients' agents. The picker that used
 * to be here therefore moved to the platform operator's page; see
 * apps/api/src/platform/platform-voice.controller.ts for the whole argument.
 *
 * What is left is everything a tenant admin actually needs to know: whether a
 * voice agent is connected, which one, and whether the page's call button will
 * work. Their own demo calls still run from the Demo calls page.
 */
export function VoiceSummary() {
  const conn = useQuery({
    queryKey: ['dograh-summary'],
    queryFn: () => api.get<DograhConnectionView>('/sites/mine/dograh'),
  });

  return (
    <Card
      className="mt-4"
      title={
        <span className="flex items-center gap-2">
          <Mic className="size-4" aria-hidden /> Voice agent
        </span>
      }
      subtitle="The agent behind this page's call button"
      contentClassName="p-4"
    >
      {conn.isLoading ? (
        <Spinner label="Checking…" />
      ) : conn.isError ? (
        <p className="text-sm text-muted-foreground">
          Could not read the connection — {(conn.error as Error).message}
        </p>
      ) : (
        <div className="grid gap-2 text-sm">
          <p className="flex items-center gap-2">
            <Badge dot={conn.data?.connected ? 'bg-live' : 'bg-muted-foreground'}>
              {conn.data?.connected ? 'Connected' : 'Not connected'}
            </Badge>
            {conn.data?.workflowName ? (
              <span className="text-muted-foreground">{conn.data.workflowName}</span>
            ) : null}
          </p>
          <p className="max-w-prose text-[11px] leading-relaxed text-muted-foreground">
            {conn.data?.connected ? (
              <>
                The call button on your page reaches this agent. Which agent it is, and the
                credentials behind it, are set by your platform operator — the agent list covers the
                whole voice host rather than one centre, so it is not shown here.
              </>
            ) : (
              <>
                No voice agent is connected, so the page falls back to a plain phone link. Ask your
                platform operator to connect one.
              </>
            )}
          </p>
        </div>
      )}
    </Card>
  );
}
