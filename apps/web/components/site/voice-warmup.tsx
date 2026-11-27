'use client';

import { useEffect, useRef, useState } from 'react';
import { DOGRAH_AGENT_NAME } from '@superdemo/contracts';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3101';

/**
 * How long the ring takes to reach 99%: a typical cold start. It holds at 99%
 * if the model needs longer — the call never starts before the model answers.
 */
const LOADER_MS = 25_000;
/**
 * Give up after this and offer "Try again" rather than start the call: a call
 * that starts on a cold model is answered by the fallback (Gemini/GPT), and
 * every call must be answered by the agent's own model.
 *
 * Three minutes because a cold start is mostly Modal queueing for a free GPU,
 * not the model loading: on 2026-11-27 gemma4-serve-eu waited 2 min 7 s for an
 * L40S/A100 and then restored from its snapshot in 5 s. Two minutes gave up
 * seconds before it arrived.
 */
const GIVE_UP_MS = 180_000;
/** Pause between warm-up attempts while the model is still coming up. */
const RETRY_MS = 2_000;
/** How long 100% stays on screen once the model has answered. */
const DONE_HOLD_MS = 350;

/**
 * Every button on a public page that starts a voice call, whatever the template:
 *
 * - Dograh's own floating pill, while it would *start* a call (`idle` or
 *   `failed`; `connected` would end one, and ending is never delayed);
 * - any template's own launcher that marks itself `data-stella-voice-start`
 *   (oscar's "Talk to us" and "Try again").
 */
const VOICE_START = [
  '#dograh-widget-cta.dograh-state-idle',
  '#dograh-widget-cta.dograh-state-failed',
  '[data-stella-voice-start]',
].join(',');

type Warmup = { ready: boolean; ms: number; skipped?: boolean };

/**
 * Wake the page's voice model: the API sends it a one-token completion.
 * Resolves `ready: false` instead of throwing, so a failed warm-up can never
 * stop a visitor from calling.
 */
function warmVoice(slug: string, fresh: boolean): Promise<Warmup> {
  const q = fresh ? '?fresh=1' : '';
  return fetch(`${API}/api/public/sites/${encodeURIComponent(slug)}/voice-warmup${q}`, { method: 'POST' })
    .then((r) => (r.ok ? (r.json() as Promise<Warmup>) : { ready: false, ms: 0 }))
    .catch(() => ({ ready: false, ms: 0 }));
}

/**
 * Hold every "Talk to Stella" press until the voice model has answered, with a
 * percentage loader, on any template.
 *
 * The model is woken when the page loads, so on a press it is usually already
 * warm and the loader runs only for the second or so the check takes. After a
 * quiet spell the model may be asleep on Modal, and the loader covers the
 * wake-up instead of the visitor's first turns landing on the fallback model.
 *
 * Template-agnostic by design: the press is caught on the way down (capture
 * phase, before the button's own handler), and once the model answers the same
 * button is clicked again with the gate open. So whatever that button does —
 * Dograh's `startCall`, oscar's `pickMode('voice')` — it does unchanged, and a
 * new template only has to put `data-stella-voice-start` on its button.
 */
export function VoiceWarmupGate({ slug }: { slug: string }) {
  const [since, setSince] = useState<number | null>(null);
  const [phase, setPhase] = useState<'loading' | 'done' | 'unavailable'>('loading');
  const passThrough = useRef(false);
  const loading = useRef(false);
  /** The button that was pressed, so "Try again" and the final start reuse it. */
  const pressed = useRef<HTMLElement | null>(null);
  /** Bumped on close, so a wait still running from a dismissed loader stops. */
  const attempt = useRef(0);

  const close = () => {
    attempt.current++;
    loading.current = false;
    setSince(null);
    setPhase('loading');
  };

  /** Wait until the model answers; start the call only then. */
  const waitAndStart = async () => {
    const mine = ++attempt.current;
    const started = Date.now();
    loading.current = true;
    setPhase('loading');
    setSince(started);

    while (Date.now() - started < GIVE_UP_MS) {
      const w = await warmVoice(slug, true);
      if (mine !== attempt.current) return; // dismissed meanwhile
      if (w.ready) {
        setPhase('done');
        setTimeout(() => {
          if (mine !== attempt.current) return;
          close();
          const button = pressed.current;
          passThrough.current = true;
          try {
            if (button?.isConnected) button.click();
          } finally {
            passThrough.current = false;
          }
        }, DONE_HOLD_MS);
        return;
      }
      await new Promise((r) => setTimeout(r, RETRY_MS));
      if (mine !== attempt.current) return;
    }
    // Never start the call on the fallback model: say so, and let them retry.
    setPhase('unavailable');
  };

  useEffect(() => {
    void warmVoice(slug, false);

    const onPress = (e: MouseEvent) => {
      if (passThrough.current) return;
      const button = (e.target as Element | null)?.closest?.(VOICE_START) as HTMLElement | null;
      if (!button) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (loading.current) return; // a second press while loading changes nothing
      pressed.current = button;
      void waitAndStart();
    };
    document.addEventListener('click', onPress, true);
    return () => document.removeEventListener('click', onPress, true);
    // waitAndStart only reads refs and the slug, which is this effect's dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (since === null) return null;
  return (
    <VoiceLoader
      since={since}
      phase={phase}
      onRetry={() => void waitAndStart()}
      onClose={close}
    />
  );
}

/** 0–99 as time passes (holding at 99 past LOADER_MS), 100 once the model has answered. */
function usePercent(since: number, phase: 'loading' | 'done' | 'unavailable'): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (phase !== 'loading') return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [phase, since]);
  if (phase === 'done') return 100;
  return Math.min(99, Math.floor(((now - since) / LOADER_MS) * 100));
}

