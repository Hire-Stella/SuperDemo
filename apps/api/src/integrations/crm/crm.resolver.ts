import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import {
  CrmConfig,
  type ApiEnv,
  type CrmConfigView,
  type CrmDriver,
  type CrmProvider,
  type ZohoRegion,
} from '@fit-ai/contracts';
import { Prisma } from '@fit-ai/db';
import { ENV } from '../../config/config.module';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../tenancy/tenant-context.service';
import { decryptSecret, encryptSecret, fingerprint } from '../../shared/secret-box';
import { MockCrm } from './mock.crm';
import { BitrixCrm } from './bitrix.crm';
import { ZohoCrm } from './zoho.crm';
import { HubSpotCrm } from './hubspot.crm';
import { WebhookCrm } from './webhook.crm';

/**
 * Which CRM a given centre syncs to.
 *
 * One deployment hosts several clients and they do not share a CRM — a clinic on
 * HubSpot and a training institute on Bitrix is the normal case. So the provider
 * is resolved per organisation from its own settings row instead of once at boot
 * from CRM_DRIVER, and a centre that has chosen nothing inherits that default.
 *
 * Storage is deliberately shapeless: non-secret fields in `crmPublic`, every
 * secret in one encrypted `crmSecretsEnc` blob. Adding the sixth provider is
 * then a case in two switch statements and a form field — no migration.
 *
 * Instances are cached per centre and invalidated by a fingerprint of the stored
 * config, so new credentials take effect without a restart while a HubSpot or
 * Zoho token is still reused across calls rather than re-fetched per request.
 */
