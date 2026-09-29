'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * The centre's own "Talk to Stella" widget — ported verbatim from
 * github.com/Hire-Stella/oscar-education's `components/TalkToStellaWidget.tsx`,
 * not the platform's generic `DograhWidget`.
 *
 * Why this exists instead of reusing the generic one: that component renders
 * *two* separately-styled bubbles — Dograh's own default-themed floating
 * voice pill (its look comes from Dograh's side, not ours) stacked with our
 * custom-themed chat button — because it has to work for every tenant with
 * whatever generic skin fits any palette. This site had its own single,
 * unified dark-green launcher that switches between voice and chat inside
 * one panel, built by calling `window.DograhWidget`'s start/startChat
 * directly instead of letting Dograh's script render its own floating pill.
 * That is real, hand-built product work, not something a generic component
 * can reproduce — so it is kept, not replaced.
 *
 * The one real change from the source: `API_BASE_URL`/`VOICE_TOKEN`/
 * `CHAT_TOKEN` were module-level constants there (that repo serves exactly
 * one tenant, so hardcoding its own production credentials into its own
 * frontend is fine). This platform serves many tenants from one build, so
 * those three become props, resolved per-request from *this* centre's own
 * Dograh connection (`site.dograh`) — see `apps/web/app/(site)/[slug]/page.tsx`.
 * Every other line of behaviour, styling and copy below is unchanged.
 */

const INK = 'rgb(20, 38, 29)';
const FOREST = 'rgb(27, 52, 40)';
const CREAM = 'rgb(244, 240, 229)';
const ORANGE = 'rgb(232, 114, 44)';

type Mode = 'voice' | 'chat';
type CallStatus = 'idle' | 'requesting-mic' | 'connecting' | 'connected' | 'ended' | 'error';
type ChatMessage = { role: 'user' | 'assistant'; text: string };

interface DograhWidgetApi {
  start: () => void;
  end: () => void;
  stop: () => void;
  startChat: () => void;
  endChat: () => void;
  sendMessage: (text: string) => void;
  getState: () => {
    connectionStatus?: string;
    audioElement?: HTMLAudioElement | null;
    config?: { widgetType?: string };
    chat: {
      status: string;
      turns: { user_message?: { text: string } | null; assistant_message?: { text: string } | null }[];
    };
  };
  onCallConnected: ((cb: () => void) => void) | null;
  onCallEnd: ((cb: () => void) => void) | null;
  onError: ((cb: (err: unknown) => void) => void) | null;
  onMessage: ((cb: (msg: unknown) => void) => void) | null;
  onStatusChange: ((cb: (status: string) => void) => void) | null;
  onReady: ((cb: () => void) => void) | null;
}

declare global {
  interface Window {
    DograhWidget?: DograhWidgetApi;
  }
}

let dograhLoadToken = 0;

function loadDograhScript(baseUrl: string, token: string): Promise<DograhWidgetApi> {
  const myLoad = ++dograhLoadToken;
  return new Promise((resolve, reject) => {
    document.querySelectorAll('script[data-dograh-embed="true"]').forEach((el) => el.remove());
    delete window.DograhWidget;

    const script = document.createElement('script');
    script.dataset.dograhEmbed = 'true';
    script.async = true;
    script.src = `${baseUrl}/embed/dograh-widget.js?token=${token}&environment=production&apiEndpoint=${baseUrl}`;
    script.setAttribute(
      'data-dograh-context',
      JSON.stringify({ page_url: window.location.href, today: new Date().toISOString().slice(0, 10) }),
    );
    document.body.appendChild(script);

    const start = Date.now();
    const poll = setInterval(() => {
      if (myLoad !== dograhLoadToken) {
        clearInterval(poll);
        reject(new Error('Superseded by a newer request'));
        return;
      }
      if (window.DograhWidget) {
        clearInterval(poll);
        resolve(window.DograhWidget);
      } else if (Date.now() - start > 15000) {
        clearInterval(poll);
        reject(new Error('Widget failed to load'));
      }
    }, 150);
  });
}

function MicIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

function ChatIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function CloseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronLeftIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function SendIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </svg>
  );
}

function PhoneOffIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 4.03.64 2 2 0 0 1 2 2V20a2 2 0 0 1-2 2 19 19 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19 19 0 0 1 4 4a2 2 0 0 1 2-2h3.5a2 2 0 0 1 2 2 12.84 12.84 0 0 0 .64 4.03 2 2 0 0 1-.45 2.11z" />
      <line x1="23" y1="1" x2="1" y2="23" />
    </svg>
  );
}

