'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Pause,
  Play,
  Download,
  Send,
  Sparkles,
  User,
  XCircle,
} from 'lucide-react';
import {
  DISPOSITION_LABELS,
  EVAL_DIMENSIONS,
  evalBand,
  type ConversationDetail,
  type Disposition,
} from '@superdemo/contracts';
import { api } from '@/lib/api';
import { useSession, useUser } from '@/components/providers';
import { CHANNEL_LABEL, dateTime, duration, ESCALATION_LABEL, phone, time } from '@/lib/format';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Input,
  Select,
  Spinner,
  Textarea,
  cn,
} from '@/components/composites';

export default function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { socket } = useSession();
  const user = useUser();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => api.get<ConversationDetail>(`/conversations/${id}`),
  });

  /* Live updates while a call or chat is still open. */
  useEffect(() => {
    if (!socket) return;
    socket.emit('conversation.subscribe', { conversationId: id });
    const refresh = () => void queryClient.invalidateQueries({ queryKey: ['conversation', id] });
    socket.on('message.created', refresh);
    socket.on('call.state_changed', refresh);
    socket.on('call.completed', refresh);
    return () => {
      socket.emit('conversation.unsubscribe', { conversationId: id });
      socket.off('message.created', refresh);
      socket.off('call.state_changed', refresh);
      socket.off('call.completed', refresh);
    };
  }, [socket, id, queryClient]);

  const c = query.data;

  /* ----------------------------- audio player ---------------------------- */

  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);

  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    const onTime = () => setPositionMs(el.currentTime * 1000);
    const onEnd = () => setPlaying(false);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('ended', onEnd);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('ended', onEnd);
    };
  }, [c?.recording?.url]);

  const seekTo = (ms: number) => {
    const el = audio.current;
    if (!el) return;
    el.currentTime = ms / 1000;
    void el.play();
    setPlaying(true);
  };

  /* ------------------------------- editing ------------------------------- */

  const [disposition, setDisposition] = useState<Disposition | ''>('');
  const [notes, setNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!c) return;
    setDisposition(c.disposition ?? '');
    setNotes(c.notes ?? '');
    setDirty(false);
  }, [c?.id, c?.disposition, c?.notes]);

  const save = useMutation({
    mutationFn: () =>
      api.patch(`/conversations/${id}`, {
        disposition: disposition || undefined,
        notes: notes || undefined,
        tags: c?.tags,
      }),
    onSuccess: () => {
      toast.success('Saved');
      setDirty(false);
      void queryClient.invalidateQueries({ queryKey: ['conversation', id] });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  /* ---------------------------- chat reply ------------------------------- */

  const [reply, setReply] = useState('');
  const sendReply = useMutation({
    mutationFn: () => api.post('/whatsapp/send', { conversationId: id, text: reply }),
    onSuccess: () => {
      setReply('');
      void queryClient.invalidateQueries({ queryKey: ['conversation', id] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const claim = useMutation({
    mutationFn: () => api.post('/whatsapp/claim', { conversationId: id }),
    onSuccess: () => {
      toast.success('You have taken over this conversation');
      void queryClient.invalidateQueries({ queryKey: ['conversation', id] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (query.isLoading) return <Spinner label="Loading conversation…" />;
  if (query.isError || !c) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">
          Could not load this conversation: {(query.error as Error)?.message}
        </p>
      </div>
    );
  }

  const isOpenChat = c.channel !== 'VOICE' && c.status !== 'CLOSED';
  void tagInput;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6">
      <Link
        href="/conversations"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to inbox
      </Link>

      {/* header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Avatar name={c.contact?.name ?? 'Unknown'} size={44} />
          <div>
            <h1 className="text-lg font-semibold">{c.contact?.name ?? 'Unknown contact'}</h1>
            <p className="tnum text-sm text-muted-foreground">{phone(c.contact?.phoneE164)}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Badge>{CHANNEL_LABEL[c.channel]}</Badge>
              {c.aiContained ? (
                <Badge className="bg-ai-soft text-ai">
                  <Sparkles className="size-3" aria-hidden /> AI resolved
                </Badge>
              ) : (
                <Badge className="hs-sd-badge--handoff">
                  Escalated to {c.handledByName ?? 'an agent'}
                </Badge>
              )}
              {c.queueName && <Badge>{c.queueName}</Badge>}
              {c.crmSynced ? (
                <Badge className="bg-live-soft text-live">
                  <CheckCircle2 className="size-3" aria-hidden /> In CRM
                </Badge>
              ) : (
                <Badge className="bg-muted text-muted-foreground">
                  <XCircle className="size-3" aria-hidden /> Not yet in CRM
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>{dateTime(c.startedAt)}</p>
          <p className="tnum mt-0.5">Duration {duration(c.durationMs)}</p>
          {c.contact?.bitrixUrl && (
            <a
              href={c.contact.bitrixUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-primary hover:underline"
            >
              Open in Bitrix24 <ExternalLink className="size-3" aria-hidden />
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* transcript + recording */}
        <div className="space-y-4 lg:col-span-2">
          {!c.recording && c.channel === 'VOICE' && (
            <Card title="Recording">
              <p className="p-4 text-sm text-muted-foreground">
                {/*
                 * Say what happened to THIS call, not what other drivers would
                 * have done with it. Which driver carried a call is our
                 * business, and an operator cannot choose one — the previous
                 * wording named the driver and then recommended two others,
                 * which reads as the product apologising for itself.
                 *
                 * The carrier case also has to be separated out. A bridged call
                 * is two people talking over the phone network with nothing of
                 * ours in the audio path, so there is no recording AND no
                 * transcript. Saying "the transcript below is complete" about
                 * an empty list was a claim that the silence was the whole
                 * conversation.
                 */}
                {c.call?.driver === 'twilio'
                  ? 'Connected over the phone network. The audio went directly between the two ' +
                    'parties, so there is no recording and nothing was transcribed.'
                  : c.messages.length > 0
                    ? 'No audio was captured for this call. The transcript below is the full ' +
                      'conversation.'
                    : 'No audio was captured for this call, and nothing was transcribed.'}
              </p>
            </Card>
          )}

          {c.recording && (
            <Card title="Recording" subtitle="Click any transcript line to jump to that moment">
              <div className="flex items-center gap-3 p-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    const el = audio.current;
                    if (!el) return;
                    if (playing) {
                      el.pause();
                      setPlaying(false);
                    } else {
                      void el.play();
                      setPlaying(true);
                    }
                  }}
                  aria-label={playing ? 'Pause recording' : 'Play recording'}
                >
                  {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                  {playing ? 'Pause' : 'Play'}
                </Button>
                <div className="min-w-0 flex-1">
                  {/* Progress against the transcript, with the escalation moment
                      marked — a supervisor usually wants exactly that point. */}
                  <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-200"
                      style={{
                        width: `${Math.min(100, (positionMs / Math.max(1, c.recording.durationMs)) * 100)}%`,
                      }}
                    />
                    {c.call?.escalatedAt && c.call.ringingAt && (
                      <span
                        className="absolute inset-y-0 w-0.5 bg-warn"
                        title="AI handed off here"
                        style={{
                          left: `${Math.min(
                            100,
                            ((new Date(c.call.escalatedAt).getTime() -
                              new Date(c.call.ringingAt).getTime()) /
                              Math.max(1, c.recording.durationMs)) *
                              100,
                          )}%`,
                        }}
                      />
                    )}
                  </div>
                  <p className="tnum mt-1 text-xs text-muted-foreground">
                    {duration(positionMs)} / {duration(c.recording.durationMs)}
                    {c.call?.escalatedAt && <span className="ml-2 text-warn">▏handoff</span>}
                  </p>
                </div>
                <audio
                  ref={audio}
                  src={api.absolute(c.recording.url)}
                  preload="metadata"
                  className="hidden"
                />
              </div>
            </Card>
          )}

          <Card
            title={c.channel === 'VOICE' ? 'Transcript' : 'Conversation'}
            subtitle={`${c.messageCount} turn${c.messageCount === 1 ? '' : 's'}`}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  void api
                    .download(`/reports/transcript/${id}`)
                    .catch((e) => toast.error((e as Error).message))
                }
              >
                <Download className="size-3.5" aria-hidden /> Transcript
              </Button>
            }
          >
            <div className="max-h-[32rem] space-y-2.5 overflow-y-auto p-4">
              {c.messages.map((m) => {
                const isCaller = m.role === 'CALLER';
                const isAi = m.role === 'AI';
                return (
                  <div
                    key={m.id}
                    className={cn('flex', isCaller ? 'justify-start' : 'justify-end')}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        m.audioOffsetMs !== null && c.recording && seekTo(m.audioOffsetMs)
                      }
                      disabled={m.audioOffsetMs === null || !c.recording}
                      className={cn(
                        'max-w-[80%] rounded-lg px-3 py-2 text-left text-sm',
                        isCaller && 'bg-muted',
                        isAi && 'bg-ai-soft',
                        m.role === 'HUMAN_AGENT' && 'bg-primary text-primary-foreground',
                        m.role === 'SYSTEM' && 'bg-muted text-muted-foreground italic',
                        m.audioOffsetMs !== null &&
                          c.recording &&
                          'cursor-pointer hover:opacity-80',
                      )}
                    >
                      <span className="mb-0.5 flex items-center gap-1.5 text-[11px] opacity-70">
                        {isAi && <Sparkles className="size-2.5" aria-hidden />}
                        {isCaller
                          ? (c.contact?.name ?? 'Caller')
                          : isAi
                            ? 'AI assistant'
                            : (m.authorName ?? 'Agent')}
                        <span>· {time(m.createdAt)}</span>
                      </span>
                      {m.text}
                    </button>
                  </div>
                );
              })}
            </div>

            {isOpenChat && (
              <form
                className="flex gap-2 border-t border-border p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (reply.trim()) sendReply.mutate();
                }}
              >
                {!c.handledByName && (
                  <Button
                    type="button"
                    variant="default"
                    loading={claim.isPending}
                    onClick={() => claim.mutate()}
                  >
                    Take over
                  </Button>
                )}
                <Input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Reply to the customer…"
                />
                <Button
                  type="submit"
                  variant="default"
                  loading={sendReply.isPending}
                  disabled={!reply.trim()}
                >
                  <Send className="size-4" aria-hidden />
                </Button>
              </form>
            )}
          </Card>
        </div>

        {/* right rail */}
        <div className="space-y-4">
          {c.aiSession && (
            <Card title="What the AI did" subtitle={`${c.aiSession.turns} turns`}>
              <dl className="space-y-2.5 p-4 text-sm">
                {/*
                 * The score sits above the summary on purpose. A supervisor
                 * opening a call is asking "was this handled well?" before
                 * "what was it about" — the summary answers the second.
                 */}
                {c.callEval && (
                  <div className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Quality score
                        {c.callEval.reviewer === 'HUMAN' && (
                          <span className="ml-1.5 font-normal">· reviewed by a person</span>
                        )}
                      </span>
                      <span
                        className={cn(
                          'tnum text-lg font-semibold',
                          evalBand(c.callEval.score) === 'good'
                            ? 'text-foreground'
                            : evalBand(c.callEval.score) === 'watch'
                              ? 'text-ai'
                              : 'text-destructive',
                        )}
                      >
                        {c.callEval.score}
                      </span>
                    </div>

                    <ul className="mt-2 space-y-1">
                      {EVAL_DIMENSIONS.map((dim) => {
                        const v = c.callEval![dim.key];
                        return (
                          <li key={dim.key} className="flex items-center gap-2" title={dim.hint}>
                            <span className="w-16 shrink-0 text-[11px] text-muted-foreground">
                              {dim.label}
                            </span>
                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${v}%`,
                                  background:
                                    v >= 85
                                      ? 'var(--chart-3)'
                                      : v >= 70
                                        ? 'var(--chart-4)'
                                        : 'var(--destructive)',
                                }}
                              />
                            </div>
                            <span className="tnum w-7 text-right text-[11px]">{v}</span>
                          </li>
                        );
                      })}
                    </ul>

                    {c.callEval.note && (
                      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                        {c.callEval.note}
                      </p>
                    )}
                  </div>
                )}

                {c.aiSession.summary && (
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Summary</dt>
                    <dd className="mt-0.5 leading-relaxed">{c.aiSession.summary}</dd>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Intent</dt>
                    <dd className="mt-0.5 text-xs">
                      {c.aiSession.detectedIntent?.replace(/_/g, ' ') ?? '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Course</dt>
                    <dd className="mt-0.5 text-xs">{c.aiSession.courseOfInterest ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Handoff</dt>
                    <dd className="mt-0.5 text-xs">
                      {c.aiSession.escalationReason
                        ? ESCALATION_LABEL[c.aiSession.escalationReason]
                        : 'Not needed'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Avg latency</dt>
                    <dd className="tnum mt-0.5 text-xs">
                      {c.aiSession.avgLatencyMs ? `${c.aiSession.avgLatencyMs}ms` : '—'}
                    </dd>
                  </div>
                </div>
                <div className="border-t border-border pt-2.5">
                  <dt className="text-xs font-medium text-muted-foreground">Drivers used</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    <Badge>stt: {c.aiSession.driverStt}</Badge>
                    <Badge>llm: {c.aiSession.driverLlm}</Badge>
                    <Badge>tts: {c.aiSession.driverTts}</Badge>
                  </dd>
                </div>
              </dl>
            </Card>
          )}

          {c.call && (
            <Card title="Call timeline">
              <ul className="space-y-2 p-4 text-xs">
                {(
                  [
                    ['Ringing', c.call.ringingAt],
                    ['AI answered', c.call.aiAnsweredAt],
                    ['Escalated', c.call.escalatedAt],
                    ['Agent answered', c.call.agentAnsweredAt],
                    ['Ended', c.call.endedAt],
                  ] as const
                )
                  .filter(([, at]) => at)
                  .map(([label, at]) => (
                    <li key={label} className="flex justify-between gap-2">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="tnum">{time(at)}</span>
                    </li>
                  ))}
                <li className="flex justify-between gap-2 border-t border-border pt-2">
                  <span className="text-muted-foreground">Queue wait</span>
                  <span className="tnum">{duration(c.call.queueWaitMs)}</span>
                </li>
                <li className="flex justify-between gap-2">
                  <span className="text-muted-foreground">AI talk time</span>
                  <span className="tnum">{duration(c.call.aiTalkMs)}</span>
                </li>
                <li className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Agent talk time</span>
                  <span className="tnum">{duration(c.call.agentTalkMs)}</span>
                </li>
              </ul>

              {c.call.participants && c.call.participants.length > 0 && (
                <div className="border-t border-border p-4">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Who was on the call
                  </p>
                  <ul className="space-y-1.5">
                    {c.call.participants.map((p) => (
                      <li key={p.id} className="flex items-center gap-2 text-xs">
                        {p.kind === 'AI_AGENT' ? (
                          <Sparkles className="size-3 text-ai" aria-hidden />
                        ) : (
                          <User className="size-3 text-muted-foreground" aria-hidden />
                        )}
                        <span>
                          {p.kind === 'CALLER'
                            ? (c.contact?.name ?? 'Caller')
                            : p.kind === 'AI_AGENT'
                              ? 'AI assistant'
                              : (p.userName ?? 'Agent')}
                        </span>
                        <span className="tnum ml-auto text-muted-foreground/70">
                          {time(p.joinedAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          <Card title="Outcome" subtitle="Disposition feeds the analytics breakdown">
            <div className="space-y-2.5 p-4">
              <label className="block text-xs font-medium text-muted-foreground">
                Disposition
                <Select
                  className="mt-1"
                  value={disposition}
                  onChange={(e) => {
                    setDisposition(e.target.value as Disposition);
                    setDirty(true);
                  }}
                >
                  <option value="">Not set</option>
                  {Object.entries(DISPOSITION_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="block text-xs font-medium text-muted-foreground">
                Notes
                <Textarea
                  className="mt-1"
                  rows={3}
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setDirty(true);
                  }}
                />
              </label>
              <Button
                variant="default"
                className="w-full"
                disabled={!dirty}
                loading={save.isPending}
                onClick={() => save.mutate()}
              >
                Save
              </Button>
              {user.role === 'AGENT' && (
                <p className="text-[11px] text-muted-foreground/70">
                  Notes are visible to supervisors and are pushed to the Bitrix24 timeline.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
