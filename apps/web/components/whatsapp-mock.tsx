'use client';

/**
 * WhatsApp handset mock.
 *
 * The point of this is to show the *customer's* side. Everything else in the
 * dashboard is the staff view, so a client watching a demo has to take on trust
 * what the person on WhatsApp actually sees. Here they can read it.
 *
 * The transport is mocked; nothing else is. Text typed here goes through
 * `/whatsapp/simulate/message`, which is the same entry point the Meta Cloud
 * API webhook would call, so the reply comes from the real brain, with the real
 * confidence floor and the real escalation policy, and the thread lands in the
 * real inbox. When the AI hands off, this pane says so and the conversation
 * appears in a queue for a human — the same handoff as voice.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, MessageCircle, Phone, RotateCcw, Send, Video } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, Button, Card, Input, MockNotice, cn } from '@/components/composites';

type Bubble = { id: string; who: 'customer' | 'business'; text: string; at: string };

/** A stable-looking UAE mobile for the demo persona. */
const DEMO_FROM = '+971501234567';
const DEMO_NAME = 'Demo customer';

/** FIT's real published WhatsApp Business number. */
const FIT_WA_NUMBER = '+971 4 570 9603';

const SUGGESTIONS = [
  'Do you offer the ABA certification?',
  'How much is the VAT course?',
  'What are the timings?',
  'I need my certificate attested for MOH',
  'Can someone call me please?',
];

function clockOf(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function WhatsAppMock() {
  const queryClient = useQueryClient();
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [handedOff, setHandedOff] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [bubbles, sending]);

  const send = useCallback(
    async (body: string) => {
      const outgoing = body.trim();
      if (!outgoing || sending) return;

      setText('');
      setSending(true);
      // Optimistic: WhatsApp shows your own message immediately.
      setBubbles((b) => [
        ...b,
        { id: `c-${b.length}`, who: 'customer', text: outgoing, at: new Date().toISOString() },
      ]);

      try {
        const res = await api.post<{
          conversationId: string;
          reply?: string | null;
          escalated?: boolean;
        }>('/whatsapp/simulate/message', {
          fromNumber: DEMO_FROM,
          fromName: DEMO_NAME,
          text: outgoing,
        });

        setConversationId(res.conversationId);
        if (res.escalated) setHandedOff(true);
        if (res.reply) {
          setBubbles((b) => [
            ...b,
            { id: `b-${b.length}`, who: 'business', text: res.reply!, at: new Date().toISOString() },
          ]);
        }
        // The thread is now in the staff inbox — refresh it behind the scenes.
        void queryClient.invalidateQueries({ queryKey: ['conversations'] });
        void queryClient.invalidateQueries({ queryKey: ['liveops'] });
      } catch (error) {
        toast.error((error as Error).message);
      } finally {
        setSending(false);
      }
    },
    [sending, queryClient],
  );

  const reset = useCallback(() => {
    setBubbles([]);
    setConversationId(null);
    setHandedOff(false);
    setText('');
  }, []);

  return (
    <Card
      title="WhatsApp — the customer's handset"
      subtitle="Type as the customer. The reply is the real brain, not a script."
      action={
        bubbles.length > 0 ? (
          <Button variant="secondary" size="sm" onClick={reset}>
            <RotateCcw className="size-3.5" aria-hidden /> New chat
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-3 p-4">
        <MockNotice>
          The <strong>transport</strong> is mocked — FIT&apos;s number {FIT_WA_NUMBER} is on the
          consumer WhatsApp Business app, and moving it to the Cloud API needs Meta verification
          (days to weeks of Meta&apos;s process, not engineering). Everything past the transport is
          the production path: same knowledge base, same confidence floor, same escalation, and the
          thread appears in the Inbox.
        </MockNotice>

        {/* ------------------------------ handset ------------------------------ */}
        <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-border shadow-sm">
          {/* WhatsApp's own chrome is intentionally its green, not the FIT red —
              this pane is meant to read as WhatsApp, not as our product. */}
          <div className="flex items-center gap-2.5 bg-[#075E54] px-3 py-2.5 text-white">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
              FIT
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">FIT Institute</p>
              <p className="truncate text-[11px] text-white/70">
                {sending ? 'typing…' : 'business account'}
              </p>
            </div>
            <Video className="size-4 opacity-70" aria-hidden />
            <Phone className="size-4 opacity-70" aria-hidden />
          </div>

          <div
            className="min-h-64 max-h-80 space-y-1.5 overflow-y-auto bg-[#ECE5DD] p-3 dark:bg-[#0B141A]"
            aria-live="polite"
          >
            {bubbles.length === 0 && (
              <p className="py-10 text-center text-xs text-muted-foreground">
                Send a message to start the conversation.
              </p>
            )}

            {bubbles.map((b) => (
              <div
                key={b.id}
                className={cn('flex', b.who === 'customer' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-2.5 py-1.5 text-[13px] leading-snug shadow-sm',
                    b.who === 'customer'
                      ? 'bg-[#DCF8C6] text-neutral-900 dark:bg-[#005C4B] dark:text-white'
                      : 'bg-white text-neutral-900 dark:bg-[#202C33] dark:text-white',
                  )}
                >
                  <p className="whitespace-pre-wrap">{b.text}</p>
                  <span className="mt-0.5 flex items-center justify-end gap-0.5 text-[10px] opacity-60">
                    {clockOf(b.at)}
                    {b.who === 'customer' && <Check className="size-3" aria-hidden />}
                  </span>
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-white px-3 py-2 shadow-sm dark:bg-[#202C33]">
                  <span className="flex gap-1">
                    {[0, 150, 300].map((d) => (
                      <span
                        key={d}
                        className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            className="flex gap-2 border-t border-border bg-card p-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send(text);
            }}
          >
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Message"
              disabled={sending}
              aria-label="WhatsApp message"
            />
            <Button type="submit" size="sm" disabled={sending || !text.trim()}>
              <Send className="size-4" aria-hidden />
            </Button>
          </form>
        </div>

        {/* ---------------------------- staff-side state ---------------------------- */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {handedOff ? (
            <Badge className="bg-warn-soft text-warn">
              <MessageCircle className="size-3" aria-hidden /> Handed to a human — waiting in a queue
            </Badge>
          ) : conversationId ? (
            <Badge className="bg-ai-soft text-ai">AI handling</Badge>
          ) : null}
          {conversationId && (
            <a
              href={`/conversations/${conversationId}`}
              className="text-primary underline-offset-2 hover:underline"
            >
              Open this thread in the Inbox →
            </a>
          )}
        </div>

        {bubbles.length === 0 && (
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void send(s)}
                className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition hover:border-primary hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