export function TalkToStellaWidget({
  baseUrl,
  voiceToken,
  chatToken,
  chatContainerId,
}: {
  baseUrl: string;
  voiceToken: string;
  chatToken: string;
  /**
   * This platform's own connection flow always mints a chat token in
   * `embedMode: 'inline'`, pointing at this id (see
   * `apps/web/components/site/dograh-widget.tsx`, the generic widget this one
   * replaces) — the bundle logs "Container element … not found" and never
   * leaves "connecting" without it, even though this widget draws its own
   * panel from `getState().chat.turns` and never looks at whatever Dograh
   * would have rendered in there. So the div still has to exist, just hidden.
   */
  chatContainerId: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<Mode | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [chatReady, setChatReady] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const widgetRef = useRef<DograhWidgetApi | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingTextRef = useRef<string | null>(null);
  const assistantCountRef = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => () => stopChatPolling(), []);

  function stopChatPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function startChatPolling(api: DograhWidgetApi) {
    stopChatPolling();
    const startedAt = Date.now();
    assistantCountRef.current = 0;
    pollRef.current = setInterval(() => {
      const state = api.getState().chat;
      if (state.status === 'ready' || Date.now() - startedAt > 8000) {
        setChatReady(true);
      }
      const next: ChatMessage[] = [];
      let assistantCount = 0;
      for (const turn of state.turns) {
        if (turn.user_message?.text) next.push({ role: 'user', text: turn.user_message.text });
        if (turn.assistant_message?.text) {
          next.push({ role: 'assistant', text: turn.assistant_message.text });
          assistantCount++;
        }
      }
      if (assistantCount > assistantCountRef.current) setIsTyping(false);
      assistantCountRef.current = assistantCount;
      if (pendingTextRef.current && !next.some((m) => m.role === 'user' && m.text === pendingTextRef.current)) {
        next.push({ role: 'user', text: pendingTextRef.current });
      } else {
        pendingTextRef.current = null;
      }
      setMessages(next);
    }, 120);
  }

  function tryUnblockAudio(api: DograhWidgetApi) {
    setTimeout(() => {
      const audioEl = api.getState().audioElement;
      if (!audioEl || !audioEl.paused) return;
      audioEl.play().catch(() => setAudioBlocked(true));
    }, 400);
  }

  async function pickMode(next: Mode) {
    setMode(next);
    setMenuOpen(false);
    setError(null);
    setMessages([]);
    setChatReady(false);
    setIsTyping(false);
    setAudioBlocked(false);

    const scriptPromise = loadDograhScript(baseUrl, next === 'voice' ? voiceToken : chatToken);

    if (next === 'voice') {
      setCallStatus('requesting-mic');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        setCallStatus('error');
        setError('Microphone access was blocked. Please allow microphone access and try again.');
        return;
      }
    }

    setCallStatus('connecting');
    try {
      const api = await scriptPromise;
      widgetRef.current = api;

      await new Promise<void>((resolve) => {
        let done = false;
        const finish = () => {
          if (!done) {
            done = true;
            resolve();
          }
        };
        api.onReady?.(finish);
        setTimeout(finish, 1200);
      });
      await new Promise<void>((resolve) => {
        const start = Date.now();
        const check = () => {
          if (api.getState().config?.widgetType === next || Date.now() - start > 4000) {
            resolve();
            return;
          }
          setTimeout(check, 100);
        };
        check();
      });

      api.onError?.((err) => {
        setError(typeof err === 'string' ? err : 'Something went wrong. Please try again.');
        setCallStatus('error');
      });

      if (next === 'voice') {
        api.onStatusChange?.((status) => {
          if (status === 'connecting') setCallStatus('connecting');
          else if (status === 'connected') setCallStatus('connected');
          else if (status === 'ended' || status === 'disconnected') setCallStatus('ended');
        });
        api.onCallConnected?.(() => {
          setCallStatus('connected');
          tryUnblockAudio(api);
        });
        api.onCallEnd?.(() => setCallStatus('ended'));
        api.start();
      } else {
        api.startChat();
        setCallStatus('connected');
        startChatPolling(api);
      }
    } catch {
      setCallStatus('error');
      setError("Couldn't connect right now. Please try again in a moment.");
    }
  }

  function endCall() {
    widgetRef.current?.end?.();
    setCallStatus('ended');
  }

  function sendChatMessage() {
    const text = draft.trim();
    if (!text || !widgetRef.current || !chatReady) return;
    pendingTextRef.current = text;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setIsTyping(true);
    widgetRef.current.sendMessage(text);
    setDraft('');
  }

  function backToMenu() {
    if (mode === 'voice' && callStatus === 'connected') endCall();
    if (mode === 'chat') widgetRef.current?.endChat?.();
    stopChatPolling();
    setMode(null);
    setCallStatus('idle');
    setMessages([]);
    setChatReady(false);
    setIsTyping(false);
    setAudioBlocked(false);
    setError(null);
    setMenuOpen(true);
  }

  function toggleLauncher() {
    if (mode) {
      backToMenu();
      setMenuOpen(false);
      return;
    }
    setMenuOpen((v) => !v);
  }

  const isPanelOpen = menuOpen || mode !== null;
  const headerStatus: CallStatus =
    mode === 'chat' && callStatus === 'connected' && !chatReady ? 'connecting' : callStatus;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 2147483000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        fontFamily: '"Bricolage Grotesque", "Geist", "Inter", -apple-system, sans-serif',
      }}
    >
      {/* Rendered before the script loads — see the prop's own comment. */}
      <div id={chatContainerId} style={{ display: 'none' }} />

      {menuOpen && !mode && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14, alignItems: 'flex-end' }}>
          <button onClick={() => pickMode('voice')} style={menuItemStyle}>
            <span style={menuIconStyle}>
              <MicIcon size={18} />
            </span>
            Talk to us
          </button>
          <button onClick={() => pickMode('chat')} style={menuItemStyle}>
            <span style={menuIconStyle}>
              <ChatIcon size={18} />
            </span>
            Chat with us
          </button>
        </div>
      )}

      {mode && (
        <div
          style={{
            width: 344,
            maxWidth: 'calc(100vw - 48px)',
            height: 480,
            maxHeight: 'calc(100vh - 120px)',
            background: CREAM,
            border: `1px solid ${INK}1f`,
            borderRadius: 20,
            boxShadow: '0px 20px 48px rgba(20, 38, 29, 0.28)',
            marginBottom: 16,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: FOREST,
              color: CREAM,
              padding: '16px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <button onClick={backToMenu} aria-label="Back" style={headerIconButtonStyle}>
              <ChevronLeftIcon />
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>
                {mode === 'voice' ? 'Talk to Stella' : 'Chat with Stella'}
              </div>
              <div style={{ fontSize: 11.5, opacity: 0.7, display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                <StatusDot status={headerStatus} />
                {statusLabel(headerStatus, mode)}
              </div>
            </div>
            <button
              onClick={() => {
                backToMenu();
                setMenuOpen(false);
              }}
              aria-label="Close"
              style={headerIconButtonStyle}
            >
              <CloseIcon />
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {mode === 'voice' && (
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <div
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: '50%',
                    background: callStatus === 'error' ? 'rgb(178, 15, 3)' : ORANGE,
                    color: CREAM,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 0 0 8px ${ORANGE}1a`,
                    animation:
                      callStatus === 'connecting' || callStatus === 'requesting-mic'
                        ? 'stella-pulse 1.3s ease-in-out infinite'
                        : undefined,
                  }}
                >
                  <MicIcon size={30} />
                </div>
                <p style={{ margin: 0, color: INK, fontWeight: 600, fontSize: 15, textAlign: 'center' }}>
                  {statusHeadline(callStatus)}
                </p>
                {error && (
                  <p style={{ margin: 0, color: 'rgb(178, 15, 3)', fontSize: 13, textAlign: 'center', maxWidth: 260 }}>
                    {error}
                  </p>
                )}
                {callStatus === 'connected' && audioBlocked && (
                  <button
                    onClick={() => {
                      widgetRef.current?.getState().audioElement?.play();
                      setAudioBlocked(false);
                    }}
                    style={primaryButtonStyle}
                  >
                    Tap to enable sound
                  </button>
                )}
                {callStatus === 'connected' && (
                  <button onClick={endCall} style={endCallButtonStyle}>
                    <PhoneOffIcon size={15} />
                    End call
                  </button>
                )}
                {(callStatus === 'ended' || callStatus === 'error') && (
                  <button onClick={() => pickMode('voice')} style={primaryButtonStyle}>
                    Try again
                  </button>
                )}
              </div>
            )}

            {mode === 'chat' && (
              <>
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {messages.length === 0 && (
                    <p style={{ margin: 0, color: `${INK}99`, fontSize: 13, textAlign: 'center' }}>
                      Ask us anything about our courses, pricing, or enrollment.
                    </p>
                  )}
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                        background: m.role === 'user' ? ORANGE : 'rgb(255, 255, 255)',
                        color: m.role === 'user' ? CREAM : INK,
                        borderRadius: 14,
                        padding: '9px 13px',
                        maxWidth: '82%',
                        fontSize: 13.5,
                        lineHeight: 1.45,
                        boxShadow: m.role === 'assistant' ? '0 1px 3px rgba(20,38,29,0.1)' : undefined,
                      }}
                    >
                      {m.text}
                    </div>
                  ))}
                  {isTyping && (
                    <div
                      style={{
                        alignSelf: 'flex-start',
                        background: 'rgb(255, 255, 255)',
                        borderRadius: 14,
                        padding: '11px 14px',
                        boxShadow: '0 1px 3px rgba(20,38,29,0.1)',
                        display: 'flex',
                        gap: 4,
                      }}
                    >
                      <span style={{ ...typingDotStyle, animationDelay: '0ms' }} />
                      <span style={{ ...typingDotStyle, animationDelay: '150ms' }} />
                      <span style={{ ...typingDotStyle, animationDelay: '300ms' }} />
                    </div>
                  )}
                  {error && <p style={{ margin: 0, color: 'rgb(178, 15, 3)', fontSize: 13 }}>{error}</p>}
                  <div ref={messagesEndRef} />
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendChatMessage();
                  }}
                  style={{ display: 'flex', gap: 8, padding: 12, borderTop: `1px solid ${INK}1a` }}
                >
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    disabled={!chatReady}
                    placeholder={chatReady ? 'Type a message…' : 'Connecting…'}
                    style={{
                      flex: 1,
                      border: `1px solid ${INK}33`,
                      borderRadius: 999,
                      padding: '9px 14px',
                      fontSize: 13.5,
                      outline: 'none',
                      background: 'white',
                      color: INK,
                      opacity: chatReady ? 1 : 0.6,
                    }}
                  />
                  <button
                    type="submit"
                    aria-label="Send"
                    disabled={!chatReady}
                    style={{ ...sendButtonStyle, opacity: chatReady ? 1 : 0.6, cursor: chatReady ? 'pointer' : 'default' }}
                  >
                    <SendIcon />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <button onClick={toggleLauncher} aria-label="Contact Oscar Education" style={launcherStyle}>
        {isPanelOpen ? <CloseIcon size={20} /> : <ChatIcon size={20} />}
      </button>

      <style>{`
        @keyframes stella-pulse {
          0%, 100% { box-shadow: 0 0 0 8px ${ORANGE}1a; }
          50% { box-shadow: 0 0 0 14px ${ORANGE}1a; }
        }
        @keyframes stella-typing-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-3px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function statusHeadline(status: CallStatus): string {
  switch (status) {
    case 'requesting-mic':
      return 'Requesting microphone access…';
    case 'connecting':
      return 'Connecting you to Stella…';
    case 'connected':
      return 'Connected — say hello!';
    case 'ended':
      return 'Call ended';
    case 'error':
      return "Couldn't connect";
    default:
      return 'Starting…';
  }
}

function statusLabel(status: CallStatus, mode: Mode): string {
  if (mode === 'chat') {
    if (status === 'error') return 'Offline';
    if (status === 'connecting') return 'Connecting…';
    return 'Online';
  }
  switch (status) {
    case 'requesting-mic':
      return 'Requesting mic…';
    case 'connecting':
      return 'Connecting…';
    case 'connected':
      return 'Live call';
    case 'ended':
      return 'Call ended';
    case 'error':
      return 'Connection failed';
    default:
      return 'Ready';
  }
}

function StatusDot({ status }: { status: CallStatus }) {
  const color =
    status === 'connected' ? 'rgb(120, 200, 140)' : status === 'error' ? 'rgb(230, 110, 100)' : 'rgba(244,240,229,0.6)';
  return (
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: color,
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  );
}

const typingDotStyle: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: INK,
  opacity: 0.5,
  display: 'inline-block',
  animation: 'stella-typing-dot 1.2s ease-in-out infinite',
};

const launcherStyle: React.CSSProperties = {
  width: 58,
  height: 58,
  borderRadius: '50%',
  background: FOREST,
  color: CREAM,
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0px 4px 0px 0px rgb(73, 126, 100)',
};

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  background: CREAM,
  color: INK,
  border: 'none',
  borderRadius: 999,
  padding: '11px 18px 11px 12px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0px 4px 0px 0px rgb(27, 52, 40)',
  whiteSpace: 'nowrap',
};

const menuIconStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: '50%',
  background: ORANGE,
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const headerIconButtonStyle: React.CSSProperties = {
  background: 'rgba(244, 240, 229, 0.12)',
  border: 'none',
  color: CREAM,
  width: 30,
  height: 30,
  borderRadius: '50%',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const primaryButtonStyle: React.CSSProperties = {
  background: FOREST,
  border: 'none',
  color: CREAM,
  borderRadius: 999,
  padding: '10px 22px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0px 4px 0px 0px rgb(73, 126, 100)',
};

const endCallButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  background: 'rgb(178, 15, 3)',
  border: 'none',
  color: 'white',
  borderRadius: 999,
  padding: '10px 22px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0px 4px 0px 0px rgb(120, 20, 10)',
};

const sendButtonStyle: React.CSSProperties = {
  background: ORANGE,
  border: 'none',
  color: 'white',
  width: 36,
  height: 36,
  borderRadius: '50%',
  cursor: 'pointer',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0px 3px 0px 0px rgb(178, 110, 69)',
};
