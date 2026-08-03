'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Mic, MicOff, PhoneCall, PhoneOff, MessageCircle, Play, Sparkles } from 'lucide-react';
import type {
  BrowserCallTurnOutput,
  ScenarioDto,
  SimulateCallInput,
} from '@fit-ai/contracts';
import { api } from '@/lib/api';
import { Badge, Button, Card, Input, MockNotice, Select, Spinner, cn } from '@/components/composites';
import { ElevenLabsCall } from '@/components/elevenlabs-call';

/* ------------------------- Web Speech type shims -------------------------- */
/* Not in lib.dom yet; declared narrowly rather than reaching for `any`.       */

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
  length: number;
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: { length: number; [i: number]: SpeechRecognitionResult };
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface Turn {
  who: 'you' | 'ai';
  text: string;
  latencyMs?: number;
}

export default function SimulatorPage() {
  const queryClient = useQueryClient();

  const scenarios = useQuery({
    queryKey: ['scenarios'],
    queryFn: () => api.get<ScenarioDto[]>('/calls/scenarios'),
  });

  const waScenarios = useQuery({
    queryKey: ['wa-scenarios'],
    queryFn: () =>
      api.get<{ id: string; title: string; callerName: string; escalates: boolean }[]>(
        '/whatsapp/scenarios',
      ),
  });

  const [scenarioId, setScenarioId] = useState('');
  const [speed, setSpeed] = useState('1');

  const simulate = useMutation({
    mutationFn: (input: SimulateCallInput) => api.post('/calls/simulate', input),
    onSuccess: (data) => {
      const d = data as { title?: string };
      toast.success(`Call started: ${d.title ?? 'scripted scenario'}`);
      void queryClient.invalidateQueries({ queryKey: ['liveops'] });
      void queryClient.invalidateQueries({ queryKey: ['active-calls'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const simulateWa = useMutation({
    mutationFn: (id?: string) => api.post('/whatsapp/simulate/scenario', { scenarioId: id }),
    onSuccess: () => {
      toast.success('WhatsApp conversation started');
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
      void queryClient.invalidateQueries({ queryKey: ['liveops'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  /* ============================ browser call ============================= */

  const [callId, setCallId] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [interim, setInterim] = useState('');
  const [escalated, setEscalated] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);

  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const callStart = useRef<number>(0);
  const transcriptEnd = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSupported(getRecognition() !== null && 'speechSynthesis' in window);
  }, []);

  useEffect(() => {
    transcriptEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, interim]);

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-GB';
    utter.rate = 1.05;
    // Prefer a British English voice to match the configured agent voice.
    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang === 'en-GB') ?? null;
    if (voice) utter.voice = voice;
    window.speechSynthesis.speak(utter);
  };

  const sendTurn = async (text: string) => {
    if (!callId || !text.trim()) return;
    const startMs = Date.now() - callStart.current;
    setTurns((t) => [...t, { who: 'you', text }]);

    try {
      const res = await api.post<BrowserCallTurnOutput>('/calls/browser/turn', {
        callId,
        text,
        startMs,
        endMs: startMs + 1500,
        confidence: 0.95,
      });
      setTurns((t) => [...t, { who: 'ai', text: res.reply, latencyMs: res.latencyMs }]);
      speak(res.reply);

      if (res.escalated) {
        setEscalated(true);
        stopListening();
        toast.success('Transferred to a human agent — check the softphone', { duration: 6000 });
      }
      if (res.endCall) {
        stopListening();
        toast.info('The assistant closed the call');
      }
      void queryClient.invalidateQueries({ queryKey: ['liveops'] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const startListening = () => {
    const Ctor = getRecognition();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-GB';

    rec.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]!;
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }
      setInterim(interimText);
      if (finalText.trim()) {
        setInterim('');
        void sendTurn(finalText.trim());
      }
    };

    rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      toast.error(`Speech recognition: ${e.error ?? 'error'}`);
    };

    // Chrome stops recognition on silence; restart while the call is live.
    rec.onend = () => {
      if (recognition.current === rec) {
        try {
          rec.start();
        } catch {
          /* already restarting */
        }
      }
    };

    recognition.current = rec;
    rec.start();
    setListening(true);
  };

  const stopListening = () => {
    const rec = recognition.current;
    recognition.current = null;
    rec?.abort();
    setListening(false);
    setInterim('');
  };

  const startCall = useMutation({
    mutationFn: () =>
      api.post<{ callId: string; conversationId: string; greeting: string }>(
        '/calls/browser/start',
        { callerName: 'Demo caller' },
      ),
    onSuccess: (data) => {
      setCallId(data.callId);
      setTurns([{ who: 'ai', text: data.greeting }]);
      setEscalated(false);
      callStart.current = Date.now();
      speak(data.greeting);
      startListening();
      void queryClient.invalidateQueries({ queryKey: ['liveops'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const endCall = async () => {
    stopListening();
    window.speechSynthesis?.cancel();
    if (callId) {
      await api.post('/calls/browser/hangup', { callId }).catch(() => undefined);
    }
    setCallId(null);
    setEscalated(false);
    void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    void queryClient.invalidateQueries({ queryKey: ['liveops'] });
  };

  useEffect(() => () => stopListening(), []);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 sm:px-6">
      <header className="mb-4">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <PhoneCall className="size-5 text-primary" aria-hidden />
          Simulator
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Drive the platform without a phone carrier. Everything downstream — routing, escalation,
          transcripts, recordings, analytics, CRM sync — runs its real production path.
        </p>
      </header>

      <div className="mb-4">
        <MockNotice>
          No PSTN carrier is connected. UAE law reserves PSTN-terminating voice to TDRA-licensed
          operators, so real numbers must come from a licensed carrier — see NOT-IMPLEMENTED.md. The
          call logic itself is production code.
        </MockNotice>
      </div>

      {/* ElevenLabs first: it's the one to demo. The Web Speech card below is the
          zero-cost fallback for when there's no API key. */}
      <div className="mb-4">
        <ElevenLabsCall />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---------------------- live browser call ---------------------- */}
        <Card
          title="Talk to the AI — browser speech (free fallback)"
          subtitle="Web Speech API: no API key, no cost, but robotic and no barge-in"
          action={
            callId ? (
              <Button variant="danger" size="sm" onClick={() => void endCall()}>
                <PhoneOff className="size-3.5" aria-hidden /> End
              </Button>
            ) : (
              <Button
                variant="live"
                size="sm"
                loading={startCall.isPending}
                disabled={supported === false}
                onClick={() => startCall.mutate()}
              >
                <PhoneCall className="size-3.5" aria-hidden /> Start call
              </Button>
            )
          }
        >
          <div className="p-4">
            {supported === false && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                This browser doesn&apos;t support the Web Speech API. Use Chrome or Edge — the
                speech layer is browser-native, which is what makes it free.
              </div>
            )}

            {supported === null && <Spinner label="Checking browser support…" />}

            {supported && !callId && (
              <p className="text-sm text-muted-foreground">
                Press <strong>Start call</strong> and speak. Try “I want to ask about the ABA
                certification course”, then “how much does it cost?”, then “can I speak to
                someone?” — the last one hands you to a real agent on the softphone.
              </p>
            )}

            {callId && (
              <>
                <div className="mb-3 flex items-center gap-2">
                  <Badge className={listening ? 'bg-live-soft text-live' : 'bg-muted'}>
                    {listening ? (
                      <>
                        <Mic className="size-3" aria-hidden /> Listening
                      </>
                    ) : (
                      <>
                        <MicOff className="size-3" aria-hidden /> Paused
                      </>
                    )}
                  </Badge>
                  {escalated && (
                    <Badge className="bg-brand-soft text-primary">Transferred to an agent</Badge>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => (listening ? stopListening() : startListening())}
                  >
                    {listening ? 'Pause mic' : 'Resume mic'}
                  </Button>
                </div>

                <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg bg-muted p-3">
                  {turns.map((t, i) => (
                    <div
                      key={i}
                      className={cn(
                        'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                        t.who === 'you'
                          ? 'ml-auto bg-primary text-primary-foreground'
                          : 'bg-card text-foreground',
                      )}
                    >
                      {t.text}
                      {t.latencyMs !== undefined && (
                        <span className="mt-1 block text-[11px] opacity-60">
                          {t.latencyMs}ms
                        </span>
                      )}
                    </div>
                  ))}
                  {interim && (
                    <div className="ml-auto max-w-[85%] rounded-lg bg-primary/40 px-3 py-2 text-sm text-primary-foreground italic">
                      {interim}…
                    </div>
                  )}
                  <div ref={transcriptEnd} />
                </div>

                {/* Typing fallback: quieter than talking in a meeting room, and it
                    exercises exactly the same server path. */}
                <TypeFallback onSend={(t) => void sendTurn(t)} disabled={escalated} />
              </>
            )}
          </div>
        </Card>

        {/* ---------------------- scripted scenarios --------------------- */}
        <div className="space-y-4">
          <Card
            title="Scripted voice calls"
            subtitle="The caller's lines are scripted; the AI's answers are not"
          >
            <div className="space-y-3 p-4">
              <label className="block text-xs font-medium text-muted-foreground">
                Scenario
                <Select
                  className="mt-1"
                  value={scenarioId}
                  onChange={(e) => setScenarioId(e.target.value)}
                >
                  <option value="">Random</option>
                  {scenarios.data?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </Select>
              </label>

              {scenarioId && (
                <p className="rounded-lg bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                  {scenarios.data?.find((s) => s.id === scenarioId)?.description}
                </p>
              )}

              <label className="block text-xs font-medium text-muted-foreground">
                Pace
                <Select className="mt-1" value={speed} onChange={(e) => setSpeed(e.target.value)}>
                  <option value="1">Realistic (as a caller would speak)</option>
                  <option value="0.3">Fast (3× — good for a walkthrough)</option>
                  <option value="0.05">Instant (seed traffic)</option>
                  <option value="2">Slow (2× — narrate as it happens)</option>
                </Select>
              </label>

              <Button
                variant="default"
                className="w-full"
                loading={simulate.isPending}
                onClick={() =>
                  simulate.mutate({
                    scenarioId: scenarioId || undefined,
                    speed: Number(speed),
                  })
                }
              >
                <Play className="size-4" aria-hidden /> Place the call
              </Button>

              <div className="rounded-lg border border-border p-2.5">
                <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Available scenarios</p>
                <ul className="space-y-1">
                  {scenarios.data?.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 text-xs">
                      <button
                        onClick={() => setScenarioId(s.id)}
                        className="truncate text-left hover:underline"
                      >
                        {s.title}
                      </button>
                      <Badge
                        className={
                          s.escalates ? 'bg-brand-soft text-primary' : 'bg-ai-soft text-ai'
                        }
                      >
                        {s.escalates ? 'escalates' : 'AI only'}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          <Card
            title="WhatsApp"
            subtitle="Same brain, same escalation, same inbox — mocked transport"
          >
            <div className="space-y-2 p-4">
              <MockNotice>
                Their number <strong>+971 4 570 9603</strong> is on the WhatsApp Business app.
                Moving it to the Cloud API needs Meta verification and takes it out of the consumer
                app — days to weeks of Meta&apos;s process, not engineering.
              </MockNotice>
              <div className="flex flex-wrap gap-2">
                {waScenarios.data?.map((s) => (
                  <Button
                    key={s.id}
                    size="sm"
                    loading={simulateWa.isPending}
                    onClick={() => simulateWa.mutate(s.id)}
                  >
                    <MessageCircle className="size-3.5" aria-hidden /> {s.title}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** Text input so the AI path can be exercised without speaking aloud. */
function TypeFallback({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState('');
  return (
    <form
      className="mt-2 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSend(text.trim());
        setText('');
      }}
    >
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="…or type instead of speaking"
        disabled={disabled}
      />
      <Button type="submit" variant="secondary" disabled={disabled || !text.trim()}>
        <Sparkles className="size-4" aria-hidden />
      </Button>
    </form>
  );
}
