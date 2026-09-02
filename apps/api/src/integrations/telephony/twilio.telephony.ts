import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import twilio, { type Twilio, twiml as TwiML } from 'twilio';
import {
  NotImplementedByDriverError,
  type ApiEnv,
  type TelephonyCallHandle,
  type TelephonyProvider,
  type TelephonySink,
} from '@superdemo/contracts';
import { ENV } from '../../config/config.module';

/**
 * Real phone calls, over Twilio.
 *
 * ## What this driver does, and what it deliberately does not
 *
 * It places and tears down **carrier** calls. It does not carry an AI leg:
 * `answer()`, `play()` and `releaseAi()` throw, because an assistant on a
 * Twilio call needs a media stream, an STT and a TTS, and pretending otherwise
 * would give the orchestrator a provider that accepts a `play()` and drops the
 * audio on the floor. Inbound and AI-handled calls stay on their existing
 * drivers until that lands.
 *
 * What it does support is the one thing a telecaller needs: a human clicks
 * dial, and a real phone rings.
 *
 * ## The bridge, and why the agent is rung first
 *
 * `dial()` calls the AGENT, not the customer. Twilio rings the agent's handset,
 * and only once they answer does it fetch our TwiML and dial the customer.
 *
 * The order is the whole point. Dial the customer first and you have built a
 * machine that rings members of the public and then goes looking for a human to
 * talk to them — the customer hears silence, or dead air, or hangs up. Ringing
 * the agent first means the customer's phone does not ring at all unless
 * somebody is already holding the line.
 *
 * ## Where the softphone will land
 *
 * `bridgeAgent()` is the seam for it. The browser path issues a Voice SDK
 * access token and returns it as `agentToken`, and `dial()` grows a branch that
 * targets a Twilio Client identity instead of a handset. Everything else here —
 * status callbacks, teardown, signature checks — is shared, which is why the
 * bridge is built as the first case of a general driver rather than as a
 * one-off.
 */
@Injectable()
export class TwilioTelephony implements TelephonyProvider {
  readonly name = 'twilio';
  readonly supportsMedia = true;
  readonly supportsOutbound = true;

  private readonly log = new Logger(TwilioTelephony.name);
  private client?: Twilio;
  private sink?: TelephonySink;

  constructor(@Inject(ENV) private readonly env: ApiEnv) {}

  attachSink(sink: TelephonySink): void {
    this.sink = sink;
  }

  /**
   * Built lazily rather than in the constructor.
   *
   * Nest instantiates every provider in the module whichever driver is
   * selected, so a constructor that demanded credentials would stop the API
   * booting on a laptop with no Twilio account — for a driver nobody asked for.
   */
  private get twilio(): Twilio {
    if (!this.client) {
      const sid = this.env.TWILIO_ACCOUNT_SID;
      const token = this.env.TWILIO_AUTH_TOKEN;
      // Unreachable via config validation; reachable if something constructs
      // this driver directly, and a null-deref here would be a confusing crash.
      if (!sid || !token) {
        throw new Error('TwilioTelephony used without TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN');
      }
      this.client = twilio(sid, token);
    }
    return this.client;
  }

  private publicUrl(path: string): string {
    const base = (this.env.PUBLIC_BASE_URL ?? '').replace(/\/+$/, '');
    if (!base) throw new Error('TwilioTelephony needs PUBLIC_BASE_URL to receive TwiML callbacks');
    return `${base}/api/twilio/${path}`;
  }

