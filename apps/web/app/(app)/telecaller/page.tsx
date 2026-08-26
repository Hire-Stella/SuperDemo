'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Ban,
  Delete,
  Grid3x3,
  History,
  PhoneCall,
  PhoneOff,
  Search,
  SkipForward,
  Sparkles,
} from 'lucide-react';
import {
  composeE164,
  countryByCode,
  countryForE164,
  DIALLING_COUNTRIES,
  dispositionLabel,
  isPlausibleNumber,
  type CallableContact,
  type ConversationDetail,
  type Disposition,
  type ManualCallResult,
  type PhoneNumberDto,
} from '@fit-ai/contracts';
import { api, qs } from '@/lib/api';
import { dateTime } from '@/lib/format';
import { useUser } from '@/components/providers';
import { Avatar, Badge, Button, Input, Select, cn } from '@/components/composites';

/**
 * The telecaller's console.
 *
 * Operated, not read — so the craft here is information design rather than
 * typography. Three decisions carry it:
 *
 *  * **One primary action.** The big button is Call, then Hang up, then Log &
 *    next. A telecaller works through a list at speed and should never have to
 *    hunt for which control applies to the state they are in.
 *  * **Dispositions are chips, not a dropdown.** Logging an outcome is the thing
 *    they do most often, and a select costs a click plus a read of every option.
 *  * **State is a shape, not a word.** The ring pulses amber while ringing, goes
 *    solid in the brand colour once connected, and dims when the call ends — so
 *    the state is legible from across a room without reading anything.
 *
 * Colour comes entirely from the tenant's theme tokens: `--primary` is whichever
 * brand this centre chose, and the state colours stay semantic and separate, so
 * the console looks native in every centre rather than only in the default one.
 */

/** Ordered by how often a telecaller actually picks them. */
const QUICK_DISPOSITIONS: Disposition[] = [
  'INFO_PROVIDED',
  'CALLBACK_REQUESTED',
  'ENROLMENT_INTEREST',
  'FEE_ENQUIRY',
  'NOT_INTERESTED',
  'WRONG_NUMBER',
];

const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

