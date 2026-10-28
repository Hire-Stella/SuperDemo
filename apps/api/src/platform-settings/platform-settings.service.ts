import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import type { ApiEnv } from '@superdemo/contracts';
import { ENV } from '../config/config.module';
import { PrismaService } from '../prisma/prisma.service';
import { decryptSecret, encryptSecret } from '../shared/secret-box';

/** The one row's id. There is never a second. */
const ROW_ID = 'platform';

/**
 * The platform-wide Dograh, read and written.
 *
 * Every centre that has saved no Dograh of its own falls back to this, and only
 * then to the deployment's DOGRAH_BASE_URL / DOGRAH_API_KEY. It exists so a
 * platform operator can connect — and rotate — the shared voice host from the
 * platform page, without access to wherever the API is hosted.
 *
 * Read on every agent build, demo dial and inbox sync, so it is cached in
 * process for a minute rather than queried each time. A save clears the cache
 * at once, so the operator who just saved never sees the old value; a second
 * API replica would see it within the minute, which is the trade accepted.
 */
@Injectable()
export class PlatformSettingsService {
  private readonly log = new Logger(PlatformSettingsService.name);
  private static readonly TTL_MS = 60_000;

  private cache: { at: number; value: PlatformDograh } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: ApiEnv,
  ) {}

  /**
   * The stored host and decrypted key, each null when unset.
   *
   * Never throws for a key it cannot read: an undecryptable row (CRM_SECRET_KEY
   * changed since it was saved) is logged and treated as no key, so resolution
   * falls through to the environment rather than breaking every centre.
   */
  async dograh(): Promise<PlatformDograh> {
    if (this.cache && Date.now() - this.cache.at < PlatformSettingsService.TTL_MS) {
      return this.cache.value;
    }
    const row = await this.prisma.platformSetting.findUnique({ where: { id: ROW_ID } });
    let apiKey: string | null = null;
    if (row?.dograhApiKeyEnc) {
      try {
        apiKey = this.env.CRM_SECRET_KEY ? decryptSecret(row.dograhApiKeyEnc, this.env.CRM_SECRET_KEY) : null;
        if (!apiKey) this.log.warn('platform Dograh key is stored but CRM_SECRET_KEY is not set');
      } catch (e) {
        this.log.warn(
          `platform Dograh key could not be decrypted — was CRM_SECRET_KEY changed? ${
            e instanceof Error ? e.message : e
          }`,
        );
      }
    }
    const value: PlatformDograh = {
      baseUrl: row?.dograhBaseUrl?.trim() || null,
      apiKey,
      apiKeyLast4: row?.dograhApiKeyLast4 ?? null,
      updatedAt: row?.updatedAt ?? null,
    };
    this.cache = { at: Date.now(), value };
    return value;
  }

  /**
   * Save the host, and the key when one is given.
   *
   * `apiKey` omitted keeps the stored key, so the host can be corrected without
   * re-typing a credential. The key is encrypted with CRM_SECRET_KEY exactly as
   * a centre's own key is; without that secret there is nowhere safe to put it,
   * so the save is refused rather than stored in the clear.
   */
  async saveDograh(input: { baseUrl: string; apiKey?: string }, actorId: string | null): Promise<PlatformDograh> {
    const data: {
      dograhBaseUrl: string;
      updatedById: string | null;
      dograhApiKeyEnc?: string;
      dograhApiKeyLast4?: string;
    } = { dograhBaseUrl: input.baseUrl.trim().replace(/\/+$/, ''), updatedById: actorId };

    if (input.apiKey) {
      if (!this.env.CRM_SECRET_KEY) {
        throw new BadRequestException('CRM_SECRET_KEY is not configured, so the key cannot be stored safely');
      }
      data.dograhApiKeyEnc = encryptSecret(input.apiKey, this.env.CRM_SECRET_KEY);
      data.dograhApiKeyLast4 = input.apiKey.slice(-4);
    }

    await this.prisma.platformSetting.upsert({
      where: { id: ROW_ID },
      create: { id: ROW_ID, ...data },
      update: data,
    });
    this.invalidate();
    return this.dograh();
  }

  /** Forget the cached row; the next read goes to the database. */
  invalidate(): void {
    this.cache = null;
  }
}

export interface PlatformDograh {
  baseUrl: string | null;
  /** Decrypted. Server-side only — never put this in a response. */
  apiKey: string | null;
  apiKeyLast4: string | null;
  updatedAt: Date | null;
}
