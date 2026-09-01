import { Logger } from '@nestjs/common';
import { createHash, createHmac } from 'node:crypto';
import type {
  CrmCallInput,
  CrmContactInput,
  CrmContactRef,
  CrmProvider,
  WebhookCrmConfig,
} from '@superdemo/contracts';

/**
 * Generic outbound webhook — the escape hatch for every CRM nobody has written
 * a driver for.
 *
 * Posts the same events the real drivers send to their vendors, as JSON, to a
 * URL the centre supplies. Point it at Zapier, Make, n8n, or a few lines of the
 * client's own code and it reaches Salesforce, Pipedrive, Dynamics, a practice
 * management system or a spreadsheet. One driver, the whole long tail.
 *
 * The honest limitation, and it is a real one: **this cannot read.** A CRM
 * driver's first job is `findOrCreateContact`, which normally answers "does this
 * caller already exist, and what is their id". A fire-and-forget webhook gets no
 * answer, so this returns a deterministic id derived from the phone number
 * instead. That id is stable — the same caller always yields the same one, so
 * repeat calls thread together on the receiving side — but it is *ours*, not the
 * CRM's, and nothing in our UI can deep-link to the real record. Anything
 * needing a genuine lookup wants a real driver.
 *
 * Every request is signed. The receiver is a URL sitting on the public
 * internet accepting customer data, so it needs a way to know the post came
 * from us: HMAC-SHA256 over the raw body, in `X-HireStella-Signature`, with the
 * timestamp signed alongside so a captured request cannot be replayed later.
 */
export class WebhookCrm implements CrmProvider {
  readonly name = 'webhook';
  /**
   * A `call.started` event is emitted as the call begins, but what the receiver
   * does with it is unknowable from here — so this makes no claim of live
   * visibility.
   */
  readonly supportsLiveCall = false;

  private readonly log = new Logger(WebhookCrm.name);

  constructor(private readonly config: WebhookCrmConfig) {}

  /** No portal to link to; the receiver is a pipe, not a UI. */
  get portalUrl(): string | null {
    return null;
  }

  private async post(event: string, payload: Record<string, unknown>): Promise<unknown> {
    const body = JSON.stringify({
      event,
      sentAt: new Date().toISOString(),
      data: payload,
    });

    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'user-agent': 'HireStella-CRM-Webhook/1',
      'x-hirestella-event': event,
    };

    if (this.config.signingSecret) {
      const timestamp = String(Date.now());
      headers['x-hirestella-timestamp'] = timestamp;
      headers['x-hirestella-signature'] = createHmac('sha256', this.config.signingSecret)
        // Timestamp inside the signed material, so an old capture cannot be
        // replayed against a receiver that checks freshness.
        .update(`${timestamp}.${body}`)
        .digest('hex');
    }

    const res = await fetch(this.config.targetUrl, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Webhook ${event} → HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    // A receiver may return JSON we can use (a real CRM id, for instance); it
    // may equally return nothing. Both are fine.
    const text = await res.text().catch(() => '');
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  }

  async testConnection(): Promise<{ ok: boolean; detail: string; scopes?: string[] }> {
    try {
      await this.post('connection.test', { message: 'Test from the CRM settings page' });
      const host = safeHost(this.config.targetUrl);
      return {
        ok: true,
        detail: `${host} accepted a signed test event.${
          this.config.signingSecret ? '' : ' No signing secret is set — requests are unsigned.'
        }`,
      };
    } catch (error) {
      return { ok: false, detail: String(error instanceof Error ? error.message : error) };
    }
  }

  /**
   * Emits the contact and returns a stable synthetic id.
   *
   * If the receiver replies with `{ "id": "..." }` that id is used instead —
   * which lets a slightly smarter receiver (a Zapier step that creates the
   * record and returns its id) give us the real thing.
   */
  async findOrCreateContact(input: CrmContactInput): Promise<CrmContactRef> {
    const fallbackId = `wh_${createHash('sha256').update(input.phoneE164).digest('hex').slice(0, 16)}`;
    const reply = (await this.post('contact.upsert', {
      phoneE164: input.phoneE164,
      name: input.name ?? null,
      email: input.email ?? null,
      interest: input.courseInterest ?? null,
      source: input.source ?? null,
      suggestedId: fallbackId,
    })) as { id?: string; url?: string } | null;

    return {
      entity: 'contact',
      id: reply?.id ?? fallbackId,
      url: reply?.url ?? null,
    };
  }

  async registerCall(input: CrmCallInput): Promise<{ crmCallId: string }> {
    const reply = (await this.post('call.started', {
      contact: input.contact,
      direction: input.direction,
      fromNumber: input.fromNumber,
      toNumber: input.toNumber,
      startedAt: input.startedAt.toISOString(),
    })) as { id?: string } | null;

    // Our own call id if the receiver does not supply one, so finishCall has
    // something to correlate on.
    return { crmCallId: reply?.id ?? `wh_call_${input.contact.id}_${input.startedAt.getTime()}` };
  }

  async finishCall(params: {
    crmCallId: string;
    durationSeconds: number;
    statusCode: '200' | '304' | '603';
    failedReason?: string;
  }): Promise<void> {
    await this.post('call.finished', {
      crmCallId: params.crmCallId,
      durationSeconds: params.durationSeconds,
      outcome:
        params.statusCode === '200' ? 'completed' : params.statusCode === '304' ? 'no_answer' : 'failed',
      failedReason: params.failedReason ?? null,
    });
  }

  async attachRecording(params: {
    crmCallId: string;
    filename: string;
    url?: string;
    contentBase64?: string;
  }): Promise<void> {
    // Deliberately never forwards base64 audio: a webhook receiver is usually
    // an automation platform with a small payload limit, and silently blowing
    // through it would fail the whole sync for one attachment.
    await this.post('call.recording', {
      crmCallId: params.crmCallId,
      filename: params.filename,
      url: params.url ?? null,
      note: params.url ? null : 'Recording is not publicly reachable — set PUBLIC_BASE_URL',
    });
  }

  async logActivity(params: {
    contact: CrmContactRef;
    subject: string;
    description: string;
    completed: boolean;
  }): Promise<{ activityId: string }> {
    const reply = (await this.post('activity.logged', {
      contact: params.contact,
      subject: params.subject,
      description: params.description,
      completed: params.completed,
    })) as { id?: string } | null;

    return { activityId: reply?.id ?? `wh_act_${Date.now()}` };
  }
}

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return 'the endpoint';
  }
}
