import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ApiEnv } from '@superdemo/contracts';
import { encryptSecret } from '../../shared/secret-box';
import type { PrismaService } from '../../prisma/prisma.service';
import type { CalendarService } from '../../calendar/calendar.service';
import type { PlatformDograh, PlatformSettingsService } from '../../platform-settings/platform-settings.service';
import { DograhService } from './dograh.service';

const SECRET = 'test-crm-secret-key-long-enough';

/** A connected page, so `view().connected` depends only on host and key. */
const PUBLIC = {
  workflowId: 7,
  workflowName: 'Agent',
  workflowUuid: 'uuid-7',
  embedToken: 'tok',
  chatEmbedToken: '',
  chatWorkflowId: null,
  chatEnabled: true,
  embedScript: '',
  allowedDomains: [],
  callMode: 'both',
};

function harness(opts: {
  centre?: { baseUrl?: string | null; apiKey?: string | null };
  platform?: Partial<PlatformDograh>;
  env?: Partial<ApiEnv>;
}) {
  const env = {
    CRM_SECRET_KEY: SECRET,
    WEB_ORIGIN: 'http://localhost:3000',
    ...opts.env,
  } as ApiEnv;
  const row = {
    dograhBaseUrl: opts.centre?.baseUrl ?? null,
    dograhSecretsEnc: opts.centre?.apiKey ? encryptSecret(opts.centre.apiKey, SECRET) : null,
    dograhPublic: PUBLIC,
    dograhDialers: null,
    dograhUpdatedAt: null,
    enrichStatus: 'none',
    enrichError: null,
  };
  const prisma = {
    setting: { findFirst: vi.fn(async () => row) },
  } as unknown as PrismaService;
  const platform = {
    dograh: vi.fn(async () => ({
      baseUrl: null,
      apiKey: null,
      apiKeyLast4: null,
      updatedAt: null,
      ...opts.platform,
    })),
  } as unknown as PlatformSettingsService;
  return new DograhService(prisma, env, {} as CalendarService, platform);
}

/** Records which host and key each request used, and answers like Dograh. */
function stubDograh() {
  const seen: { url: string; key: string }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: { headers: Record<string, string> }) => {
      seen.push({ url, key: init.headers['x-api-key']! });
      const body = url.endsWith('/auth/me') ? { email: 'ops@example.com' } : { total: 3 };
      return new Response(JSON.stringify(body), { status: 200 });
    }),
  );
  return seen;
}

afterEach(() => vi.unstubAllGlobals());

const ENV_PAIR = { DOGRAH_BASE_URL: 'https://env.dograh', DOGRAH_API_KEY: 'env-key' };
const PLATFORM_PAIR = { baseUrl: 'https://platform.dograh', apiKey: 'platform-key' };

describe('DograhService resolution', () => {
  it('a centre key beats the platform and the deployment', async () => {
    const svc = harness({
      centre: { baseUrl: 'https://centre.dograh', apiKey: 'centre-key' },
      platform: PLATFORM_PAIR,
      env: ENV_PAIR,
    });
    const view = await svc.view('org');
    expect(view).toMatchObject({
      source: 'centre',
      baseUrl: 'https://centre.dograh',
      inheritedFromDeployment: false,
      connected: true,
    });

    const seen = stubDograh();
    await svc.test('org');
    expect(seen[0]!.url.startsWith('https://centre.dograh')).toBe(true);
    expect(seen[0]!.key).toBe('centre-key');
  });

  it('a centre key with no host of its own uses the platform host', async () => {
    const svc = harness({ centre: { apiKey: 'centre-key' }, platform: PLATFORM_PAIR, env: ENV_PAIR });
    expect(await svc.view('org')).toMatchObject({ source: 'centre', baseUrl: 'https://platform.dograh' });
  });

  it('a centre with no key uses the platform pair, ahead of the deployment', async () => {
    // A host saved on the centre does not pair with the platform key.
    const svc = harness({
      centre: { baseUrl: 'https://stale.dograh' },
      platform: PLATFORM_PAIR,
      env: ENV_PAIR,
    });
    const view = await svc.view('org');
    expect(view).toMatchObject({
      source: 'platform',
      baseUrl: 'https://platform.dograh',
      inheritedFromDeployment: true,
      hasApiKey: true,
      connected: true,
    });

    const seen = stubDograh();
    const r = await svc.test('org');
    expect(r.ok).toBe(true);
    expect(seen[0]!.url.startsWith('https://platform.dograh')).toBe(true);
    expect(seen[0]!.key).toBe('platform-key');
  });

  it('falls back to the deployment when the platform setting is empty', async () => {
    const svc = harness({ env: ENV_PAIR });
    expect(await svc.view('org')).toMatchObject({
      source: 'deployment',
      baseUrl: 'https://env.dograh',
      inheritedFromDeployment: true,
      connected: true,
    });
  });

  it('falls back to the deployment when the platform has a host but no key', async () => {
    const svc = harness({ platform: { baseUrl: 'https://platform.dograh' }, env: ENV_PAIR });
    expect(await svc.view('org')).toMatchObject({ source: 'deployment', baseUrl: 'https://env.dograh' });
  });

  it('with nothing anywhere the centre is not connected', async () => {
    const svc = harness({});
    const view = await svc.view('org');
    expect(view).toMatchObject({
      source: 'none',
      connected: false,
      hasApiKey: false,
      inheritedFromDeployment: false,
      baseUrl: null,
    });
    // The prefix enrichment matches on.
    await expect(svc.workflows('org')).rejects.toThrow(/No Dograh (host|API key)/);
  });

  it('dialersView counts the platform setting as connected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify([{ id: 1, name: 'A', status: 'active' }]), { status: 200 })),
    );
    const view = await harness({ platform: PLATFORM_PAIR }).dialersView('org');
    expect(view.dograhConnected).toBe(true);
    expect(view.baseUrl).toBe('https://platform.dograh');
    expect(view.workflows).toHaveLength(1);
  });
});

describe('DograhService.testConnection', () => {
  it('reports who the key belongs to', async () => {
    const seen = stubDograh();
    const r = await harness({}).testConnection('https://given.dograh', 'given-key');
    expect(r.ok).toBe(true);
    expect(r.detail).toContain('ops@example.com');
    expect(seen[0]).toMatchObject({ key: 'given-key' });
    expect(seen[0]!.url.startsWith('https://given.dograh')).toBe(true);
  });

  it('returns ok:false with the reason when Dograh refuses the key', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ detail: 'Invalid API key' }), { status: 401 })),
    );
    const r = await harness({}).testConnection('https://given.dograh', 'bad-key');
    expect(r).toEqual({ ok: false, detail: expect.stringContaining('Invalid API key') });
  });

  it('returns ok:false when the host cannot be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNREFUSED');
      }),
    );
    const r = await harness({}).testConnection('https://down.dograh', 'k');
    expect(r.ok).toBe(false);
    expect(r.detail).toMatch(/Could not reach https:\/\/down\.dograh/);
  });
});
