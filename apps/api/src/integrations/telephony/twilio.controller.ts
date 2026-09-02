import { Controller, Headers, Inject, Logger, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { validateRequest } from 'twilio';
import { twiml } from 'twilio';
import type { ApiEnv } from '@superdemo/contracts';
import { ENV } from '../../config/config.module';
import { Public } from '../../auth/guards';
import { TwilioTelephony } from './twilio.telephony';

/**
 * The two callbacks Twilio makes into us during an outbound bridge.
 *
 * Both are unauthenticated in the session sense — Twilio has no bearer token —
 * so both are authenticated by `X-Twilio-Signature`, an HMAC over the exact
 * request URL and its POST body using the account auth token. Same reasoning as
 * the ElevenLabs webhooks: a publicly routable route that moves call state must
 * not be callable by anyone who guesses it.
 *
 * Grouped in their own controller, every route `@Public()`, so that fact is
 * visible at the top of one small file rather than as a decorator buried in a
 * class where everything else is guarded.
 *
 * ## Why the signature check is worth more than it looks
 *
 * `/bridge` takes the number to call from the query string. Without a valid
 * signature that is an open relay: anyone who finds the URL could make our
 * Twilio account dial any number in the world, billed to us. The check is what
 * makes the parameter safe to trust.
 */
@Controller('twilio')
export class TwilioController {
  private readonly log = new Logger(TwilioController.name);

  constructor(
    @Inject(ENV) private readonly env: ApiEnv,
    private readonly driver: TwilioTelephony,
  ) {}

  /**
   * The agent picked up. Connect the customer.
   *
   * Returned as TwiML because this is Twilio asking "what now?" mid-call, and
   * the answer has to be an instruction rather than a status code.
   */
  @Public()
  @Post('bridge')
  bridge(
    @Query('to') to: string,
    @Req() req: Request,
    @Res() res: Response,
    @Headers('x-twilio-signature') signature?: string,
  ): void {
    if (!this.verify(req, signature)) {
      res.status(403).send('bad signature');
      return;
    }

    const response = new twiml.VoiceResponse();
    if (!to) {
      // Should be unreachable: dial() always sets it. Saying something is still
      // better than silence — an agent holding a dead line does not know
      // whether to wait.
      response.say('The number to call was missing. Ending the call.');
    } else {
      const dial = response.dial({
        // Our DID, not the agent's handset: Twilio refuses a callerId the
        // account does not own, and the customer should see the centre.
        callerId: this.env.TWILIO_NUMBER ?? undefined,
        // The customer's phone rings for this long before we give up. Shorter
        // than the agent leg — the agent is already committed and waiting.
        timeout: 25,
        action: `/api/twilio/bridge-result`,
        method: 'POST',
      });
      dial.number(to);
    }

    res.type('text/xml').send(response.toString());
  }

  /**
   * How the customer leg ended.
   *
   * Distinct from `/status`, which is about the AGENT leg. Twilio reports the
   * two separately and conflating them would record "answered" for a call where
   * the agent picked up and the customer never did.
   */
  @Public()
  @Post('bridge-result')
  async bridgeResult(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('x-twilio-signature') signature?: string,
  ): Promise<void> {
    if (!this.verify(req, signature)) {
      res.status(403).send('bad signature');
      return;
    }

    const body = req.body as { CallSid?: string; DialCallStatus?: string };
    const sid = body.CallSid;
    const status = body.DialCallStatus ?? 'unknown';
    this.log.log(`bridge-result ${sid}: customer leg ${status}`);

    if (sid) {
      await this.driver.reportOutcome(
        sid,
        status === 'completed' || status === 'answered',
        status === 'completed' || status === 'answered' ? undefined : status,
      );
    }

    // Hang the agent up too. Without this they sit listening to nothing after
    // an unanswered customer leg.
    res.type('text/xml').send(new twiml.VoiceResponse().hangup().toString());
  }

  /** Agent-leg lifecycle. Only the terminal states are acted on. */
  @Public()
  @Post('status')
  async status(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('x-twilio-signature') signature?: string,
  ): Promise<void> {
    if (!this.verify(req, signature)) {
      res.status(403).send('bad signature');
      return;
    }

    const body = req.body as { CallSid?: string; CallStatus?: string };
    const sid = body.CallSid;
    const status = body.CallStatus;
    this.log.log(`status ${sid}: agent leg ${status}`);

    /*
     * Only failures are reported from here.
     *
     * A successful pickup is NOT reported as the outcome, because the agent
     * answering says nothing about whether the customer did — that is what
     * bridge-result is for. Reporting it here as `answered: true` would mark
     * every attempt connected the moment the agent's phone left their pocket.
     */
    if (sid && (status === 'busy' || status === 'failed' || status === 'no-answer')) {
      await this.driver.reportOutcome(sid, false, `agent leg ${status}`);
    }

    res.status(204).send();
  }

  private verify(req: Request, signature?: string): boolean {
    if (!this.env.TWILIO_VERIFY_SIGNATURE) return true;
    const token = this.env.TWILIO_AUTH_TOKEN;
    if (!token || !signature) return false;

    /*
     * The URL has to be the one Twilio signed, which is the public one — not
     * what Express sees behind a tunnel, where the host header and protocol are
     * both rewritten. So it is rebuilt from PUBLIC_BASE_URL and the original
     * path, query string included, because the query is part of the signature.
     */
    const base = (this.env.PUBLIC_BASE_URL ?? '').replace(/\/+$/, '');
    const url = `${base}${req.originalUrl}`;
    const ok = validateRequest(token, signature, url, (req.body ?? {}) as Record<string, string>);
    if (!ok) this.log.warn(`rejected ${req.originalUrl}: signature did not match`);
    return ok;
  }
}