/** Circumference of the ring below (r = 26). */
const RING = 2 * Math.PI * 26;

function VoiceLoader({
  since,
  phase,
  onRetry,
  onClose,
}: {
  since: number;
  phase: 'loading' | 'done' | 'unavailable';
  onRetry: () => void;
  onClose: () => void;
}) {
  const percent = usePercent(since, phase);
  const slow = phase === 'loading' && percent >= 99;
  const unavailable = phase === 'unavailable';
  return (
    <>
      {/*
        A centred card over a dimmed page: the press has to visibly answer, and
        a corner toast is easy to miss while the visitor is looking at the
        button. Colours come from the page's own accent (--widget-accent, else
        the tenant's --primary), so every centre's loader is on-brand.
      */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
#stella-voice-loading{position:fixed;inset:0;z-index:2147483001;display:grid;place-items:center;
  background:color-mix(in oklab,#000 35%,transparent);backdrop-filter:blur(2px);
  font-family:var(--widget-font,inherit);}
#stella-voice-loading .card{display:flex;flex-direction:column;align-items:center;gap:1rem;
  padding:1.75rem 2rem;border-radius:var(--widget-radius,1.25rem);min-width:15rem;
  max-width:calc(100vw - 2rem);background:var(--card,#fff);color:var(--card-foreground,#111);
  text-align:center;box-shadow:0 1.5rem 3rem -0.75rem rgba(0,0,0,.4);}
#stella-voice-loading .ring{position:relative;width:5rem;height:5rem;outline:none;border:0;}
#stella-voice-loading svg{width:100%;height:100%;transform:rotate(-90deg);}
#stella-voice-loading .track{stroke:color-mix(in oklab,var(--widget-accent,var(--primary,#2563eb)) 18%,transparent);}
#stella-voice-loading .fill{stroke:var(--widget-accent,var(--primary,#2563eb));
  stroke-dasharray:${RING.toFixed(2)};transition:stroke-dashoffset .1s linear;}
#stella-voice-loading .pct{position:absolute;inset:0;display:grid;place-items:center;
  font-size:1.125rem;font-weight:600;font-variant-numeric:tabular-nums;}
#stella-voice-loading .title{font-size:1rem;font-weight:600;}
#stella-voice-loading .sub{font-size:.8125rem;opacity:.7;margin-top:.25rem;}
#stella-voice-loading .actions{display:flex;gap:.5rem;justify-content:center;}
#stella-voice-loading button{font:inherit;font-size:.875rem;font-weight:600;cursor:pointer;
  padding:.5rem 1rem;border-radius:var(--widget-radius,999px);border:1px solid transparent;}
#stella-voice-loading .primary{background:var(--widget-accent,var(--primary,#2563eb));
  color:var(--widget-on-accent,var(--primary-foreground,#fff));}
#stella-voice-loading .ghost{background:transparent;color:inherit;
  border-color:color-mix(in oklab,currentColor 25%,transparent);}
@media (prefers-reduced-motion:reduce){#stella-voice-loading .fill{transition:none;}}
`,
        }}
      />
      <div id="stella-voice-loading" role="status" aria-live="polite">
        <div className="card">
          <div
            className="ring"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-label={`Loading ${DOGRAH_AGENT_NAME}`}
          >
            <svg viewBox="0 0 60 60" aria-hidden>
              <circle className="track" cx="30" cy="30" r="26" fill="none" strokeWidth="4" />
              <circle
                className="fill"
                cx="30"
                cy="30"
                r="26"
                fill="none"
                strokeWidth="4"
                strokeLinecap="round"
                style={{ strokeDashoffset: RING * (1 - percent / 100) }}
              />
            </svg>
            <span className="pct">{percent}%</span>
          </div>
          <div>
            <div className="title">
              {unavailable ? `${DOGRAH_AGENT_NAME} isn’t available right now` : `Loading ${DOGRAH_AGENT_NAME}…`}
            </div>
            <div className="sub">
              {unavailable
                ? 'Please try again in a minute.'
                : slow
                  ? 'Still waking up — this can take a minute or two.'
                  : 'Your call starts in a moment.'}
            </div>
          </div>
          {unavailable ? (
            <div className="actions">
              <button type="button" className="primary" onClick={onRetry}>
                Try again
              </button>
              <button type="button" className="ghost" onClick={onClose}>
                Close
              </button>
            </div>
          ) : (
            <div className="actions">
              <button type="button" className="ghost" onClick={onClose}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
