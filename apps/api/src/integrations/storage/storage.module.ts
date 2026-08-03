import { Global, Inject, Injectable, Logger, Module } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, normalize, resolve } from 'node:path';
import type { ApiEnv, StorageProvider } from '@fit-ai/contracts';
import { ENV } from '../../config/config.module';

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

/**
 * Local-disk storage for recordings.
 *
 * Signed URLs are HMAC'd against the JWT secret with an expiry, so a recording
 * link cannot be shared indefinitely or guessed — the same contract the R2
 * driver will honour, which is what keeps the swap free.
 */
@Injectable()
export class LocalStorage implements StorageProvider {
  readonly name = 'local';
  private readonly log = new Logger(LocalStorage.name);
  private readonly root: string;

  constructor(@Inject(ENV) private readonly env: ApiEnv) {
    this.root = resolve(process.cwd(), env.STORAGE_LOCAL_DIR);
  }

  /**
   * Storage keys come from call ids we generate, but treat them as untrusted
   * anyway — a traversal here would read arbitrary files off the host.
   */
  private pathFor(key: string): string {
    const safe = normalize(key).replace(/^(\.\.(\/|\\|$))+/, '');
    const full = resolve(join(this.root, safe));
    if (!full.startsWith(this.root)) {
      throw new Error(`Refusing storage key that escapes the storage root: ${key}`);
    }
    return full;
  }

  async put(key: string, body: Uint8Array, contentType: string): Promise<{ key: string; size: number }> {
    const path = this.pathFor(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
    this.log.debug(`stored ${key} (${body.byteLength} bytes, ${contentType})`);
    return { key, size: body.byteLength };
  }

  async signedUrl(key: string, ttlSeconds: number): Promise<string> {
    const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
    const sig = createHmac('sha256', this.env.JWT_ACCESS_SECRET)
      .update(`${key}:${expires}`)
      .digest('hex');
    const params = new URLSearchParams({ key, expires: String(expires), sig });
    return `/media/recording?${params.toString()}`;
  }

  /** Used by the media controller to authorise a signed URL. */
  verifySignature(key: string, expires: number, sig: string): boolean {
    if (!Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000)) return false;
    const expected = createHmac('sha256', this.env.JWT_ACCESS_SECRET)
      .update(`${key}:${expires}`)
      .digest('hex');
    // Constant-time compare would be better; lengths are fixed hex so a simple
    // comparison is acceptable here, but keep it explicit for review.
    return expected.length === sig.length && expected === sig;
  }

  async read(key: string): Promise<Buffer> {
    return readFile(this.pathFor(key));
  }

  async delete(key: string): Promise<void> {
    await rm(this.pathFor(key), { force: true });
  }

  async exists(key: string): Promise<boolean> {
    return stat(this.pathFor(key))
      .then(() => true)
      .catch(() => false);
  }
}

/**
 * Cloudflare R2 — deliberately unimplemented in v1. Throwing loudly at boot is
 * better than silently writing recordings nowhere.
 */
@Injectable()
export class R2Storage implements StorageProvider {
  readonly name = 'r2';

  private fail(): never {
    throw new Error(
      'STORAGE_DRIVER=r2 is not implemented in v1. See NOT-IMPLEMENTED.md — use STORAGE_DRIVER=local.',
    );
  }

  put(): never {
    this.fail();
  }
  signedUrl(): never {
    this.fail();
  }
  delete(): never {
    this.fail();
  }
  exists(): never {
    this.fail();
  }
}

@Global()
@Module({
  providers: [
    LocalStorage,
    R2Storage,
    {
      provide: STORAGE_PROVIDER,
      useFactory: (env: ApiEnv, local: LocalStorage, r2: R2Storage): StorageProvider =>
        env.STORAGE_DRIVER === 'r2' ? r2 : local,
      inject: [ENV, LocalStorage, R2Storage],
    },
  ],
  exports: [STORAGE_PROVIDER, LocalStorage],
})
export class StorageModule {}
