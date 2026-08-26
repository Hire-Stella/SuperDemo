import { Injectable, Logger } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import type {
  CrmCallInput,
  CrmContactInput,
  CrmContactRef,
  CrmProvider,
} from '@fit-ai/contracts';

/**
 * Mock CRM — the default, so the platform runs with no Bitrix portal attached.
 *
 * It behaves like a real CRM in the ways that matter for exercising our code:
 * stable ids per phone number (so a repeat caller matches instead of creating a
 * duplicate), a small artificial latency, and an occasional failure so the
 * outbox's retry path is genuinely exercised rather than assumed.
 */
@Injectable()
export class MockCrm implements CrmProvider {
  readonly name = 'mock';
  readonly portalUrl = 'https://mock.bitrix24.local';
  /** The mock mimics Bitrix, which does support it. */
  readonly supportsLiveCall = true;

  private readonly log = new Logger(MockCrm.name);
  private readonly contactsByPhone = new Map<string, CrmContactRef>();
  private readonly calls = new Map<string, { contact: CrmContactRef; finished: boolean }>();

  /** Set to 0 in tests; a small non-zero rate keeps the retry path honest. */
  private failureRate = 0.03;

  setFailureRate(rate: number): void {
    this.failureRate = Math.max(0, Math.min(1, rate));
  }

  private async simulate(label: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 60 + randomInt(0, 180)));
    if (Math.random() < this.failureRate) {
      throw new Error(`Mock CRM transient failure on ${label} (simulated)`);
    }
  }

  async testConnection(): Promise<{ ok: boolean; detail: string; scopes?: string[] }> {
    return {
      ok: true,
      detail:
        'Mock CRM driver — no real Bitrix24 portal is connected. Set CRM_DRIVER=bitrix and ' +
        'BITRIX_WEBHOOK_URL to sync for real.',
      scopes: ['crm', 'telephony'],
    };
  }

  async findOrCreateContact(input: CrmContactInput): Promise<CrmContactRef> {
    await this.simulate('findOrCreateContact');

    const existing = this.contactsByPhone.get(input.phoneE164);
    if (existing) return existing;

    const id = String(randomInt(1000, 99999));
    const ref: CrmContactRef = {
      entity: 'lead',
      id,
      url: `${this.portalUrl}/crm/lead/details/${id}/`,
    };
    this.contactsByPhone.set(input.phoneE164, ref);
    this.log.debug(`mock lead ${id} for ${input.phoneE164}`);
    return ref;
  }

  async registerCall(input: CrmCallInput): Promise<{ crmCallId: string }> {
    await this.simulate('registerCall');
    const crmCallId = `mockcall-${input.providerCallId}`;
    this.calls.set(crmCallId, { contact: input.contact, finished: false });
    return { crmCallId };
  }

  async finishCall(params: { crmCallId: string }): Promise<void> {
    await this.simulate('finishCall');
    const entry = this.calls.get(params.crmCallId);
    if (entry) entry.finished = true;
  }

  async attachRecording(params: { crmCallId: string; filename: string }): Promise<void> {
    await this.simulate('attachRecording');
    this.log.debug(`mock recording attached to ${params.crmCallId}: ${params.filename}`);
  }

  async logActivity(params: {
    contact: CrmContactRef;
    subject: string;
  }): Promise<{ activityId: string }> {
    await this.simulate('logActivity');
    this.log.debug(`mock activity on ${params.contact.entity} ${params.contact.id}: ${params.subject}`);
    return { activityId: String(randomInt(10000, 999999)) };
  }
}
