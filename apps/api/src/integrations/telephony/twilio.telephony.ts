import { Inject, Injectable, Logger } from '@nestjs/common';
import twilio, { type Twilio } from 'twilio';
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
      throw new NotImplementedByDriverError(
        'twilio',
        `dial() bridging ${agentNumber} to itself — the agent is rung first and then the ` +
          'customer, so this would find the line engaged. Use a different destination',
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

    /*
     * `from` is our Twilio DID for both legs.
     *
     * On the agent leg it is what their handset displays, so an agent learns to
     * recognise the centre's own number rather than an unknown one. On the
     * customer leg it is set again in the TwiML `callerId`, because Twilio will
     * not present a number the account does not own — and presenting the
     * agent's personal mobile to a customer would be worse than useless.
     */
    const call = await this.twilio.calls.create({
      to: agentNumber,
      from: this.env.TWILIO_NUMBER ?? params.fromNumber,
      url: `${this.publicUrl('bridge')}?to=${encodeURIComponent(params.toNumber)}`,
      method: 'POST',
      statusCallback: this.publicUrl('status'),
      statusCallbackMethod: 'POST',
      // 'answered' is what tells us a human is on the line; the rest let a
      // failed attempt close the call row instead of leaving it ringing.
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      // Long enough for a handset in a pocket, short enough that a dead number
      // does not hold a telecaller up.
      timeout: 30,
    });

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
