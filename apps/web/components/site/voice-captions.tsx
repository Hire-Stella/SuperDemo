'use client';

import { useEffect, useRef, useState } from 'react';
import { DOGRAH_AGENT_NAME } from '@superdemo/contracts';

/**
 * Live captions for a voice call: one speaker at a time, the latest line only.
 *
 * ## Where the words come from
 *
 * Dograh's widget does not hand voice transcripts to the page — its
 * `onMessage` is chat-only. But the call's signalling WebSocket carries the
 * pipeline's realtime events (`rtf-user-transcription`, `rtf-bot-text`, …) for
 * the whole call, and the widget keeps that socket at `getState().ws`. We add
 * our own `message` listener beside the widget's `onmessage`, so nothing of
 * theirs is replaced and a widget that stops exposing it just means no
 * captions, never a broken call.
 *
 * Template-agnostic: oscar's launcher drives the same Dograh script, so the
 * same socket exists whichever template started the call.
 *
 * ## One speaker at a time
 *
 * The caller's line is replaced by each interim transcription until it is
 * final. Stella's line streams in word by word and is appended. Whenever the
 * other person starts, the bar switches to them and starts a fresh line.
 */

type Speaker = 'caller' | 'agent';
type Line = { speaker: Speaker; text: string };

type SignalMessage = { type?: string; payload?: { text?: unknown; final?: unknown } };

/** Dograh's bundle sets this; the full type is declared in @stella/template-oscar. */
function dograhSocket(): WebSocket | null {
  const api = (window as { DograhWidget?: { getState?: () => { ws?: unknown } } }).DograhWidget;
  const ws = api?.getState?.()?.ws;
  return ws && typeof (ws as WebSocket).addEventListener === 'function' ? (ws as WebSocket) : null;
}

/** How long the last line stays after the call goes quiet or ends. */
const LINGER_MS = 4_000;

export function VoiceCaptions() {
  const [line, setLine] = useState<Line | null>(null);
  const [live, setLive] = useState(false);
  /** Stella finished a turn: her next words start a new line rather than append. */
  const agentDone = useRef(true);
  /** The line on screen, readable from the socket handler without a stale closure. */
  const current = useRef<Line | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let attached: WebSocket | null = null;

    const show = (next: Line) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = null;
      current.current = next;
      setLive(true);
      setLine(next);
    };
    const fadeOut = () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => {
        current.current = null;
        setLive(false);
        setLine(null);
      }, LINGER_MS);
    };

    const onMessage = (ev: MessageEvent) => {
      let m: SignalMessage;
      try {
        m = JSON.parse(typeof ev.data === 'string' ? ev.data : '') as SignalMessage;
      } catch {
        return;
      }
      const text = typeof m.payload?.text === 'string' ? m.payload.text.trim() : '';
      switch (m.type) {
        case 'rtf-user-transcription':
          if (!text) return;
          agentDone.current = true; // whatever Stella says next is a reply
          show({ speaker: 'caller', text });
          return;
        case 'rtf-bot-text': {
          if (!text) return;
          const prev = current.current;
          const fresh = agentDone.current || !prev || prev.speaker !== 'agent';
          agentDone.current = false;
          // Some pipelines send the sentence so far rather than the next word.
          const next = fresh || text.startsWith(prev.text) ? text : `${prev.text} ${text}`;
          show({ speaker: 'agent', text: next });
          return;
        }
        case 'rtf-bot-stopped-speaking':
          agentDone.current = true;
          return;
        case 'call-ended':
          fadeOut();
          return;
      }
    };

    // The socket only exists while a call is being set up or is live, and a
    // new call makes a new one, so keep looking for it.
    const poll = setInterval(() => {
      const ws = dograhSocket();
      if (ws === attached) return;
      attached?.removeEventListener('message', onMessage);
      attached = ws;
      if (ws) {
        agentDone.current = true;
        ws.addEventListener('message', onMessage);
        ws.addEventListener('close', fadeOut, { once: true });
      } else {
        fadeOut();
      }
    }, 300);

    return () => {
      clearInterval(poll);
      attached?.removeEventListener('message', onMessage);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  if (!live || !line) return null;
  const who = line.speaker === 'agent' ? DOGRAH_AGENT_NAME : 'You';

  return (
    <>
      {/*
        Bottom centre, clear of both corners: the call pill and the chat bubble
        sit bottom-right, the call-me-back panel bottom-left. Colours follow the
        page's accent so it belongs to each centre's design.
      */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
#stella-captions{position:fixed;left:50%;bottom:1.25rem;transform:translateX(-50%);z-index:2147482999;
  width:max-content;max-width:min(30rem,calc(100vw - 2rem));
  display:flex;align-items:flex-start;gap:.625rem;padding:.625rem .875rem;
  border-radius:var(--widget-radius,1rem);background:var(--card,#fff);color:var(--card-foreground,#111);
  font-family:var(--widget-font,inherit);font-size:.875rem;line-height:1.4;
  box-shadow:0 .75rem 2rem -0.5rem rgba(0,0,0,.35);}
#stella-captions .who{flex:none;font-size:.6875rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
  padding:.125rem .5rem;border-radius:999px;margin-top:.0625rem;
  background:color-mix(in oklab,var(--widget-accent,var(--primary,#2563eb)) 14%,transparent);
  color:var(--widget-accent,var(--primary,#2563eb));}
#stella-captions[data-speaker="caller"] .who{background:color-mix(in oklab,currentColor 10%,transparent);color:inherit;}
#stella-captions .text{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
@media (max-width:640px){#stella-captions{bottom:5.25rem;}}
`,
        }}
      />
      <div id="stella-captions" data-speaker={line.speaker} role="log" aria-live="polite" aria-label="Live captions">
        <span className="who">{who}</span>
        <span className="text">{line.text}</span>
      </div>
    </>
  );
}