@Injectable()
export class CrmResolver {
  private readonly log = new Logger(CrmResolver.name);
  private readonly cache = new Map<string, { fp: string; provider: CrmProvider }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantContext,
    private readonly mock: MockCrm,
    @Inject(ENV) private readonly env: ApiEnv,
  ) {}

  /** The provider for the org in context, or for an explicit one. */
  async forOrg(orgId?: string | null): Promise<CrmProvider> {
    const id = orgId ?? this.tenants.orgId();

    // No tenant means a system path (the outbox drainer between jobs, a test).
    // The deployment default is the only sane answer, and it is what the
    // single-tenant version did.
    if (!id) return this.deploymentDefault();

    const setting = await this.prisma.setting.findFirst({
      where: { orgId: id },
      select: { crmProvider: true, crmPublic: true, crmSecretsEnc: true },
    });
    if (!setting?.crmProvider) return this.deploymentDefault();

    const fp = fingerprint(
      [setting.crmProvider, JSON.stringify(setting.crmPublic ?? {}), setting.crmSecretsEnc].join('|'),
    );
    const cached = this.cache.get(id);
    if (cached?.fp === fp) return cached.provider;

    let provider: CrmProvider;
    try {
      provider = this.build(setting.crmProvider as CrmDriver, setting.crmPublic, setting.crmSecretsEnc);
    } catch (error) {
      // A centre with broken credentials must not take down its call flow: the
      // sync fails into the outbox's dead letters, which is visible on their own
      // settings page, while calls keep being answered.
      this.log.error(
        `CRM config for org ${id} is unusable (${String(error)}) — falling back to the deployment default`,
      );
      return this.deploymentDefault();
    }

    this.cache.set(id, { fp, provider });
    return provider;
  }

  private build(
    provider: CrmDriver,
    publicBits: unknown,
    secretsEnc: string | null,
  ): CrmProvider {
    const pub = (publicBits ?? {}) as Record<string, string | undefined>;
    const secrets = secretsEnc
      ? (JSON.parse(decryptSecret(secretsEnc, this.env.CRM_SECRET_KEY ?? '')) as Record<
          string,
          string | undefined
        >)
      : {};

    switch (provider) {
      case 'bitrix': {
        if (!secrets.webhookUrl) throw new Error('no Bitrix webhook URL stored');
        return new BitrixCrm({ webhookUrl: secrets.webhookUrl });
      }
      case 'zoho': {
        if (!pub.clientId || !secrets.clientSecret || !secrets.refreshToken) {
          throw new Error('incomplete Zoho credentials');
        }
        return new ZohoCrm({
          provider: 'zoho',
          region: (pub.region ?? 'com') as ZohoRegion,
          clientId: pub.clientId,
          clientSecret: secrets.clientSecret,
          refreshToken: secrets.refreshToken,
        });
      }
      case 'hubspot': {
        if (!secrets.accessToken) throw new Error('no HubSpot token stored');
        return new HubSpotCrm({ provider: 'hubspot', accessToken: secrets.accessToken });
      }
      case 'webhook': {
        if (!secrets.targetUrl) throw new Error('no webhook target URL stored');
        return new WebhookCrm({
          provider: 'webhook',
          targetUrl: secrets.targetUrl,
          signingSecret: secrets.signingSecret,
        });
      }
      default:
        return this.mock;
    }
  }

  /** CRM_DRIVER, for centres that have not chosen for themselves. */
  private deploymentDefault(): CrmProvider {
    if (this.env.CRM_DRIVER === 'bitrix' && this.env.BITRIX_WEBHOOK_URL) {
      return new BitrixCrm({ webhookUrl: this.env.BITRIX_WEBHOOK_URL });
    }
    return this.mock;
  }

  /* ------------------------------- writing -------------------------------- */

  /**
   * Save a centre's CRM configuration.
   *
   * Splitting secret from non-secret happens here, in one place, so a credential
   * can only reach the database through a function that cannot run without an
   * encryption key.
   */
  async save(orgId: string, config: CrmConfig): Promise<void> {
    const parsed = CrmConfig.parse(config);
    const key = this.env.CRM_SECRET_KEY ?? '';

    if (parsed.provider !== 'mock' && !key) {
      // Better a clear refusal than quietly storing a client's CRM credential
      // in plaintext because an env var was missing.
      throw new BadRequestException(
        'CRM_SECRET_KEY is not set on this deployment, so credentials cannot be stored securely. Set it and retry.',
      );
    }

    let publicBits: Record<string, string> = {};
    let secrets: Record<string, string> = {};

    switch (parsed.provider) {
      case 'bitrix':
        publicBits = { portalUrl: safeOrigin(parsed.webhookUrl) ?? '' };
        secrets = { webhookUrl: parsed.webhookUrl };
        break;
      case 'zoho':
        publicBits = { region: parsed.region, clientId: parsed.clientId };
        secrets = { clientSecret: parsed.clientSecret, refreshToken: parsed.refreshToken };
        break;
      case 'hubspot':
        secrets = { accessToken: parsed.accessToken };
        break;
      case 'webhook':
        // The host is public so the settings page can show where posts go; the
        // full URL is a secret because it often carries a token in its path.
        publicBits = { targetHost: safeHost(parsed.targetUrl) ?? '' };
        secrets = {
          targetUrl: parsed.targetUrl,
          ...(parsed.signingSecret ? { signingSecret: parsed.signingSecret } : {}),
        };
        break;
      case 'mock':
        break;
    }

    await this.prisma.setting.update({
      where: { orgId },
      data: {
        crmProvider: parsed.provider,
        crmPublic: publicBits,
        crmSecretsEnc: Object.keys(secrets).length
          ? encryptSecret(JSON.stringify(secrets), key)
          : null,
        crmUpdatedAt: new Date(),
        // Kept in step so the inbox can still deep-link Bitrix records.
        bitrixPortalUrl: parsed.provider === 'bitrix' ? safeOrigin(parsed.webhookUrl) : null,
      },
    });

    this.cache.delete(orgId);
    this.log.log(`CRM for org ${orgId} set to ${parsed.provider}`);
  }

  /** What the settings page may see: shape and status, never the secrets. */
  async view(orgId: string): Promise<CrmConfigView | null> {
    const s = await this.prisma.setting.findFirst({
      where: { orgId },
      select: {
        crmProvider: true,
        crmPublic: true,
        crmSecretsEnc: true,
        crmUpdatedAt: true,
        bitrixPortalUrl: true,
      },
    });
    if (!s) return null;

    const configured = Boolean(s.crmProvider);
    const provider = (configured ? s.crmProvider : this.env.CRM_DRIVER) as CrmDriver;
    const pub = (s.crmPublic ?? {}) as Record<string, string | undefined>;

    // Which secrets exist is derived by decrypting rather than tracked
    // separately, so the flags cannot drift out of step with what is stored.
    let held: string[] = [];
    if (s.crmSecretsEnc) {
      try {
        held = Object.keys(
          JSON.parse(decryptSecret(s.crmSecretsEnc, this.env.CRM_SECRET_KEY ?? '')) as object,
        );
      } catch {
        // Undecryptable (the key changed) — report nothing held rather than
        // claiming credentials that can no longer be used.
        this.log.warn(`Stored CRM secrets for org ${orgId} cannot be decrypted`);
      }
    }

    return {
      provider,
      configured,
      portalUrl: pub.portalUrl || s.bitrixPortalUrl || null,
      region: (pub.region as ZohoRegion | undefined) ?? null,
      clientId: pub.clientId ?? null,
      targetHost: pub.targetHost ?? null,
      supportsLiveCall: provider === 'bitrix' || provider === 'hubspot' || provider === 'mock',
      hasSecret: held.includes('clientSecret'),
      hasRefreshToken: held.includes('refreshToken'),
      hasWebhookUrl: held.includes('webhookUrl'),
      hasAccessToken: held.includes('accessToken'),
      hasSigningSecret: held.includes('signingSecret'),
      updatedAt: s.crmUpdatedAt,
    };
  }

  /** Drop a centre's configuration and go back to the deployment default. */
  async clear(orgId: string): Promise<void> {
    await this.prisma.setting.update({
      where: { orgId },
      data: {
        crmProvider: '',
        // Prisma distinguishes "JSON null" from "SQL NULL" on a Json column, and
        // only the sentinel means the latter.
        crmPublic: Prisma.DbNull,
        crmSecretsEnc: null,
        crmUpdatedAt: new Date(),
      },
    });
    this.cache.delete(orgId);
  }
}

function safeOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}
