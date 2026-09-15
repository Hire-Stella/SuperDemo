'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Download, Inbox, MessageCircle, Phone, Search, Sparkles } from 'lucide-react';
import {
  Disposition,
  dispositionLabel,
  evalBand,
  type Channel,
  type ConversationListItem,
  type DispositionFilter,
} from '@superdemo/contracts';
import { api, qs } from '@/lib/api';
import { useUser } from '@/components/providers';
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
} from '@/components/composites';

/**
 * One tone per outcome, exhaustive on purpose: adding an outcome to the enum
 * should make the compiler ask what colour it is rather than quietly render it
 * grey. Only the outcomes worth spotting from across the room get colour — a
 * table where every badge is coloured is a table nobody scans.
 */
const OUTCOME_TONE: Record<Disposition, string> = {
  LEAD_QUALIFIED: 'bg-live-soft text-live',
  ENROLMENT_INTEREST: 'bg-brand-soft text-primary',
  CALLBACK_REQUESTED: 'bg-amber-500/10 text-amber-600',
  FEE_ENQUIRY: '',
  INFO_PROVIDED: '',
  EXISTING_STUDENT_SUPPORT: '',
  NOT_INTERESTED: 'text-muted-foreground',
  WRONG_NUMBER: 'text-muted-foreground',
  SPAM: 'text-muted-foreground',
};

export default function ConversationsPage() {
  // Outcome labels read in this centre's own vocabulary.
  const user = useUser();
  const { socket } = useSession();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [channel, setChannel] = useState<Channel | ''>('');
  const [direction, setDirection] = useState<'' | 'INBOUND' | 'OUTBOUND'>('');
  const [contained, setContained] = useState<'' | 'true' | 'false'>('');
  const [outcome, setOutcome] = useState<DispositionFilter | ''>('');

  // Debounce so typing doesn't fire a query per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const query = useQuery({
    queryKey: ['conversations', debounced, channel, direction, contained, outcome],
    queryFn: () =>
      api.get<{ items: ConversationListItem[]; nextCursor: string | null }>(
        `/conversations${qs({
          limit: 50,
          search: debounced || undefined,
          channel: channel || undefined,
          direction: direction || undefined,
          aiContained: contained || undefined,
          disposition: outcome || undefined,
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
          <Inbox className="size-5 text-primary" aria-hidden />
          Unified inbox
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Every interaction, on every channel, in one place.
        </p>
      </header>

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="relative min-w-56 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground/70"
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
            value={direction}
            onChange={(e) => setDirection(e.target.value as '' | 'INBOUND' | 'OUTBOUND')}
            aria-label="Filter by direction"
          >
            <option value="">Inbound + outbound</option>
            <option value="INBOUND">Inbound only</option>
            <option value="OUTBOUND">Outbound only</option>
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
          {/*
           * Outcome is its own axis, not a third state of the containment
           * filter above: "AI resolved" and "escalated" say who handled the
           * call, while the outcome says what came of it. A qualified lead the
           * assistant closed on its own and one an advisor took over are both
           * qualified leads, and a supervisor pulling the week's leads wants
           * them in the same list.
           */}
          <Select
            className="w-auto"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as DispositionFilter | '')}
            aria-label="Filter by outcome"
          >
            <option value="">All outcomes</option>
            {Disposition.options.map((d) => (
              <option key={d} value={d}>
                {dispositionLabel(user.orgIndustry, d)}
              </option>
            ))}
            <option value="NONE">No outcome recorded</option>
          </Select>
          <Button
            className="ml-auto"
            onClick={() =>
              void api
                .download(
                  `/reports/conversations.csv${qs({
                    search: debounced || undefined,
                    channel: channel || undefined,
                    direction: direction || undefined,
                    aiContained: contained || undefined,
                    disposition: outcome || undefined,
                  })}`,
                )
                .catch(() => undefined)
            }
          >
            <Download className="size-4" aria-hidden /> Export CSV
          </Button>
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
                <tr key={c.id} className="transition hover:bg-muted">
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
                        <span className="tnum block truncate text-xs text-muted-foreground">
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
                    {/* Direction is shown on every row, not only when filtered:
                        "unified" has to be legible at a glance, and an outbound
                        follow-up reads very differently from an inbound enquiry. */}
                    <span
                      className="ml-1.5 inline-flex items-center gap-0.5 text-[11px] text-muted-foreground"
                      title={c.direction === 'OUTBOUND' ? 'Outbound — we called them' : 'Inbound — they called us'}
                    >
                      {c.direction === 'OUTBOUND' ? (
                        <ArrowUpRight className="size-3" aria-hidden />
                      ) : (
                        <ArrowDownLeft className="size-3" aria-hidden />
                      )}
                      {c.direction === 'OUTBOUND' ? 'Out' : 'In'}
                    </span>
                  </Td>
                  <Td>
                    {/* The outcome itself leads: what came of the call is the
                        column's question. Who handled it sits underneath, in
                        the same place the eye already goes for the handoff
                        reason. */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {c.disposition ? (
                        <Badge className={OUTCOME_TONE[c.disposition]}>
                          {dispositionLabel(user.orgIndustry, c.disposition)}
                        </Badge>
                      ) : (
                        <span
                          className="text-xs text-muted-foreground/70"
                          title="Nobody recorded an outcome for this one"
                        >
                          No outcome recorded
                        </span>
                      )}
                      {/*
                       * Only shown when it is worth acting on. A green 94 on
                       * every row is decoration that trains people to stop
                       * reading the column; a 61 is the reason to open the call.
                       */}
                      {c.evalScore !== null && evalBand(c.evalScore) !== 'good' && (
                        <span title="Assistant quality score">
                          <Badge
                            className={
                              evalBand(c.evalScore) === 'poor'
                                ? 'bg-destructive/10 text-destructive'
                                : 'bg-amber-500/10 text-amber-600'
                            }
                          >
                            {c.evalScore}
                          </Badge>
                        </span>
                      )}
                    </div>
                    <span className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground/80">
                      {c.aiContained ? (
                        <span className="inline-flex items-center gap-1 text-ai">
                          <Sparkles className="size-3" aria-hidden /> AI resolved
                        </span>
                      ) : (
                        <span>Escalated</span>
                      )}
                      {/* Only meaningful when it actually handed over. An
                          AI-contained conversation never reached a person, so a
                          handoff reason left on its session is stale, and
                          "AI resolved · asked for a human" reads as a bug. */}
                      {!c.aiContained && c.escalationReason && (
                        <span>· {ESCALATION_LABEL[c.escalationReason]}</span>
                      )}
                    </span>
                  </Td>
                  <Td className="text-xs">
                    {c.handledByName ?? <span className="text-ai">AI assistant</span>}
                  </Td>
                  <Td className="max-w-[20rem]">
                    <span className="block truncate text-xs text-muted-foreground">
                      {c.lastMessagePreview ?? '—'}
                    </span>
                  </Td>
                  <Td className="tnum text-right text-xs">{duration(c.durationMs)}</Td>
                  <Td className="text-right">
                    <span className="block text-xs whitespace-nowrap">{dateTime(c.startedAt)}</span>
                    <span className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-muted-foreground/70">
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
