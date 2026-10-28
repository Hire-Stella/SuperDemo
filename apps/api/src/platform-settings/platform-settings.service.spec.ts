import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import type { ApiEnv } from '@superdemo/contracts';
import { PlatformSettingsService } from './platform-settings.service';
import { encryptSecret } from '../shared/secret-box';

/*
 * The deploy-safety behaviour: a missing table, a missing CRM_SECRET_KEY or a
 * key saved before CRM_SECRET_KEY existed must never take Dograh down.
 */

const JWT = 'j'.repeat(48);
const CRM = 'c'.repeat(43);

/** An in-memory stand-in for the one PlatformSetting row. */
function fakePrisma(opts: { missingTable?: boolean } = {}) {
  let row: Record<string, unknown> | null = null;
  return {
    $executeRawUnsafe: vi.fn(async () => {
      if (opts.missingTable) throw new Error('permission denied for schema public');
      return 0;
    }),
    platformSetting: {
      findUnique: vi.fn(async () => {
        if (opts.missingTable) throw new Error('The table `public.PlatformSetting` does not exist');
        return row;
      }),
      upsert: vi.fn(async ({ create, update }: { create: Record<string, unknown>; update: Record<string, unknown> }) => {
        row = { ...(row ?? create), ...update, updatedAt: new Date() };
        return row;
      }),
    },
    get row() {
      return row;
    },
  };
}

const service = (prisma: ReturnType<typeof fakePrisma>, env: Partial<ApiEnv>) =>
  new PlatformSettingsService(prisma as never, env as ApiEnv);

describe('PlatformSettingsService — deploy safety', () => {
  it('creates the table at startup, and a failure there is not fatal', async () => {
    const ok = fakePrisma();
    await service(ok, { JWT_ACCESS_SECRET: JWT }).onModuleInit();
    expect(ok.$executeRawUnsafe).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS "PlatformSetting"'));

    const broken = fakePrisma({ missingTable: true });
    await expect(service(broken, { JWT_ACCESS_SECRET: JWT }).onModuleInit()).resolves.toBeUndefined();
  });

  it('treats a missing table as "nothing saved" instead of throwing', async () => {
    const s = service(fakePrisma({ missingTable: true }), { JWT_ACCESS_SECRET: JWT });
    await expect(s.dograh()).resolves.toEqual({ baseUrl: null, apiKey: null, apiKeyLast4: null, updatedAt: null });
  });

  it('saves and reads back a key without CRM_SECRET_KEY, using the derived secret', async () => {
    const prisma = fakePrisma();
    const s = service(prisma, { JWT_ACCESS_SECRET: JWT });
    const saved = await s.saveDograh({ baseUrl: 'https://voice.example/', apiKey: 'dgr_secret_1234' }, null);
    expect(saved).toMatchObject({ baseUrl: 'https://voice.example', apiKey: 'dgr_secret_1234', apiKeyLast4: '1234' });
    // Stored encrypted, never in the clear.
    expect(String(prisma.row?.dograhApiKeyEnc)).not.toContain('dgr_secret_1234');
  });

  it('still reads a key saved before CRM_SECRET_KEY was added', async () => {
    const prisma = fakePrisma();
    await service(prisma, { JWT_ACCESS_SECRET: JWT }).saveDograh(
      { baseUrl: 'https://voice.example', apiKey: 'dgr_old_key_9999' },
      null,
    );
    const later = service(prisma, { JWT_ACCESS_SECRET: JWT, CRM_SECRET_KEY: CRM });
    await expect(later.dograh()).resolves.toMatchObject({ apiKey: 'dgr_old_key_9999' });
  });

  it('prefers CRM_SECRET_KEY when it is set', async () => {
    const prisma = fakePrisma();
    await service(prisma, { JWT_ACCESS_SECRET: JWT, CRM_SECRET_KEY: CRM }).saveDograh(
      { baseUrl: 'https://voice.example', apiKey: 'dgr_new_key_5555' },
      null,
    );
    // Decryptable with CRM_SECRET_KEY alone: same scheme as a centre's key.
    const onlyCrm = service(prisma, { CRM_SECRET_KEY: CRM });
    await expect(onlyCrm.dograh()).resolves.toMatchObject({ apiKey: 'dgr_new_key_5555' });
  });

  it('reports an undecryptable key as no key rather than throwing', async () => {
    const prisma = fakePrisma();
    await prisma.platformSetting.upsert({
      create: { id: 'platform', dograhBaseUrl: 'https://voice.example', dograhApiKeyEnc: encryptSecret('x'.repeat(12), 'some-other-secret'), dograhApiKeyLast4: 'xxxx' },
      update: {},
    });
    const s = service(prisma, { JWT_ACCESS_SECRET: JWT, CRM_SECRET_KEY: CRM });
    await expect(s.dograh()).resolves.toMatchObject({ baseUrl: 'https://voice.example', apiKey: null, apiKeyLast4: 'xxxx' });
  });
});
