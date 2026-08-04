'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ConversationProvider,
  useConversation,
  useConversationClientTool,
} from '@elevenlabs/react';
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
    // `String(err)` on the SDK's error object yields "[object Object]" or a bare
    // "{}", which is how a real config rejection showed up as "Unknown error".
    // Dig out whatever detail is actually present before falling back.
    onError: (message, context) => {
      const detail =
        typeof message === 'string'
          ? message
          : ((message as { message?: string })?.message ??
            JSON.stringify(message ?? context ?? {}));
      console.error('[elevenlabs]', { message, context });
      toast.error(`ElevenLabs: ${detail || 'connection failed'}`);
    },
  });

  /**
   * `escalate_to_advisor` as a *client* tool.
   *
   * The agent calls this the moment the caller asks for a person. Running it
   * here rather than as a webhook is what lets the handoff work with no public
   * tunnel: the browser already has a session and can reach our API directly,
   * so ElevenLabs never needs inbound access to us.
   *
   * The string returned is what the agent says next, so it has to read as
   * speech, not as an API response.
   */
  useConversationClientTool<{ escalate_to_advisor: () => Promise<string> }>(
    'escalate_to_advisor',
    async () => {
      if (!callId) return 'I could not reach the advisor queue just now.';
      try {
        const res = await api.post<{ success: boolean; message: string }>(
          '/elevenlabs/browser/escalate',
          { callId },
        );
        setTurns((t) => [
          ...t,
          { who: 'ai', text: `[handing over] ${res.message}` },
        ]);
        // Make the waiting agent's softphone light up without a refresh.
        void queryClient.invalidateQueries({ queryKey: ['liveops'] });
        return res.message;
      } catch {
        return 'I could not reach the advisor queue just now.';
      }
    },
  );

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
      //
      // Nothing is overridden here on purpose. The agent is configured entirely
      // in the ElevenLabs dashboard, and it declares no dynamic variables and
      // no permitted overrides — sending `fit_call_id` anyway is what produced
      // "Server error: Unknown error {}". Our call is tracked by `callId` in
      // component state, which the escalate client tool closes over, so the
      // session needs no custom payload at all.
      conversation.startSession({
        conversationToken: session.conversationToken,
        connectionType: 'webrtc',
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
          dialable line needs Twilio or a TDRA-licensed UAE SIP trunk. The agent, voice, prompt and
          knowledge base are configured on ElevenLabs (<strong>FIT AI Inbound</strong>), which is
          what keeps the responses as fast as their own playground. The handoff to a human, the
          call record, routing and the CRM write are ours.
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
