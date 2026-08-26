import { Logger } from '@nestjs/common';
import type {
  CrmCallInput,
  CrmContactInput,
  CrmContactRef,
  CrmProvider,
  HubSpotCrmConfig,
} from '@fit-ai/contracts';

/**
 * HubSpot CRM via a private app token.
 *
 * A private app rather than OAuth: OAuth needs a listed app and a redirect flow,
 * which is the right answer if we ever publish to HubSpot's marketplace and the
 * wrong answer for a client who just wants their own portal connected in two
 * minutes. The token is a bearer credential, so it is stored encrypted like the
 * rest.
 *
 * Two HubSpot-specific things shape this driver:
 *
 *  * **Everyone is a Contact.** HubSpot's Leads object is recent and not enabled
 *    on every portal, so callers map to Contacts. `CrmContactRef.entity` is
 *    therefore always `contact` here, unlike Bitrix and Zoho which distinguish
 *    lead from contact.
 *  * **Associations are typed by numeric id.** Linking a Call to a Contact is
 *    type 194, a Note to a Contact is 202. These are HubSpot's own defined ids;
 *    getting one wrong creates an orphaned record that silently never appears on
 *    the timeline, which is why they are named constants below rather than
 *    inline magic numbers.
 */

/** HUBSPOT_DEFINED association type ids. */
const ASSOC_CALL_TO_CONTACT = 194;
const ASSOC_NOTE_TO_CONTACT = 202;

interface HsObject {
  id: string;
  properties?: Record<string, string | null>;
}

export class HubSpotCrm implements CrmProvider {
  readonly name = 'hubspot';
  /** `hs_call_status: IN_PROGRESS` shows the call while it is still running. */
  readonly supportsLiveCall = true;

  private readonly log = new Logger(HubSpotCrm.name);
  private portalId: string | null = null;

  constructor(private readonly config: HubSpotCrmConfig) {}

  /**
   * Deep links need the portal id, which only comes back from the API. Null
   * until testConnection or a sync has run, and the UI simply omits the link.
   */
  get portalUrl(): string | null {
    return this.portalId ? `https://app.hubspot.com/contacts/${this.portalId}` : null;
  }

