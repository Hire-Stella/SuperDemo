import { createHash } from 'node:crypto';
import { BadRequestException, Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import type { ApiEnv } from '@superdemo/contracts';
import { ENV } from '../config/config.module';
import { PrismaService } from '../prisma/prisma.service';
import { decryptSecret, encryptSecret } from '../shared/secret-box';

/*
 * The table, exactly as `prisma db push` creates it from schema.prisma.
 *
 * Created here too so a deploy that skips the schema push still works: this
 * repo has no migrations and nothing runs `db push` at container start, and a
 * missing table would otherwise fail every Dograh lookup on every centre.
 * Identical to Prisma's DDL, so a later `db push` finds nothing to change.
 */
const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS "PlatformSetting" (
    "id" TEXT NOT NULL DEFAULT 'platform',
    "dograhBaseUrl" TEXT,
    "dograhApiKeyEnc" TEXT,
    "dograhApiKeyLast4" TEXT,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("id")
)`;

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
export class PlatformSettingsService implements OnModuleInit {
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
  async onModuleInit(): Promise<void> {
    try {
      await this.prisma.$executeRawUnsafe(CREATE_TABLE);
    } catch (e) {
      // Not fatal: reads below treat an unreadable table as "nothing saved",
      // so centres fall back to the environment exactly as before.
      this.log.warn(
        `could not ensure the PlatformSetting table — the platform Dograh setting is ` +
          `unavailable until it exists: ${e instanceof Error ? e.message : e}`,
      );
    }
  }

  async dograh(): Promise<PlatformDograh> {
    if (this.cache && Date.now() - this.cache.at < PlatformSettingsService.TTL_MS) {
      return this.cache.value;
    }
    /*
     * A failed read is "nothing saved", never an error.
     *
     * Every Dograh call on every centre resolves through here, so a missing
     * table or a database hiccup must not take voice down with it: the centre
     * falls through to the environment, which is what happened before this
     * setting existed. Cached for a shorter time so it recovers quickly.
     */
    let row: Awaited<ReturnType<typeof this.prisma.platformSetting.findUnique>> = null;
    try {
      row = await this.prisma.platformSetting.findUnique({ where: { id: ROW_ID } });
    } catch (e) {
      this.log.warn(`platform settings unreadable, using the environment — ${e instanceof Error ? e.message : e}`);
      const empty: PlatformDograh = { baseUrl: null, apiKey: null, apiKeyLast4: null, updatedAt: null };
      this.cache = { at: Date.now() - PlatformSettingsService.TTL_MS + 10_000, value: empty };
      return empty;
    }
    let apiKey: string | null = null;
    if (row?.dograhApiKeyEnc) {
      apiKey = this.decrypt(row.dograhApiKeyEnc);
      if (!apiKey) this.log.warn('platform Dograh key is stored but could not be decrypted — re-enter it on the platform page');
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
      const [secret] = this.secrets();
      if (!secret) {
        throw new BadRequestException('No encryption secret is configured, so the key cannot be stored safely');
      }
      data.dograhApiKeyEnc = encryptSecret(input.apiKey, secret);
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

  /*
   * Which secrets encrypt the stored key, preferred first.
   *
   * CRM_SECRET_KEY when the deployment has one, as for every other stored
   * credential. Without it, a key derived from JWT_ACCESS_SECRET — which the
   * API cannot boot without — so saving works on a deployment that never set
   * CRM_SECRET_KEY. Derived through a labelled hash, never used raw, so the
   * value encrypting this key is not the one signing sessions.
   *
   * Decryption tries both, so adding CRM_SECRET_KEY later does not strand a
   * key saved before it existed; the next save re-encrypts with it.
   */
  private secrets(): string[] {
    const out: string[] = [];
    if (this.env.CRM_SECRET_KEY) out.push(this.env.CRM_SECRET_KEY);
    if (this.env.JWT_ACCESS_SECRET) {
      out.push(createHash('sha256').update(`platform-settings:${this.env.JWT_ACCESS_SECRET}`).digest('base64url'));
    }
    return out;
  }

  private decrypt(enc: string): string | null {
    for (const secret of this.secrets()) {
      try {
        return decryptSecret(enc, secret);
      } catch {
        /* wrong secret for this payload; try the next */
      }
    }
    return null;
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
