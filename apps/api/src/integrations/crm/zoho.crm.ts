import { Logger } from '@nestjs/common';
import {
  ZOHO_HOSTS,
  type CrmCallInput,
  type CrmContactInput,
  type CrmContactRef,
  type CrmProvider,
  type ZohoCrmConfig,
} from '@fit-ai/contracts';

interface ZohoRecord {
  id: string;
  [key: string]: unknown;
}

interface ZohoWriteResponse {
  data?: { code?: string; message?: string; details?: { id?: string } }[];
}

/**
 * Zoho CRM via OAuth refresh token.
 *
 * Not a DI singleton like the Bitrix driver was: credentials are per centre, so
 * one instance is constructed per configured tenant and cached by CrmResolver.
 * That is the whole reason this class takes a config object instead of reading
 * env.
 *
 * Where it differs from Bitrix, and why:
 *
 *  * **Access tokens expire (1 hour).** Zoho issues them from a long-lived
 *    refresh token, so this caches one in memory with a safety margin rather
 *    than minting one per request — Zoho rate-limits token endpoints hard
 *    enough that per-request refreshing will get a busy tenant throttled.
 *  * **There is no live-call API.** Bitrix has `telephony.externalcall.*`, which
 *    shows a call in progress. Zoho's Calls module records calls that already
 *    happened, so `registerCall` creates the record and `finishCall` completes
 *    it with the duration. A call therefore appears on the Zoho timeline at the
 *    end rather than as it rings — a real difference in behaviour between the
 *    two CRMs, not something to paper over.
 *  * **Recordings cannot be attached to a Call.** Zoho's Attachments API does
 *    not accept a Call parent, so the recording is added as a Note on the
 *    contact with its URL. See NOT-IMPLEMENTED.md.
 */
export class ZohoCrm implements CrmProvider {
  readonly name = 'zoho';
  /** Zoho's Calls module records finished calls, so no live visibility. */
  readonly supportsLiveCall = false;
  private readonly log = new Logger(ZohoCrm.name);

  private accessToken: string | null = null;
  private expiresAt = 0;

  constructor(private readonly config: ZohoCrmConfig) {}

  private get hosts() {
    return ZOHO_HOSTS[this.config.region];
  }

  /** Zoho's web UI, so a synced record can be linked from our inbox. */
  get portalUrl(): string | null {
    const suffix = this.config.region === 'ca' ? 'zohocloud.ca' : `zoho.${this.config.region}`;
    return `https://crm.${suffix}`;
  }

  private async token(): Promise<string> {
    // 60s of slack: a token that expires mid-request is indistinguishable from
    // bad credentials from the caller's point of view.
    if (this.accessToken && Date.now() < this.expiresAt - 60_000) return this.accessToken;

    const params = new URLSearchParams({
      refresh_token: this.config.refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: 'refresh_token',
    });

    const res = await fetch(`${this.hosts.accounts}/oauth/v2/token?${params}`, {
      method: 'POST',
      signal: AbortSignal.timeout(15_000),
    });
    const body = (await res.json().catch(() => ({}))) as {
      access_token?: string;
      expires_in?: number;
      error?: string;
    };

    if (!res.ok || body.error || !body.access_token) {
      // `invalid_client` here almost always means the credentials were minted in
      // a different Zoho region, which is why the region is part of the config.
      throw new Error(
        `Zoho token refresh failed: ${body.error ?? `HTTP ${res.status}`}. ` +
          `Check the client ID, secret, refresh token and that the region is ${this.config.region}.`,
      );
    }

    this.accessToken = body.access_token;
    this.expiresAt = Date.now() + (body.expires_in ?? 3600) * 1000;
    return this.accessToken;
  }

