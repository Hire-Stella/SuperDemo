import { Logger } from '@nestjs/common';
import type {
  CrmCallInput,
  CrmContactInput,
  CrmContactRef,
  CrmProvider,
} from '@fit-ai/contracts';

interface BitrixEnvelope<T> {
  result?: T;
  error?: string;
  error_description?: string;
  time?: { finish: number };
}

/**
 * Bitrix24 via an inbound webhook.
 *
 * An inbound webhook is enough for everything v1 needs — contacts, leads,
 * activities, and the whole `telephony.externalcall.*` sequence — and it takes
 * the client two minutes to create, with no marketplace app review.
 *
 * The closing move of the demo lives here: register → finish → attachRecord puts
 * our AI calls, with recordings and transcripts, straight onto the lead's Bitrix
 * timeline. Their team keeps working in the CRM they already use.
 *
 * Known limitation, stated rather than hidden: `imconnector.*` (pushing chat
 * into Bitrix Open Channels) only works in *application* context, so WhatsApp
 * threads cannot be pushed to Bitrix through a webhook. See NOT-IMPLEMENTED.md.
 *
 * Takes its webhook URL as a constructor argument rather than reading env,
 * because the URL is now per centre: one client is on Bitrix, another on Zoho,
 * and CrmResolver builds one of these per configured tenant.
 */
export class BitrixCrm implements CrmProvider {
  readonly name = 'bitrix';
  /** telephony.externalcall.register shows the call while it is ringing. */
  readonly supportsLiveCall = true;
  private readonly log = new Logger(BitrixCrm.name);
  private readonly base: string;
  private readonly webhookUrl: string;

  constructor(config: { webhookUrl: string }) {
    this.webhookUrl = config.webhookUrl;
    // Normalise to exactly one trailing slash so method concatenation is safe.
    this.base = this.webhookUrl.replace(/\/+$/, '') + '/';
  }

  /** `https://portal.bitrix24.ae/rest/1/token/` → `https://portal.bitrix24.ae` */
  get portalUrl(): string | null {
    if (!this.webhookUrl) return null;
    try {
      return new URL(this.webhookUrl).origin;
    } catch {
      return null;
    }
  }

  private async call<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    if (!this.webhookUrl) {
      throw new Error('No Bitrix webhook URL configured for this centre');
    }

    const res = await fetch(`${this.base}${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(15_000),
    });

    const text = await res.text();
    let body: BitrixEnvelope<T>;
    try {
      body = JSON.parse(text) as BitrixEnvelope<T>;
    } catch {
      throw new Error(`Bitrix ${method} returned non-JSON (HTTP ${res.status}): ${text.slice(0, 200)}`);
    }

    if (body.error) {
      // Bitrix returns 200 with an error body, so status alone is not enough.
      throw new Error(`Bitrix ${method} failed: ${body.error} — ${body.error_description ?? ''}`);
    }
    if (!res.ok) {
      throw new Error(`Bitrix ${method} HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    return body.result as T;
  }

  async testConnection(): Promise<{ ok: boolean; detail: string; scopes?: string[] }> {
    try {
      const scopes = await this.call<string[]>('scope');
      const required = ['crm', 'telephony'];
      const missing = required.filter((s) => !scopes.includes(s));

      if (missing.length) {
        return {
          ok: false,
          detail:
            `Connected, but the webhook is missing required scope(s): ${missing.join(', ')}. ` +
            `Edit the webhook in Bitrix24 and tick CRM and Telephony.`,
          scopes,
        };
      }
      return { ok: true, detail: `Connected to ${this.portalUrl ?? 'Bitrix24'}.`, scopes };
    } catch (error) {
      return { ok: false, detail: String(error) };
    }
  }