  async dial(params: {
    fromNumber: string;
    toNumber: string;
    opener?: string;
    speed?: number;
    agentNumber?: string;
  }): Promise<TelephonyCallHandle> {
    const agentNumber = params.agentNumber ?? this.env.TWILIO_AGENT_FALLBACK_NUMBER;

    /*
     * Checked here, not only in the service, because the agent number is not
     * fully known until this line.
     *
     * The service compares the telecaller's own phoneE164 against the
     * destination, which misses the case where the number came from
     * TWILIO_AGENT_FALLBACK_NUMBER instead — and that is exactly the
     * single-handset demo setup where somebody is most likely to dial their own
     * phone. Twilio bills the attempt either way, so the refusal belongs where
     * the answer is certain.
     */
    if (agentNumber === params.toNumber) {
      /*
       * A bad request, not an unimplemented capability.
       *
       * NotImplementedByDriverError renders as "Driver twilio does not
       * implement dial()… see NOT-IMPLEMENTED.md", which tells a telecaller who
       * mistyped a number that the product is missing a feature and sends them
       * to a document about carrier licensing. Nothing is missing. They dialled
       * themselves, and the fix is to type a different number.
       */
      throw new BadRequestException(
        'That is the number this call would ring you on. You would be bridged to yourself and ' +
          'find the line engaged — dial a different number.',
      );
    }

    if (!agentNumber) {
      // Refused rather than defaulted. The alternative — dialling the customer
      // with no agent leg — is the failure mode described in the class comment.
      throw new NotImplementedByDriverError(
        'twilio',
        'dial() without an agent number — set the telecaller a phone number in Settings, ' +
          'or TWILIO_AGENT_FALLBACK_NUMBER for a single-handset demo',
      );
    }

    const from = this.env.TWILIO_NUMBER ?? params.fromNumber;

    /*
     * The bridge TwiML is sent inline rather than fetched from us.
     *
     * It is a static instruction — dial this one number — so serving it over
     * the public internet was pointless indirection, and it made a working
     * phone call depend on our API being publicly reachable at the exact
     * moment the agent picked up. In development behind a tunnel that is a real
     * failure mode: the agent answers, the fetch fails, Twilio hangs up, and the
     * customer is never dialled. Measured, and billed for.
     *
     * `callerId` is our DID again rather than the agent's handset: Twilio
     * refuses a number the account does not own, and presenting an agent's
     * personal mobile to a customer would be worse than useless.
     */
    const bridge = new TwiML.VoiceResponse();
    const dial = bridge.dial({
      callerId: from,
      // The customer's phone rings for this long. Shorter than the agent leg,
      // because the agent is already committed and listening to it.
      timeout: 25,
      ...(this.env.PUBLIC_BASE_URL
        ? { action: this.publicUrl('bridge-result'), method: 'POST' as const }
        : {}),
    });
    dial.number(params.toNumber);

    /*
     * Status callbacks stay optional, and are attached only when we have a
     * public address to receive them at.
     *
     * Losing them costs the outcome — whether the customer picked up — which
     * downgrades reporting. It does not stop the call connecting, and a driver
     * that refused to place calls because it could not be told about them
     * afterwards would have the priorities backwards.
     */
    const callbacks = this.env.PUBLIC_BASE_URL
      ? {
          statusCallback: this.publicUrl('status'),
          statusCallbackMethod: 'POST' as const,
          statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        }
      : {};

    const call = await this.twilio.calls.create({
      to: agentNumber,
      from,
      twiml: bridge.toString(),
      ...callbacks,
      // Long enough for a handset in a pocket, short enough that a dead number
      // does not hold a telecaller up.
      timeout: 30,
    });

    if (!this.env.PUBLIC_BASE_URL) {
      this.log.warn(
        'PUBLIC_BASE_URL is unset: the call will connect, but Twilio cannot report how it ended, ' +
          'so the outcome will not reach the inbox',
      );
    }

    this.log.log(`dial ${call.sid}: agent ${agentNumber} -> customer ${params.toNumber}`);
    return { providerCallId: call.sid, mediaSessionId: null };
  }

  async hangup(providerCallId: string): Promise<void> {
    try {
      await this.twilio.calls(providerCallId).update({ status: 'completed' });
    } catch (err) {
      /*
       * Swallowed on purpose. The overwhelmingly common cause is that the call
       * has already ended — the other party hung up a moment before the agent
       * clicked — and Twilio 404s a completed call. Raising here would turn the
       * ordinary end of a conversation into an error toast, and worse, the
       * caller of this method is finishing a call: throwing would leave our own
       * row open for a call that is provably over.
       */
      this.log.warn(`hangup ${providerCallId}: ${(err as Error).message}`);
    }
  }

  async hold(providerCallId: string, hold: boolean): Promise<void> {
    // Twilio holds by redirecting the leg to hold TwiML and back. That needs a
    // conference rather than a two-party dial, which is the same restructuring
    // the softphone needs — so it lands with that, not before.
    throw new NotImplementedByDriverError(
      'twilio',
      `hold(${hold}) — needs the call moved into a conference`,
    );
  }

  answer(): never {
    throw new NotImplementedByDriverError(
      'twilio',
      'answer() — inbound AI legs need a media stream, STT and TTS',
    );
  }

  play(): never {
    throw new NotImplementedByDriverError('twilio', 'play() — no AI leg on this driver yet');
  }

  bridgeAgent(): never {
    throw new NotImplementedByDriverError(
      'twilio',
      'bridgeAgent() — the agent is bridged at dial time; this is the softphone seam',
    );
  }

  releaseAi(): never {
    throw new NotImplementedByDriverError('twilio', 'releaseAi() — no AI leg on this driver yet');
  }

  /** Reports how an attempt resolved. Called by the status webhook. */
  async reportOutcome(providerCallId: string, answered: boolean, reason?: string): Promise<void> {
    await this.sink?.onOutboundResult?.({
      providerCallId,
      answered,
      ...(reason === undefined ? {} : { failureReason: reason }),
    });
  }
}