  private async call<T>(
    method: 'GET' | 'POST' | 'PATCH',
    path: string,
    body?: unknown,
  ): Promise<T> {
    const res = await fetch(`https://api.hubapi.com${path}`, {
      method,
      headers: {
        authorization: `Bearer ${this.config.accessToken}`,
        ...(body ? { 'content-type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20_000),
    });

    const text = await res.text();
    let parsed: unknown = {};
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`HubSpot ${path} returned non-JSON (HTTP ${res.status}): ${text.slice(0, 200)}`);
    }

    if (!res.ok) {
      const err = parsed as { message?: string; category?: string };
      // MISSING_SCOPES is the common setup mistake, and its message names the
      // scope that is missing — so pass it through rather than summarising.
      throw new Error(
        `HubSpot ${path} HTTP ${res.status}: ${err.category ?? ''} ${err.message ?? text.slice(0, 200)}`,
      );
    }
    return parsed as T;
  }

  async testConnection(): Promise<{ ok: boolean; detail: string; scopes?: string[] }> {
    try {
      const info = await this.call<{ portalId?: number; timeZone?: string }>(
        'GET',
        '/account-info/v3/details',
      );
      if (info.portalId) this.portalId = String(info.portalId);

      // account-info succeeds on almost any token, so prove the CRM scopes too.
      await this.call('GET', '/crm/v3/objects/contacts?limit=1');

      return {
        ok: true,
        detail: `Connected to HubSpot portal ${info.portalId ?? '(unknown)'}${
          info.timeZone ? ` · ${info.timeZone}` : ''
        }.`,
      };
    } catch (error) {
      return { ok: false, detail: String(error instanceof Error ? error.message : error) };
    }
  }

  async findOrCreateContact(input: CrmContactInput): Promise<CrmContactRef> {
    // Both properties, because a mobile-only contact is the normal case for an
    // inbound caller and HubSpot does not search across them implicitly.
    const search = await this.call<{ results?: HsObject[] }>(
      'POST',
      '/crm/v3/objects/contacts/search',
      {
        filterGroups: [
          { filters: [{ propertyName: 'phone', operator: 'EQ', value: input.phoneE164 }] },
          { filters: [{ propertyName: 'mobilephone', operator: 'EQ', value: input.phoneE164 }] },
        ],
        properties: ['phone', 'firstname', 'lastname'],
        limit: 1,
      },
    );

    if (search.results?.length) {
      const id = search.results[0]!.id;
      return { entity: 'contact', id, url: this.contactUrl(id) };
    }

    const [first, ...rest] = (input.name ?? '').trim().split(/\s+/).filter(Boolean);
    const created = await this.call<HsObject>('POST', '/crm/v3/objects/contacts', {
      properties: {
        phone: input.phoneE164,
        firstname: first ?? undefined,
        lastname: rest.length ? rest.join(' ') : undefined,
        email: input.email ?? undefined,
        hs_lead_status: 'NEW',
        lifecyclestage: 'lead',
        ...(input.courseInterest ? { hs_content_membership_notes: input.courseInterest } : {}),
      },
    });

    this.log.log(`Created HubSpot contact ${created.id} for ${input.phoneE164}`);
    return { entity: 'contact', id: created.id, url: this.contactUrl(created.id) };
  }

  async registerCall(input: CrmCallInput): Promise<{ crmCallId: string }> {
    const created = await this.call<HsObject>('POST', '/crm/v3/objects/calls', {
      properties: {
        hs_timestamp: input.startedAt.toISOString(),
        hs_call_title: `${input.direction === 'INBOUND' ? 'Inbound' : 'Outbound'} call — AI assistant`,
        hs_call_direction: input.direction === 'INBOUND' ? 'INBOUND' : 'OUTBOUND',
        hs_call_status: 'IN_PROGRESS',
        hs_call_from_number: input.fromNumber,
        hs_call_to_number: input.toNumber,
        hs_call_body: 'Answered by the AI contact centre.',
      },
      associations: [
        {
          to: { id: input.contact.id },
          types: [
            {
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId: ASSOC_CALL_TO_CONTACT,
            },
          ],
        },
      ],
    });
    return { crmCallId: created.id };
  }

  async finishCall(params: {
    crmCallId: string;
    durationSeconds: number;
    statusCode: '200' | '304' | '603';
    failedReason?: string;
  }): Promise<void> {
    const status =
      params.statusCode === '200' ? 'COMPLETED' : params.statusCode === '304' ? 'NO_ANSWER' : 'FAILED';

    await this.call('PATCH', `/crm/v3/objects/calls/${params.crmCallId}`, {
      properties: {
        hs_call_status: status,
        // HubSpot wants milliseconds, as a string.
        hs_call_duration: String(params.durationSeconds * 1000),
        ...(params.failedReason ? { hs_call_body: params.failedReason } : {}),
      },
    });
  }

  /**
   * HubSpot has a first-class recording field on the Call, so unlike Zoho this
   * is a genuine attachment rather than a note with a link. It must be a URL
   * HubSpot can reach, which is what PUBLIC_BASE_URL is for.
   */
  async attachRecording(params: {
    crmCallId: string;
    filename: string;
    url?: string;
    contentBase64?: string;
  }): Promise<void> {
    if (!params.url) {
      throw new Error(
        'HubSpot needs a reachable recording URL — set PUBLIC_BASE_URL so recordings can be linked',
      );
    }
    await this.call('PATCH', `/crm/v3/objects/calls/${params.crmCallId}`, {
      properties: { hs_call_recording_url: params.url },
    });
  }

  async logActivity(params: {
    contact: CrmContactRef;
    subject: string;
    description: string;
    completed: boolean;
  }): Promise<{ activityId: string }> {
    const created = await this.call<HsObject>('POST', '/crm/v3/objects/notes', {
      properties: {
        hs_timestamp: new Date().toISOString(),
        // One field, so the subject is prepended rather than lost.
        hs_note_body: `${params.subject}\n\n${params.description}`.slice(0, 65000),
      },
      associations: [
        {
          to: { id: params.contact.id },
          types: [
            {
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId: ASSOC_NOTE_TO_CONTACT,
            },
          ],
        },
      ],
    });
    return { activityId: created.id };
  }

  private contactUrl(id: string): string | null {
    return this.portalId ? `https://app.hubspot.com/contacts/${this.portalId}/contact/${id}` : null;
  }
}