  private async call<T>(
    method: 'GET' | 'POST' | 'PUT',
    path: string,
    body?: unknown,
  ): Promise<T> {
    const token = await this.token();
    const res = await fetch(`${this.hosts.api}/crm/v2${path}`, {
      method,
      headers: {
        authorization: `Zoho-oauthtoken ${token}`,
        ...(body ? { 'content-type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20_000),
    });

    // 204 is Zoho's "found nothing", which is a valid search result.
    if (res.status === 204) return undefined as T;

    const text = await res.text();
    let parsed: unknown;
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`Zoho ${path} returned non-JSON (HTTP ${res.status}): ${text.slice(0, 200)}`);
    }

    if (!res.ok) {
      const err = parsed as { code?: string; message?: string };
      throw new Error(
        `Zoho ${path} HTTP ${res.status}: ${err.code ?? ''} ${err.message ?? text.slice(0, 200)}`,
      );
    }
    return parsed as T;
  }

  /** Zoho reports per-record success inside a 200 response. */
  private idFrom(response: ZohoWriteResponse, what: string): string {
    const row = response.data?.[0];
    if (!row || (row.code && row.code !== 'SUCCESS')) {
      throw new Error(`Zoho ${what} failed: ${row?.code ?? 'unknown'} — ${row?.message ?? ''}`);
    }
    const id = row.details?.id;
    if (!id) throw new Error(`Zoho ${what} returned no id`);
    return id;
  }

  async testConnection(): Promise<{ ok: boolean; detail: string; scopes?: string[] }> {
    try {
      // Cheap and read-only, and it fails distinctly on a missing CRM scope.
      const res = await this.call<{ users?: { full_name?: string }[] }>(
        'GET',
        '/users?type=CurrentUser',
      );
      const who = res?.users?.[0]?.full_name;
      return {
        ok: true,
        detail: `Connected to Zoho CRM (${this.config.region})${who ? ` as ${who}` : ''}.`,
      };
    } catch (error) {
      return { ok: false, detail: String(error instanceof Error ? error.message : error) };
    }
  }

  async findOrCreateContact(input: CrmContactInput): Promise<CrmContactRef> {
    const phone = encodeURIComponent(input.phoneE164);

    // Contacts before Leads, same rule as Bitrix: an existing customer should
    // attach to their contact, not spawn a duplicate lead on every call.
    const contact = await this.call<{ data?: ZohoRecord[] }>(
      'GET',
      `/Contacts/search?phone=${phone}`,
    );
    if (contact?.data?.length) {
      const id = contact.data[0]!.id;
      return { entity: 'contact', id, url: this.entityUrl('Contacts', id) };
    }

    const lead = await this.call<{ data?: ZohoRecord[] }>('GET', `/Leads/search?phone=${phone}`);
    if (lead?.data?.length) {
      const id = lead.data[0]!.id;
      return { entity: 'lead', id, url: this.entityUrl('Leads', id) };
    }

    // Last_Name is Zoho's only mandatory Lead field, so it must never be empty.
    const [first, ...rest] = (input.name ?? '').trim().split(/\s+/).filter(Boolean);
    const created = await this.call<ZohoWriteResponse>('POST', '/Leads', {
      data: [
        {
          Last_Name: rest.length ? rest.join(' ') : (first ?? input.phoneE164),
          First_Name: rest.length ? first : undefined,
          Phone: input.phoneE164,
          Email: input.email ?? undefined,
          Lead_Source: input.source ?? 'AI contact centre',
          Description: input.courseInterest ? `Interested in: ${input.courseInterest}` : undefined,
        },
      ],
      trigger: [],
    });

    const id = this.idFrom(created, 'lead create');
    this.log.log(`Created Zoho lead ${id} for ${input.phoneE164}`);
    return { entity: 'lead', id, url: this.entityUrl('Leads', id) };
  }

  /**
   * Zoho has no "call in progress" concept, so this opens the Call record that
   * finishCall will complete. Duration is mandatory on create, hence the 0.
   */
  async registerCall(input: CrmCallInput): Promise<{ crmCallId: string }> {
    const created = await this.call<ZohoWriteResponse>('POST', '/Calls', {
      data: [
        {
          Subject: `${input.direction === 'INBOUND' ? 'Inbound' : 'Outbound'} call — AI assistant`,
          Call_Type: input.direction === 'INBOUND' ? 'Inbound' : 'Outbound',
          Call_Start_Time: input.startedAt.toISOString(),
          Call_Duration: '00:00',
          Who_Id: input.contact.entity === 'contact' ? { id: input.contact.id } : undefined,
          $se_module: input.contact.entity === 'lead' ? 'Leads' : undefined,
          What_Id: input.contact.entity === 'lead' ? { id: input.contact.id } : undefined,
          Description: `Placed via the AI contact centre. Line ${input.toNumber}.`,
        },
      ],
    });
    return { crmCallId: this.idFrom(created, 'call create') };
  }

  async finishCall(params: {
    crmCallId: string;
    durationSeconds: number;
    statusCode: '200' | '304' | '603';
    failedReason?: string;
  }): Promise<void> {
    // Zoho wants mm:ss, and rejects a bare number of seconds.
    const mm = Math.floor(params.durationSeconds / 60);
    const ss = params.durationSeconds % 60;
    const outcome =
      params.statusCode === '200'
        ? 'Completed'
        : params.statusCode === '304'
          ? 'Not answered'
          : 'Failed';

    await this.call('PUT', '/Calls', {
      data: [
        {
          id: params.crmCallId,
          Call_Duration: `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`,
          Call_Result: params.failedReason ? `${outcome} — ${params.failedReason}` : outcome,
        },
      ],
    });
  }

  /**
   * A Note on the contact, not an attachment on the Call — Zoho's Attachments
   * API has no Calls parent. The recording stays in our storage and the CRM
   * gets a link, which also avoids duplicating audio into a client's Zoho quota.
   */
  async attachRecording(params: {
    crmCallId: string;
    filename: string;
    url?: string;
    contentBase64?: string;
  }): Promise<void> {
    if (!params.url) {
      // Refusing beats silently dropping it: base64 would need an attachment
      // parent Zoho will not give us for a Call.
      throw new Error(
        'Zoho needs a reachable recording URL — set PUBLIC_BASE_URL so recordings can be linked',
      );
    }
    await this.call('POST', '/Calls/' + params.crmCallId + '/Notes', {
      data: [
        {
          Note_Title: 'Call recording',
          Note_Content: `${params.filename}: ${params.url}`,
        },
      ],
    });
  }

  async logActivity(params: {
    contact: CrmContactRef;
    subject: string;
    description: string;
    completed: boolean;
  }): Promise<{ activityId: string }> {
    const module = params.contact.entity === 'lead' ? 'Leads' : 'Contacts';
    const created = await this.call<ZohoWriteResponse>(
      'POST',
      `/${module}/${params.contact.id}/Notes`,
      {
        data: [
          {
            Note_Title: params.subject,
            // Zoho caps note content; the transcript can exceed it, so it is
            // trimmed here rather than having the whole sync fail on a long call.
            Note_Content: params.description.slice(0, 32000),
          },
        ],
      },
    );
    return { activityId: this.idFrom(created, 'note create') };
  }

  private entityUrl(module: 'Leads' | 'Contacts', id: string): string | null {
    const portal = this.portalUrl;
    return portal ? `${portal}/crm/tab/${module}/${id}` : null;
  }
}
