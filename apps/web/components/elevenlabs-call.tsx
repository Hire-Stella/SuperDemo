'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Mic, PhoneCall, PhoneOff, Sparkles, Volume2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, Button, Card, MockNotice, cn } from '@/components/composites';

interface StartResponse {
  callId: string;
  conversationToken: string;
  agentId: string;
  greeting: string;
  dynamicVariables: Record<string, string>;
}

interface Turn {
  who: 'caller' | 'ai';
  text: string;
}

/**
 * A real voice call in the browser, with no phone carrier.
 *
 * ElevenLabs Agents runs the media loop over WebRTC — genuine speech
 * recognition, turn-taking and barge-in, and their voice rather than the robotic
 * browser synthesiser. Our API is still the brain: the agent is configured with
 * a custom LLM pointing at our bridge, so this exercises the same knowledge
 * base, the same confidence floor and the same escalation policy a real phone
 * call would.
 *
 * The difference versus the Web Speech path is entirely audible — interrupting
 * mid-sentence works, and it sounds like a person.
 *
 * The SDK requires a provider above any consumer of `useConversation`, hence the
 * wrapper.
 */
export function ElevenLabsCall() {
  return (
    <ConversationProvider>
      <ElevenLabsCallInner />
    </ConversationProvider>
  );
}

function ElevenLabsCallInner() {
  const queryClient = useQueryClient();
  const [callId, setCallId] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [starting, setStarting] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const conversation = useConversation({
    onConnect: () => toast.success('Connected — start speaking'),
    onDisconnect: () => {
      setCallId(null);
      void queryClient.invalidateQueries({ queryKey: ['liveops'] });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onMessage: ({ message, source }) => {
      setTurns((t) => [...t, { who: source === 'user' ? 'caller' : 'ai', text: message }]);
    },
    onError: (message) => toast.error(`ElevenLabs: ${String(message)}`),
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns]);

  const start = useCallback(async () => {
    setStarting(true);
    try {
      // Microphone permission has to be granted before the session opens, or the
      // agent connects to silence and the caller never gets a reply.
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const session = await api.post<StartResponse>('/elevenlabs/browser/start', {
        callerName: 'Demo caller',
      });

      setTurns([]);
      setCallId(session.callId);

      // startSession is synchronous in v1 — status changes arrive via callbacks.
      conversation.startSession({
        conversationToken: session.conversationToken,
        connectionType: 'webrtc',
        // This is what ties each bridge turn back to our call record.
        dynamicVariables: session.dynamicVariables,
      });
    } catch (error) {
      const msg = (error as Error).message;
      toast.error(
        /permission|notallowed/i.test(msg)
          ? 'Microphone access was denied — the call needs it.'
          : msg,
      );
      setCallId(null);
    } finally {
      setStarting(false);
    }
  }, [conversation]);

  const stop = useCallback(async () => {
    conversation.endSession();
    if (callId) {
      await api.post('/calls/browser/hangup', { callId }).catch(() => undefined);
    }
    setCallId(null);
  }, [conversation, callId]);

  const connected = conversation.status === 'connected';
  const live = connected || Boolean(callId);

  return (
    <Card
      title="Talk to the AI — ElevenLabs voice"
      subtitle="Real speech, real turn-taking, real barge-in. No phone number required."
      action={
        live ? (
          <Button variant="danger" size="sm" onClick={() => void stop()}>
            <PhoneOff className="size-3.5" aria-hidden /> End
          </Button>
        ) : (
          <Button variant="live" size="sm" loading={starting} onClick={() => void start()}>
            <PhoneCall className="size-3.5" aria-hidden /> Start call
          </Button>
        )
      }
    >
      <div className="space-y-3 p-4">
        <MockNotice>
          This is a browser call, not a phone call — ElevenLabs does not sell phone numbers, so a
          dialable line needs Twilio or a TDRA-licensed UAE SIP trunk. Everything else is the
          production path: their speech and turn-taking, our knowledge base, our escalation policy.
        </MockNotice>

        {!live && (
          <p className="text-sm text-muted-foreground">
            Press <strong>Start call</strong> and speak. Try “tell me about the ABA certification”,
            then “how much does it cost?”, then interrupt it halfway with “can I speak to
            someone?” — barge-in works, and the last one hands you to a real agent on the softphone.
          </p>
        )}

        {live && (
          <>
            <div className="flex items-center gap-2">
              <Badge className={connected ? 'bg-live-soft text-live' : 'bg-muted'}>
                <Mic className="size-3" aria-hidden />
                {conversation.status}
              </Badge>
              {conversation.isSpeaking && (
                <Badge className="bg-ai-soft text-ai">
                  <Volume2 className="pulse size-3" aria-hidden /> assistant speaking
                </Badge>
              )}
              {conversation.isListening && !conversation.isSpeaking && (
                <Badge className="bg-live-soft text-live">listening</Badge>
              )}
            </div>

            <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg bg-muted p-3">
              {turns.length === 0 && <p className="text-xs text-muted-foreground">Listening…</p>}
              {turns.map((t, i) => (
                <div
                  key={i}
                  className={cn(
                    'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                    t.who === 'caller'
                      ? 'ml-auto bg-primary text-primary-foreground'
                      : 'bg-card',
                  )}
                >
                  {t.who === 'ai' && (
                    <span className="mb-0.5 flex items-center gap-1 text-[11px] text-ai">
                      <Sparkles className="size-2.5" aria-hidden /> assistant
                    </span>
                  )}
                  {t.text}
                </div>
              ))}
              <div ref={endRef} />
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
