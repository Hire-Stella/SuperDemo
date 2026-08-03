'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Inbox, Search, Sparkles, MessageCircle, Phone, CheckCircle2 } from 'lucide-react';
import {
  DISPOSITION_LABELS,
  type Channel,
  type ConversationListItem,
} from '@fit-ai/contracts';
import { api, qs } from '@/lib/api';
import { useSession } from '@/components/providers';
import { CHANNEL_LABEL, dateTime, duration, ESCALATION_LABEL, phone } from '@/lib/format';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Select,
  SkeletonRows,
  Table,
  Td,
  Th,
} from '@/components/ui';

export default function ConversationsPage() {
  const { socket } = useSession();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [channel, setChannel] = useState<Channel | ''>('');
  const [contained, setContained] = useState<'' | 'true' | 'false'>('');

  // Debounce so typing doesn't fire a query per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const query = useQuery({
    queryKey: ['conversations', debounced, channel, contained],
    queryFn: () =>
      api.get<{ items: ConversationListItem[]; nextCursor: string | null }>(
        `/conversations${qs({
          limit: 50,
          search: debounced || undefined,
          channel: channel || undefined,
          aiContained: contained || undefined,
        })}`,
      ),
  });

  useEffect(() => {
    if (!socket) return;
    const refresh = () => void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    socket.on('call.completed', refresh);
    socket.on('conversation.updated', refresh);
    return () => {
      socket.off('call.completed', refresh);
      socket.off('conversation.updated', refresh);
    };
  }, [socket, queryClient]);

  const items = query.data?.items ?? [];

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6">
      <header className="mb-4">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Inbox className="size-5 text-brand" aria-hidden />
          Unified inbox
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          Every interaction, on every channel, in one place.
        </p>
      </header>

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="relative min-w-56 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-faint"
              aria-hidden
            />
            <Input
              className="pl-8"
              placeholder="Search name, number, message text, notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search conversations"
            />
          </div>
          <Select
            className="w-auto"
            value={channel}
            onChange={(e) => setChannel(e.target.value as Channel | '')}
            aria-label="Filter by channel"
          >
            <option value="">All channels</option>
            <option value="VOICE">Voice</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="WEBCHAT">Web chat</option>
          </Select>
          <Select
            className="w-auto"
            value={contained}
            onChange={(e) => setContained(e.target.value as '' | 'true' | 'false')}
            aria-label="Filter by AI containment"
          >
            <option value="">AI + agent</option>
            <option value="true">AI-contained only</option>
            <option value="false">Reached an agent</option>
          </Select>
        </div>

        {query.isLoading ? (
          <SkeletonRows rows={8} cols={6} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Inbox className="size-7" />}
            title="Nothing matches"
            hint="Adjust the filters, or run a scenario from the simulator to generate traffic."
            action={
              <Link href="/simulator">
                <Button size="sm">Open simulator</Button>
              </Link>
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Contact</Th>
                <Th>Channel</Th>
                <Th>Outcome</Th>
                <Th>Handled by</Th>
                <Th>Preview</Th>
                <Th className="text-right">Duration</Th>
                <Th className="text-right">When</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((c) => (
                <tr key={c.id} className="transition hover:bg-surface-2">
                  <Td>
                    <Link
                      href={`/conversations/${c.id}`}
                      className="flex items-center gap-2.5 hover:underline"
                    >
                      <Avatar name={c.contact?.name ?? 'Unknown'} size={26} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {c.contact?.name ?? 'Unknown'}
                        </span>
                        <span className="tnum block truncate text-xs text-muted">
                          {phone(c.contact?.phoneE164)}
                        </span>
                      </span>
                    </Link>
                  </Td>
                  <Td>
                    <Badge>
                      {c.channel === 'VOICE' ? (
                        <Phone className="size-3" aria-hidden />
                      ) : (
                        <MessageCircle className="size-3" aria-hidden />
                      )}
                      {CHANNEL_LABEL[c.channel]}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {c.aiContained ? (
                        <Badge className="bg-ai-soft text-ai">
                          <Sparkles className="size-3" aria-hidden /> AI resolved
                        </Badge>
                      ) : (
                        <Badge className="bg-brand-soft text-brand">Escalated</Badge>
                      )}
                      {c.escalationReason && (
                        <span className="text-[11px] text-muted">
                          {ESCALATION_LABEL[c.escalationReason]}
                        </span>
                      )}
                    </div>
                    {c.disposition && (
                      <span className="mt-0.5 block text-[11px] text-faint">
                        {DISPOSITION_LABELS[c.disposition]}
                      </span>
                    )}
                  </Td>
                  <Td className="text-xs">
                    {c.handledByName ?? <span className="text-ai">AI assistant</span>}
                  </Td>
                  <Td className="max-w-[20rem]">
                    <span className="block truncate text-xs text-muted">
                      {c.lastMessagePreview ?? '—'}
                    </span>
                  </Td>
                  <Td className="tnum text-right text-xs">{duration(c.durationMs)}</Td>
                  <Td className="text-right">
                    <span className="block text-xs whitespace-nowrap">{dateTime(c.startedAt)}</span>
                    <span className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-faint">
                      {c.hasRecording && <span title="Recording available">♪</span>}
                      {c.crmSynced && (
                        <span title="Synced to CRM">
                          <CheckCircle2 className="size-3 text-live" aria-hidden />
                        </span>
                      )}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
