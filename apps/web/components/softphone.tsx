'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Phone,
  PhoneOff,
  PhoneIncoming,
  Pause,
  Play,
  Forward,
  Sparkles,
  Clock,
  User,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DISPOSITION_LABELS, type Disposition, type ScreenPopPayload } from '@superdemo/contracts';
import { api } from '@/lib/api';
import { useSession, useUser } from './providers';
import { Avatar, Badge, Button, Select, Textarea, cn } from './composites';
import { duration, ESCALATION_LABEL, phone } from '@/lib/format';

type Phase = 'idle' | 'ringing' | 'talking' | 'wrapup';

/**
 * The agent's phone.
 *
 * Docked into the app shell rather than living on a page, because an agent needs
 * to browse a caller's history *while* talking to them — a softphone you have to
 * navigate to is a softphone that loses the call.
 *
 * The screen-pop is the point: when it rings, the agent already has the caller's
 * name, the course they asked about, the AI's summary and the reason it stepped
 * back. They open with "Hello Fatima, I understand you're asking about the ABA
 * payment plan" instead of "Can I take your name?".
 */
export function Softphone() {
  const { socket } = useSession();
  const user = useUser();
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<Phase>('idle');
  const [pop, setPop] = useState<ScreenPopPayload | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [onHold, setOnHold] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [wrapSecs, setWrapSecs] = useState(0);
  const [disposition, setDisposition] = useState<Disposition | ''>('');
  const [notes, setNotes] = useState('');
  const [expanded, setExpanded] = useState(true);
  const [busy, setBusy] = useState(false);

  const startedAt = useRef<number | null>(null);
  const ring = useRef<HTMLAudioElement | null>(null);

  /* ------------------------------ ring tone ------------------------------ */

  useEffect(() => {
    // Synthesised rather than a bundled file: no asset to ship, and it works
    // offline. Two short beeps, repeating, so it's audible without being shrill.
    if (phase !== 'ringing') {
      ring.current?.pause();
      return;
    }
    let ctx: AudioContext | null = null;
    let stopped = false;

    const beep = () => {
      if (stopped) return;
      ctx ??= new AudioContext();
      const now = ctx.currentTime;
      for (const offset of [0, 0.28]) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 620;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, now + offset);
        gain.gain.linearRampToValueAtTime(0.12, now + offset + 0.02);
        gain.gain.linearRampToValueAtTime(0, now + offset + 0.2);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.22);
      }
    };

    beep();
    const timer = setInterval(beep, 2200);
    return () => {
      stopped = true;
      clearInterval(timer);
      void ctx?.close();
    };
  }, [phase]);

  /* ------------------------------- timers -------------------------------- */

  useEffect(() => {
    if (phase !== 'talking') return;
    const t = setInterval(() => {
      if (startedAt.current) setElapsed(Date.now() - startedAt.current);
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'wrapup' || wrapSecs <= 0) return;
    const t = setInterval(() => setWrapSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [phase, wrapSecs]);

  /* ---------------------------- socket events ---------------------------- */

  useEffect(() => {
    if (!socket) return;

    const onScreenPop = (payload: ScreenPopPayload) => {
      setPop(payload);
      setCallId(payload.callId);
      setPhase('ringing');
      setExpanded(true);
    };

    const onRevoked = ({ reason }: { callId: string; reason: string }) => {
      setPhase('idle');
      setPop(null);
      setCallId(null);
      toast.info(`Call withdrawn — ${reason}`);
    };

    const onWrapupStarted = ({ secondsRemaining }: { secondsRemaining: number }) => {
      setPhase('wrapup');
      setWrapSecs(secondsRemaining);
      setElapsed(0);
      startedAt.current = null;
    };

    const onWrapupEnded = () => {
      setPhase('idle');
      setPop(null);
      setCallId(null);
      setDisposition('');
      setNotes('');
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
      void queryClient.invalidateQueries({ queryKey: ['liveops'] });
    };

    socket.on('agent.screen_pop', onScreenPop);
    socket.on('agent.offer_revoked', onRevoked);
    socket.on('agent.wrapup_started', onWrapupStarted);
    socket.on('agent.wrapup_ended', onWrapupEnded);

    return () => {
      socket.off('agent.screen_pop', onScreenPop);
      socket.off('agent.offer_revoked', onRevoked);
      socket.off('agent.wrapup_started', onWrapupStarted);
      socket.off('agent.wrapup_ended', onWrapupEnded);
    };
  }, [socket, queryClient]);

  /* ------------------------------- actions ------------------------------- */

  const act = useCallback(async (fn: () => Promise<unknown>, failMessage: string) => {
    setBusy(true);
    try {
      await fn();
    } catch (error) {
      toast.error(`${failMessage}: ${(error as Error).message}`);
    } finally {
      setBusy(false);
    }
  }, []);

  const answer = () =>
    act(async () => {
      await api.post('/calls/answer', { callId });
      startedAt.current = Date.now();
      setElapsed(0);
      setPhase('talking');
      void queryClient.invalidateQueries({ queryKey: ['liveops'] });
    }, 'Could not answer');

  const reject = () =>
    act(async () => {
      await api.post('/calls/reject', { callId, reason: 'declined by agent' });
      setPhase('idle');
      setPop(null);
      setCallId(null);
    }, 'Could not decline');

  const hangup = () =>
    act(async () => {
      await api.post('/calls/hangup', { callId });
    }, 'Could not hang up');

  const toggleHold = () =>
    act(async () => {
      await api.post('/calls/hold', { callId, hold: !onHold });
      setOnHold((h) => !h);
    }, 'Could not change hold');

  const submitWrapup = () => {
    // Guard outside `act`: throwing inside it was reported through the generic
    // "Could not save wrap-up" handler, so a missing disposition surfaced as a
    // save failure — two toasts, and the misleading one on top. This is
    // validation, not a failed request, so it never reaches the error path.
    if (!disposition) {
      toast.error('Choose a disposition before finishing');
      return;
    }
    return act(async () => {
      await api.post('/calls/wrapup', { callId, disposition, notes: notes || undefined });
    }, 'Could not save wrap-up');
  };

  if (phase === 'idle') return null;

  const ai = pop?.ai;

  return (
    <aside
      className="fixed right-4 bottom-4 z-50 w-[min(26rem,calc(100vw-2rem))]"
      aria-live="polite"
      aria-label="Softphone"
    >
      <div
        className={cn(
          'overflow-hidden rounded-card border bg-card shadow-2xl',
          phase === 'ringing' ? 'border-live' : 'border-border',
        )}
      >
        {/* header */}
        <div
          className={cn(
            'flex items-center gap-2.5 px-4 py-2.5',
            phase === 'ringing' && 'bg-live-soft',
            phase === 'talking' && 'bg-brand-soft',
            phase === 'wrapup' && 'bg-muted',
          )}
        >
          {phase === 'ringing' ? (
            <PhoneIncoming className="pulse size-4 text-live" aria-hidden />
          ) : phase === 'talking' ? (
            <Phone className="size-4 text-primary" aria-hidden />
          ) : (
            <Clock className="size-4 text-muted-foreground" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {phase === 'ringing' && 'Incoming call'}
              {phase === 'talking' && (onHold ? 'On hold' : 'In call')}
              {phase === 'wrapup' && 'Wrap-up'}
            </p>
            <p className="tnum truncate text-xs text-muted-foreground">
              {phase === 'talking' && duration(elapsed)}
              {phase === 'ringing' && pop && `waited ${duration(pop.waitedMs)}`}
              {phase === 'wrapup' && `${wrapSecs}s to submit`}
            </p>
          </div>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="rounded p-1 hover:bg-card"
            aria-label={expanded ? 'Collapse softphone' : 'Expand softphone'}
          >
            {expanded ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </button>
        </div>

        {expanded && (
          <div className="max-h-[70vh] overflow-y-auto">
            {/* caller */}
            <div className="flex items-start gap-3 border-b border-border px-4 py-3">
              <Avatar name={pop?.contact?.name ?? 'Unknown'} size={38} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{pop?.contact?.name ?? 'Unknown caller'}</p>
                <p className="tnum text-xs text-muted-foreground">{phone(pop?.fromNumber)}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {pop?.queueName && <Badge>{pop.queueName}</Badge>}
                  {pop?.contact?.courseInterest && (
                    <Badge className="text-foreground">{pop.contact.courseInterest}</Badge>
                  )}
                </div>
              </div>
              {pop?.contact?.bitrixUrl && (
                <a
                  href={pop.contact.bitrixUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Bitrix <ExternalLink className="size-3" aria-hidden />
                </a>
              )}
            </div>

            {/* the differentiator: AI context before hello */}
            {ai && (
              <div className="border-b border-border bg-ai-soft/40 px-4 py-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-ai">
                  <Sparkles className="size-3.5" aria-hidden />
                  What the AI already established
                </div>
                <p className="mt-1.5 text-sm leading-relaxed">{ai.summary}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge className="bg-card">{ESCALATION_LABEL[ai.escalationReason]}</Badge>
                  {ai.detectedIntent && <Badge className="bg-card">{ai.detectedIntent}</Badge>}
                  <Badge className="bg-card">{ai.turns} AI turns</Badge>
                  {ai.sentiment !== null && ai.sentiment < -0.2 && (
                    <Badge className="bg-destructive/10 text-destructive">Caller frustrated</Badge>
                  )}
                </div>

                {ai.transcript.length > 0 && (
                  <details className="mt-2.5">
                    <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                      Read the transcript so far ({ai.transcript.length} lines)
                    </summary>
                    <div className="mt-2 max-h-48 space-y-1.5 overflow-y-auto rounded-lg bg-card p-2.5">
                      {ai.transcript.map((s) => (
                        <p key={s.id} className="text-xs leading-relaxed">
                          <span
                            className={cn(
                              'font-semibold',
                              s.speaker === 'CALLER' ? 'text-foreground' : 'text-ai',
                            )}
                          >
                            {s.speaker === 'CALLER' ? 'Caller' : 'AI'}:
                          </span>{' '}
                          <span className="text-muted-foreground">{s.text}</span>
                        </p>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}

            {/* prior contact history */}
            {pop && pop.history.length > 0 && (
              <div className="border-b border-border px-4 py-2.5">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <User className="size-3.5" aria-hidden /> Previously contacted us{' '}
                  {pop.history.length} time{pop.history.length === 1 ? '' : 's'}
                </p>
              </div>
            )}

            {/* wrap-up form */}
            {phase === 'wrapup' && (
              <div className="space-y-2.5 border-b border-border px-4 py-3">
                <label className="block text-xs font-medium text-muted-foreground">
                  Disposition <span className="text-destructive">*</span>
                  <Select
                    className="mt-1"
                    value={disposition}
                    onChange={(e) => setDisposition(e.target.value as Disposition)}
                  >
                    <option value="">Choose an outcome…</option>
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
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Anything the next person should know…"
                  />
                </label>
              </div>
            )}

            {/* controls */}
            <div className="flex flex-wrap gap-2 px-4 py-3">
              {phase === 'ringing' && (
                <>
                  <Button
                    variant="live"
                    size="lg"
                    className="flex-1"
                    loading={busy}
                    onClick={answer}
                  >
                    <Phone className="size-4" aria-hidden /> Answer
                  </Button>
                  <Button variant="secondary" size="lg" loading={busy} onClick={reject}>
                    Decline
                  </Button>
                </>
              )}

              {phase === 'talking' && (
                <>
                  <Button
                    variant="danger"
                    size="lg"
                    className="flex-1"
                    loading={busy}
                    onClick={hangup}
                  >
                    <PhoneOff className="size-4" aria-hidden /> End call
                  </Button>
                  <Button variant="secondary" size="lg" loading={busy} onClick={toggleHold}>
                    {onHold ? <Play className="size-4" /> : <Pause className="size-4" />}
                    {onHold ? 'Resume' : 'Hold'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => toast.info('Transfer: pick a queue from the call detail page')}
                  >
                    <Forward className="size-4" aria-hidden />
                  </Button>
                </>
              )}

              {phase === 'wrapup' && (
                <Button
                  variant="default"
                  size="lg"
                  className="flex-1"
                  loading={busy}
                  // Prevent rather than warn: the disposition is mandatory, so
                  // the action stays unavailable until one is chosen.
                  disabled={!disposition}
                  onClick={submitWrapup}
                >
                  {disposition ? 'Finish and go available' : 'Choose a disposition'}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      <p className="mt-1.5 text-center text-[11px] text-muted-foreground/70">
        {user.name} · ext {user.id.slice(-4)}
      </p>
    </aside>
  );
}