export default function TelecallerPage() {
  const user = useUser();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [manualNumber, setManualNumber] = useState('');
  const [note, setNote] = useState('');
  const [live, setLive] = useState<ManualCallResult | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [disposition, setDisposition] = useState<Disposition | null>(null);
  const [wrapNotes, setWrapNotes] = useState('');
  const [session, setSession] = useState({ placed: 0, connected: 0, talkMs: 0 });
  const [worked, setWorked] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);

  const worklist = useQuery({
    queryKey: ['worklist', search],
    queryFn: () => api.get<CallableContact[]>(`/campaigns/worklist${qs({ search, limit: 60 })}`),
  });

  /**
   * The centre's own numbers, used only to pick a sensible default country.
   * Guessing from the browser locale would be wrong for a Dubai centre staffed
   * from Kochi; the number they call *from* is the honest signal.
   */
  const numbers = useQuery({
    queryKey: ['numbers'],
    queryFn: () => api.get<PhoneNumberDto[]>('/numbers'),
  });

  const callState = useQuery({
    queryKey: ['manual-call', live?.conversationId],
    queryFn: () => api.get<ConversationDetail>(`/conversations/${live!.conversationId}`),
    enabled: Boolean(live),
    refetchInterval: 1500,
  });

  const rows = worklist.data ?? [];
  const selected = rows.find((c) => c.id === selectedId) ?? null;

  const country = countryByCode(countryCode ?? numbers.data?.[0]?.country);
  const composed = composeE164(country, manualNumber);
  const numberOk = Boolean(composed) && isPlausibleNumber(country, composed);
  /** Shown beside a selected contact — useful the moment a call leaves the UAE. */
  const selectedCountry = selected?.phoneE164 ? countryForE164(selected.phoneE164) : null;
  const state = callState.data?.call?.state ?? null;
  const connected = state === 'AGENT_TALKING';
  const finished = state === 'COMPLETED' || state === 'WRAPUP';

  /* ------------------------------- the timer ------------------------------- */
  // Ticks only while a call is up. Tabular numerals keep the digits from
  // shifting under each other as the seconds roll.
  useEffect(() => {
    if (!startedAt || finished) return;
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 500);
    return () => clearInterval(id);
  }, [startedAt, finished]);

  useEffect(() => {
    if (connected && session.connected === 0 && startedAt) {
      setSession((s) => ({ ...s, connected: s.connected + 1 }));
    }
  }, [connected, session.connected, startedAt]);

  /* -------------------------------- actions ------------------------------- */
  const dial = useMutation({
    mutationFn: (body: { contactId?: string; phoneE164?: string; note?: string }) =>
      api.post<ManualCallResult>('/calls/manual', body),
    onSuccess: (res) => {
      setLive(res);
      setStartedAt(Date.now());
      setElapsed(0);
      setDisposition(null);
      setWrapNotes('');
      setSession((s) => ({ ...s, placed: s.placed + 1 }));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const hangup = useMutation({
    mutationFn: () => api.post('/calls/hangup', { callId: live!.callId }),
    onError: (e: Error) => toast.error(e.message),
  });

  const nextContact = useCallback(() => {
    const idx = rows.findIndex((c) => c.id === selectedId);
    const rest = rows.slice(idx + 1).find((c) => !c.doNotCall && !worked.has(c.id));
    const fallback = rows.find((c) => !c.doNotCall && !worked.has(c.id));
    setSelectedId((rest ?? fallback)?.id ?? null);
  }, [rows, selectedId, worked]);

  const wrapup = useMutation({
    mutationFn: () =>
      api.post('/calls/wrapup', {
        callId: live!.callId,
        disposition: disposition ?? 'INFO_PROVIDED',
        notes: wrapNotes || undefined,
      }),
    onSuccess: () => {
      if (selectedId) setWorked((w) => new Set(w).add(selectedId));
      setSession((s) => ({ ...s, talkMs: s.talkMs + elapsed }));
      setLive(null);
      setStartedAt(null);
      setNote('');
      void queryClient.invalidateQueries({ queryKey: ['worklist'] });
      nextContact();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markDnc = useMutation({
    mutationFn: (contactId: string) => api.post(`/campaigns/contacts/${contactId}/do-not-call`, {}),
    onSuccess: () => {
      toast.success('Recorded — they will not be dialled again, by anyone');
      void queryClient.invalidateQueries({ queryKey: ['worklist'] });
      nextContact();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canDial = selected ? !selected.doNotCall : numberOk;

  const placeCall = useCallback(() => {
    if (live || !canDial) return;
    dial.mutate(
      selected
        ? { contactId: selected.id, note: note || undefined }
        : { phoneE164: composed, note: note || undefined },
    );
  }, [live, canDial, dial, selected, note, composed]);

  /* ---------------------------- keyboard control --------------------------- */
  // A telecaller works with one hand on the keyboard; these are the four
  // actions worth binding, and they are advertised in the UI as kbd hints
  // rather than hidden.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing =
        e.target instanceof HTMLElement &&
        (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');

      if (e.key === 'Enter' && !typing) {
        if (finished) wrapup.mutate();
        else if (!live) placeCall();
        e.preventDefault();
      }
      if (e.key === 'Escape' && live && !finished) {
        hangup.mutate();
        e.preventDefault();
      }
      if (!typing && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        const idx = rows.findIndex((c) => c.id === selectedId);
        const next = e.key === 'ArrowDown' ? idx + 1 : idx - 1;
        if (rows[next]) setSelectedId(rows[next]!.id);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finished, live, placeCall, wrapup, hangup, rows, selectedId]);

  const progress = useMemo(
    () => ({ done: worked.size, total: rows.filter((c) => !c.doNotCall).length }),
    [worked.size, rows],
  );

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6">
      {/* ── session strip: what a telecaller checks constantly ───────────── */}
      <header className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <PhoneCall className="size-5 text-primary" aria-hidden /> Dialler
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            You speak to the customer — no assistant on the line. For a list that dials itself, use{' '}
            <Link href="/campaigns" className="text-primary underline-offset-2 hover:underline">
              campaigns
            </Link>
            .
          </p>
        </div>

        <dl className="flex items-center gap-6 rounded-xl border border-border bg-card px-4 py-2.5">
          {[
            ['Placed', String(session.placed)],
            ['Connected', String(session.connected)],
            ['Talk time', formatDuration(session.talkMs)],
            ['Worked', `${progress.done}/${progress.total}`],
          ].map(([label, value]) => (
            <div key={label} className="text-center">
              <dd className="tnum text-lg font-semibold leading-none">{value}</dd>
              <dt className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                {label}
              </dt>
            </div>
          ))}
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
            this session
          </span>
        </dl>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* ── the queue ─────────────────────────────────────────────────── */}
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Call queue</h2>
              <p className="text-[11px] text-muted-foreground">
                People this centre has spoken to, most recent first
              </p>
            </div>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                className="h-8 w-56 pl-8 text-xs"
                placeholder="Search name or number…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div ref={listRef} className="max-h-[620px] divide-y divide-border overflow-y-auto">
            {worklist.isPending ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Nobody matches. This queue is built from people who have contacted this centre.
              </p>
            ) : (
              rows.map((c) => {
                const isSelected = c.id === selectedId;
                const isWorked = worked.has(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    disabled={Boolean(live)}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2.5 text-left transition',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
                      isSelected ? 'bg-brand-soft' : 'hover:bg-muted/60',
                      live && 'cursor-not-allowed opacity-60',
                    )}
                  >
                    {/* A left rail carries selection and done-ness without a checkbox column. */}
                    <span
                      aria-hidden
                      className={cn(
                        'h-9 w-0.5 shrink-0 rounded-full',
                        isSelected ? 'bg-primary' : isWorked ? 'bg-live' : 'bg-transparent',
                      )}
                    />
                    <Avatar name={c.name} size={32} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium">{c.name ?? 'Unknown'}</span>
                        {c.doNotCall && (
                          <Badge className="text-[10px] text-destructive">
                            <Ban className="size-3" aria-hidden /> do not call
                          </Badge>
                        )}
                        {isWorked && (
                          <Badge dot="bg-live" className="text-[10px]">
                            done
                          </Badge>
                        )}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                        <span className="tnum">{c.phoneE164}</span>
                        {c.interest && <span className="truncate">· {c.interest}</span>}
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-[11px] text-muted-foreground">
                      {c.lastContactedAt ? (
                        <>
                          <span className="block">{dateTime(c.lastContactedAt)}</span>
                          {c.lastOutcome && (
                            <span className="block truncate">
                              {isDisposition(c.lastOutcome)
                                ? dispositionLabel(user.orgIndustry, c.lastOutcome)
                                : c.lastOutcome}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="italic">never called</span>
                      )}
                    </span>
                    {/* A bare number here read as noise; the icon says what it counts. */}
                    <span
                      className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground"
                      title={`${c.totalConversations} previous conversation${c.totalConversations === 1 ? '' : 's'}`}
                    >
                      <History className="size-3" aria-hidden />
                      <span className="tnum">{c.totalConversations}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* ── the console ───────────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {/* identity + state ring */}
            <div className="flex flex-col items-center gap-3 border-b border-border px-5 py-6">
              <div className="relative">
                {/* The ring is the state. Amber pulse while ringing, brand solid
                    when connected, dim when done — readable without reading. */}
                {live && !connected && !finished && (
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-full border-2 border-warn motion-safe:animate-ping"
                  />
                )}
                <span
                  aria-hidden
                  className={cn(
                    'absolute -inset-1.5 rounded-full border-2 transition-colors',
                    connected
                      ? 'border-primary'
                      : live && !finished
                        ? 'border-warn'
                        : finished
                          ? 'border-muted-foreground/30'
                          : 'border-transparent',
                  )}
                />
                <Avatar
                  name={live ? (live.contactName ?? live.phoneE164) : (selected?.name ?? '·')}
                  size={72}
                />
              </div>

              <div className="text-center">
                <p className="text-base font-semibold text-balance">
                  {live
                    ? (live.contactName ?? 'Unknown')
                    : (selected?.name ?? (manualNumber ? 'New number' : 'Nobody selected'))}
                </p>
                <p className="mt-0.5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <span className="tnum">
                    {live ? live.phoneE164 : (selected?.phoneE164 ?? (composed || '—'))}
                  </span>
                  {!live && selectedCountry && (
                    <span title={selectedCountry.name}>
                      {selectedCountry.flag} {selectedCountry.code}
                    </span>
                  )}
                </p>
              </div>

              {/* status + timer */}
              {live ? (
                <div className="flex flex-col items-center gap-1">
                  <Badge
                    dot={connected ? 'bg-primary' : finished ? 'bg-muted-foreground' : 'bg-warn'}
                    className="text-[11px]"
                  >
                    {connected
                      ? 'Connected'
                      : finished
                        ? 'Call ended'
                        : state === 'RINGING'
                          ? 'Ringing…'
                          : 'Placing…'}
                  </Badge>
                  <p className="tnum text-3xl font-semibold tabular-nums">
                    {formatDuration(elapsed)}
                  </p>
                </div>
              ) : selected?.interest ? (
                <p className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                  Interested in {selected.interest}
                </p>
              ) : null}
            </div>

            {/* the one primary action, whatever the state calls for */}
            <div className="space-y-3 px-5 py-4">
              {!live && (
                <>
                  <label className="block space-y-1">
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Why you are calling
                    </span>
                    <Input
                      className="h-9 text-sm"
                      placeholder="Following up on their weekly order"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </label>

                  <Button
                    className="h-11 w-full text-sm"
                    disabled={!canDial || dial.isPending}
                    onClick={placeCall}
                  >
                    <PhoneCall className="size-4" aria-hidden />
                    {dial.isPending ? 'Dialling…' : 'Call'}
                    <kbd className="ml-1 rounded border border-primary-foreground/30 px-1 text-[10px] opacity-80">
                      ⏎
                    </kbd>
                  </Button>

                  {selected?.doNotCall && (
                    <p className="text-[11px] text-destructive">
                      This person asked not to be called. The API refuses it, not just this screen.
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setKeypadOpen((v) => !v)}
                      className="flex items-center gap-1.5 text-[11px] text-muted-foreground transition hover:text-foreground"
                    >
                      <Grid3x3 className="size-3.5" aria-hidden />
                      {keypadOpen ? 'Hide keypad' : 'Dial a number'}
                    </button>
                    {selected && !selected.doNotCall && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Record that ${selected.name ?? selected.phoneE164} does not want to be called? They are removed from every campaign list too.`,
                            )
                          )
                            markDnc.mutate(selected.id);
                        }}
                        className="flex items-center gap-1.5 text-[11px] text-muted-foreground transition hover:text-destructive"
                      >
                        <Ban className="size-3.5" aria-hidden /> Do not call
                      </button>
                    )}
                  </div>

                  {keypadOpen && (
                    <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
                      {/* Country first, then the number as it would be written
                          locally — nobody types +971 50… by choice, and asking
                          them to is how trunk zeros end up in E.164. */}
                      <div className="flex gap-2">
                        <Select
                          aria-label="Country"
                          className="h-9 w-[9.5rem] text-xs"
                          value={country.code}
                          onChange={(e) => {
                            setCountryCode(e.target.value);
                            setSelectedId(null);
                          }}
                        >
                          {DIALLING_COUNTRIES.map((c) => (
                            <option key={`${c.code}-${c.dial}`} value={c.code}>
                              {c.flag} {c.code} +{c.dial}
                            </option>
                          ))}
                        </Select>
                        <Input
                          className="tnum h-9 flex-1 text-sm"
                          placeholder={country.example}
                          value={manualNumber}
                          onChange={(e) => {
                            setManualNumber(e.target.value);
                            setSelectedId(null);
                          }}
                        />
                      </div>

                      {/* What will actually be dialled, so a trunk zero or a
                          missing digit is visible before the call goes out. */}
                      <p
                        className={cn(
                          'tnum text-center text-xs',
                          manualNumber && !numberOk ? 'text-warn' : 'text-muted-foreground',
                        )}
                      >
                        {composed
                          ? numberOk
                            ? `Dialling ${composed}`
                            : `${composed} — expected ${country.nationalDigits[0]}${
                                country.nationalDigits[1] !== country.nationalDigits[0]
                                  ? `–${country.nationalDigits[1]}`
                                  : ''
                              } digits for ${country.name}`
                          : `${country.name} · +${country.dial}`}
                      </p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {KEYPAD.map((k) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => {
                              // Appends to the national part; the country code
                              // comes from the selector, never the keypad.
                              setManualNumber((n) => n + k);
                              setSelectedId(null);
                            }}
                            className="tnum rounded-md border border-border bg-card py-2 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                          >
                            {k}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setManualNumber((n) => n.slice(0, -1))}
                        className="flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] text-muted-foreground transition hover:bg-muted"
                      >
                        <Delete className="size-3.5" aria-hidden /> Backspace
                      </button>
                    </div>
                  )}
                </>
              )}

              {live && !finished && (
                <Button
                  className="h-11 w-full bg-destructive text-sm text-white hover:bg-destructive/90"
                  disabled={hangup.isPending}
                  onClick={() => hangup.mutate()}
                >
                  <PhoneOff className="size-4" aria-hidden /> Hang up
                  <kbd className="ml-1 rounded border border-white/30 px-1 text-[10px] opacity-80">
                    esc
                  </kbd>
                </Button>
              )}

              {live && finished && (
                <div className="space-y-3">
                  <div>
                    <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                      How did it go?
                    </p>
                    {/* Chips, not a select: this is the most repeated action on
                        the page, and a dropdown costs a click and a read. */}
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_DISPOSITIONS.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDisposition(d)}
                          className={cn(
                            'rounded-full border px-2.5 py-1 text-[11px] transition',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
                            disposition === d
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-card text-muted-foreground hover:bg-muted',
                          )}
                        >
                          {dispositionLabel(user.orgIndustry, d)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Input
                    className="h-9 text-sm"
                    placeholder="Notes — wants a callback Saturday"
                    value={wrapNotes}
                    onChange={(e) => setWrapNotes(e.target.value)}
                  />

                  <div className="flex gap-2">
                    <Button
                      className="h-10 flex-1 text-sm"
                      disabled={!disposition || wrapup.isPending}
                      onClick={() => wrapup.mutate()}
                    >
                      {wrapup.isPending ? 'Saving…' : 'Log & next'}
                      <kbd className="ml-1 rounded border border-primary-foreground/30 px-1 text-[10px] opacity-80">
                        ⏎
                      </kbd>
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-10"
                      onClick={() => {
                        setLive(null);
                        setStartedAt(null);
                        nextContact();
                      }}
                    >
                      <SkipForward className="size-4" aria-hidden />
                    </Button>
                  </div>
                  {!disposition && (
                    <p className="text-[11px] text-muted-foreground">
                      Pick an outcome to save it — that is what makes the queue useful next time.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* footer: shortcuts, so the speed is discoverable */}
            <div className="flex items-center gap-3 border-t border-border px-5 py-2.5 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> move
              </span>
              <span className="flex items-center gap-1">
                <Kbd>⏎</Kbd> call / log
              </span>
              <span className="flex items-center gap-1">
                <Kbd>esc</Kbd> hang up
              </span>
            </div>
          </div>

          {live && (
            <Link
              href={`/conversations/${live.conversationId}`}
              className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-primary underline-offset-2 hover:underline"
            >
              <History className="size-3" aria-hidden /> Open this conversation
            </Link>
          )}

          {!live && !selected && (
            <p className="mt-3 flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-[11px] text-muted-foreground">
              <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
              Pick someone from the queue, or dial a number. Their history and last outcome load
              here so the call starts informed.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-sans text-[10px]">
      {children}
    </kbd>
  );
}

/** m:ss, or h:mm:ss once a call runs long. */
function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

const DISPOSITION_KEYS = new Set<string>([
  'ENROLMENT_INTEREST',
  'INFO_PROVIDED',
  'CALLBACK_REQUESTED',
  'FEE_ENQUIRY',
  'EXISTING_STUDENT_SUPPORT',
  'NOT_INTERESTED',
  'WRONG_NUMBER',
  'SPAM',
]);

/** The worklist's lastOutcome is either a disposition or a plain phrase. */
function isDisposition(value: string): value is Disposition {
  return DISPOSITION_KEYS.has(value);
}
