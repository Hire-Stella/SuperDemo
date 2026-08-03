import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  NotImplementedByDriverError,
  type PlayAudioOptions,
  type TelephonyCallHandle,
  type TelephonyProvider,
  type TelephonySink,
} from '@fit-ai/contracts';
import { RealtimeService } from '../../realtime/realtime.service';

/**
 * The demo audience actually talks to the AI — for zero provider cost.
 *
 * How it works:
 *   1. The caller's browser runs `SpeechRecognition` (free, built into Chrome
 *      and Edge) and POSTs each final utterance to the API.
 *   2. The orchestrator runs the real turn loop and returns the reply text in
 *      the HTTP response.
 *   3. The browser speaks it with `SpeechSynthesis` (free).
 *   4. `MediaRecorder` captures the whole session and uploads it as the
 *      recording, so the conversation detail page has real audio.
 *   5. On escalation, the caller tab and the agent's softphone tab establish a
 *      raw `RTCPeerConnection`; this API is only the signalling relay. No
 *      LiveKit, no Twilio, no SFU.
 *
 * So the *only* thing missing versus production is the PSTN carrier. Everything
 * a client can see and hear is genuinely working.
 *
 * Constraint worth stating plainly: Chrome/Edge only, and `SpeechRecognition`
 * proxies audio to Google, so it needs internet. Fine for a demo, wrong for
 * production — which is why STT sits behind its own driver.
 */
@Injectable()
export class BrowserTelephony implements TelephonyProvider {
  readonly name = 'browser';
  readonly supportsMedia = true;
  readonly supportsOutbound = false;

  private readonly log = new Logger(BrowserTelephony.name);
  private sink?: TelephonySink;

  /** Live browser calls, keyed by providerCallId. */
  private readonly sessions = new Map<
    string,
    { mediaSessionId: string; agentUserId?: string; onHold: boolean }
  >();

  constructor(private readonly realtime: RealtimeService) {}

  attachSink(sink: TelephonySink): void {
    this.sink = sink;
  }

  /* ------------------------------ provider API ---------------------------- */

  async answer(providerCallId: string): Promise<TelephonyCallHandle> {
    const mediaSessionId = `web-${providerCallId}`;
    this.sessions.set(providerCallId, { mediaSessionId, onHold: false });
    return { providerCallId, mediaSessionId };
  }

  /**
   * The reply is returned to the caller's browser through the HTTP response
   * that carried the utterance, so there is no audio to push from here. What
   * this does do is fan the AI's line out over WebSocket, which is what makes
   * the supervisor's live-transcript panel work during the demo.
   */
  async play(providerCallId: string, opts: PlayAudioOptions): Promise<void> {
    this.realtime.toCall(providerCallId, 'transcript.partial', {
      callId: providerCallId,
      speaker: 'AI_AGENT',
      text: opts.text,
    });
  }

  async bridgeAgent(
    providerCallId: string,
    agentUserId: string,
  ): Promise<{ mediaSessionId: string; agentToken: string | null }> {
    const session = this.sessions.get(providerCallId);
    const mediaSessionId = session?.mediaSessionId ?? `web-${providerCallId}`;
    this.sessions.set(providerCallId, { ...(session ?? { onHold: false }), mediaSessionId, agentUserId });

    // The "token" is just the room id both tabs use to find each other through
    // the signalling relay. There is no media server to authenticate against.
    return { mediaSessionId, agentToken: mediaSessionId };
  }

  async releaseAi(providerCallId: string): Promise<void> {
    this.log.debug(`[${providerCallId}] AI leg released, human has the call`);
  }

  async hold(providerCallId: string, hold: boolean): Promise<void> {
    const session = this.sessions.get(providerCallId);
    if (session) session.onHold = hold;
  }

  async hangup(providerCallId: string): Promise<void> {
    this.sessions.delete(providerCallId);
  }

  async dial(): Promise<TelephonyCallHandle> {
    throw new NotImplementedByDriverError('browser', 'outbound dialling');
  }

  /* ------------------------------- browser API ---------------------------- */

  /** Called by the controller when a browser starts a call. */
  async startBrowserCall(params: {
    toNumber: string;
    fromNumber: string;
    callerName?: string;
  }): Promise<{ providerCallId: string }> {
    if (!this.sink) throw new Error('BrowserTelephony has no sink attached');

    const providerCallId = `web-${randomUUID()}`;
    await this.sink.onInboundCall({
      providerCallId,
      fromNumber: params.fromNumber,
      toNumber: params.toNumber,
      callerName: params.callerName,
      receivedAt: new Date(),
      metadata: { browser: true },
    });
    return { providerCallId };
  }

  isLive(providerCallId: string): boolean {
    return this.sessions.has(providerCallId);
  }

  mediaSessionFor(providerCallId: string): string | null {
    return this.sessions.get(providerCallId)?.mediaSessionId ?? null;
  }
}