  /**
   * Match on phone, create a lead when unknown.
   *
   * Contacts are checked before leads because an existing student should attach
   * to their contact record, not spawn a duplicate lead every time they call.
   */
  async findOrCreateContact(input: CrmContactInput): Promise<CrmContactRef> {
    const phone = input.phoneE164;

    const contacts = await this.call<{ ID: string }[]>('crm.contact.list', {
      filter: { PHONE: phone },
      select: ['ID'],
    });
    if (contacts?.length) {
      return { entity: 'contact', id: contacts[0]!.ID, url: this.entityUrl('contact', contacts[0]!.ID) };
    }

    const leads = await this.call<{ ID: string }[]>('crm.lead.list', {
      filter: { PHONE: phone },
      select: ['ID'],
    });
    if (leads?.length) {
      return { entity: 'lead', id: leads[0]!.ID, url: this.entityUrl('lead', leads[0]!.ID) };
    }

    const leadId = await this.call<number>('crm.lead.add', {
      fields: {
        TITLE: input.name
          ? `${input.name} — enquiry via AI assistant`
          : `Inbound enquiry ${phone}`,
        NAME: input.name ?? undefined,
        PHONE: [{ VALUE: phone, VALUE_TYPE: 'WORK' }],
        EMAIL: input.email ? [{ VALUE: input.email, VALUE_TYPE: 'WORK' }] : undefined,
        COMMENTS: input.courseInterest ? `Interested in: ${input.courseInterest}` : undefined,
        SOURCE_DESCRIPTION: input.source ?? 'AI contact centre',
        OPENED: 'Y',
      },
      params: { REGISTER_SONET_EVENT: 'Y' },
    });

    this.log.log(`Created Bitrix lead ${leadId} for ${phone}`);
    return { entity: 'lead', id: String(leadId), url: this.entityUrl('lead', String(leadId)) };
  }

  /** telephony.externalcall.register */
  async registerCall(input: CrmCallInput): Promise<{ crmCallId: string }> {
    const result = await this.call<{ CALL_ID: string }>('telephony.externalcall.register', {
      USER_PHONE_INNER: undefined,
      USER_ID: input.agentBitrixUserId ?? 1,
      PHONE_NUMBER: input.direction === 'INBOUND' ? input.fromNumber : input.toNumber,
      // 1 = outgoing, 2 = incoming, per the Bitrix telephony API.
      TYPE: input.direction === 'INBOUND' ? 2 : 1,
      CALL_START_DATE: input.startedAt.toISOString(),
      CRM_CREATE: 'N',
      CRM_ENTITY_TYPE: input.contact.entity === 'lead' ? 'LEAD' : 'CONTACT',
      CRM_ENTITY_ID: input.contact.id,
      SHOW: 'N',
      LINE_NUMBER: input.toNumber,
    });

    return { crmCallId: result.CALL_ID };
  }

  /** telephony.externalcall.finish */
  async finishCall(params: {
    crmCallId: string;
    durationSeconds: number;
    statusCode: '200' | '304' | '603';
    failedReason?: string;
  }): Promise<void> {
    await this.call('telephony.externalcall.finish', {
      CALL_ID: params.crmCallId,
      USER_ID: 1,
      DURATION: params.durationSeconds,
      STATUS_CODE: params.statusCode,
      FAILED_REASON: params.failedReason,
      ADD_TO_CHAT: 'N',
    });
  }

  /** telephony.externalcall.attachRecord */
  async attachRecording(params: {
    crmCallId: string;
    filename: string;
    url?: string;
    contentBase64?: string;
  }): Promise<void> {
    if (!params.url && !params.contentBase64) {
      throw new Error('attachRecording requires either a url or base64 content');
    }
    await this.call('telephony.externalcall.attachRecord', {
      CALL_ID: params.crmCallId,
      FILENAME: params.filename,
      // Bitrix accepts either a reachable URL or inline base64. Local demo
      // recordings are not publicly reachable, so base64 is the working path.
      FILE_CONTENT: params.contentBase64,
      RECORD_URL: params.url,
    });
  }

  /** crm.activity.add — the AI transcript and summary on the timeline. */
  async logActivity(params: {
    contact: CrmContactRef;
    subject: string;
    description: string;
    completed: boolean;
  }): Promise<{ activityId: string }> {
    const ownerTypeId = params.contact.entity === 'lead' ? 1 : 3; // 1=LEAD, 3=CONTACT
    const id = await this.call<number>('crm.activity.add', {
      fields: {
        OWNER_TYPE_ID: ownerTypeId,
        OWNER_ID: params.contact.id,
        TYPE_ID: 2, // call
        SUBJECT: params.subject,
        DESCRIPTION: params.description,
        DESCRIPTION_TYPE: 1, // plain text
        DIRECTION: 2, // incoming
        COMPLETED: params.completed ? 'Y' : 'N',
        RESPONSIBLE_ID: 1,
        START_TIME: new Date().toISOString(),
        COMMUNICATIONS: [{ VALUE: 'unknown', ENTITY_ID: params.contact.id, ENTITY_TYPE_ID: ownerTypeId }],
      },
    });
    return { activityId: String(id) };
  }

  private entityUrl(entity: 'lead' | 'contact', id: string): string | null {
    const portal = this.portalUrl;
    return portal ? `${portal}/crm/${entity}/details/${id}/` : null;
  }
}
