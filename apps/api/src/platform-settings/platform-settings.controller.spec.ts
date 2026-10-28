import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { ApiEnv, SessionUser } from '@superdemo/contracts';
import { PlatformSettingsController } from './platform-settings.controller';
import type { PlatformDograh } from './platform-settings.service';

const SECRET = 'sk-live-supersecret-1234';
const actor = { id: 'u-op' } as SessionUser;

const slot = (over: Record<string, unknown> = {}) => ({ enabled: true, workflowId: null, workflowUuid: '', ...over });

function harness(opts: {
  stored?: Partial<PlatformDograh>;
  test?: { ok: boolean; detail: string };
  settings?: Array<{ orgId: string; dograhDialers: unknown; enrichStatus: string }>;
  enqueueFails?: string[];
} = {}) {
  let stored: PlatformDograh = {
    baseUrl: null,
    apiKey: null,
    apiKeyLast4: null,
    updatedAt: null,
    ...opts.stored,
  };
  const settings = {
    dograh: vi.fn(async () => stored),
    saveDograh: vi.fn(async (input: { baseUrl: string; apiKey?: string }) => {
      stored = {
        baseUrl: input.baseUrl,
        apiKey: input.apiKey ?? stored.apiKey,
        apiKeyLast4: input.apiKey ? input.apiKey.slice(-4) : stored.apiKeyLast4,
        updatedAt: new Date('2026-10-28T00:00:00Z'),
      };
      return stored;
    }),
  };
  const prisma = {
    setting: {
      count: vi.fn(async () => 3),
      // The controller filters in SQL; the mock returns everything so the
      // in-process guards are exercised too.
      findMany: vi.fn(async () => opts.settings ?? []),
    },
    auditLog: { create: vi.fn(async () => ({})) },
  };
  const tenants = { runAs: vi.fn((_o: string | null, _a: string | null, fn: () => unknown) => fn()) };
  const dograh = { testConnection: vi.fn(async () => opts.test ?? { ok: true, detail: 'Connected' }) };
  const enrichment = {
    enqueueBuildAgents: vi.fn(async (orgId: string) => {
      if (opts.enqueueFails?.includes(orgId)) throw new Error('outbox down');
    }),
  };
  const env = { DOGRAH_BASE_URL: 'https://env.example', DOGRAH_API_KEY: undefined } as unknown as ApiEnv;
  const ctrl = new PlatformSettingsController(
    prisma as never,
    tenants as never,
    settings as never,
    dograh as never,
    enrichment as never,
    env,
  );
  return { ctrl, prisma, settings, dograh, enrichment };
}

describe('GET platform/settings/dograh', () => {
  it('never contains the key', async () => {
    const { ctrl } = harness({
      stored: { baseUrl: 'https://voice.example', apiKey: SECRET, apiKeyLast4: '1234' },
    });
    const view = await ctrl.view();
    expect(JSON.stringify(view)).not.toContain(SECRET);
    expect(view).toMatchObject({
      baseUrl: 'https://voice.example',
      hasApiKey: true,
      apiKeyLast4: '1234',
      effectiveSource: 'platform',
      deploymentFallback: { baseUrl: true, hasApiKey: false },
      centresUsing: 3,
    });
  });

  it('reports none when neither platform nor env is complete', async () => {
    const { ctrl } = harness();
    expect((await ctrl.view()).effectiveSource).toBe('none');
  });
});

describe('PUT platform/settings/dograh', () => {
  it('rejects a credential that fails the test and saves nothing', async () => {
    const h = harness({ test: { ok: false, detail: 'Dograh refused the key (401)' } });
    await expect(
      h.ctrl.save({ baseUrl: 'https://voice.example', apiKey: SECRET }, actor),
    ).rejects.toThrow(BadRequestException);
    expect(h.dograh.testConnection).toHaveBeenCalledWith('https://voice.example', SECRET);
    expect(h.settings.saveDograh).not.toHaveBeenCalled();
    expect(h.prisma.auditLog.create).not.toHaveBeenCalled();
    expect(h.enrichment.enqueueBuildAgents).not.toHaveBeenCalled();
  });

  it('saves, audits without the key, and queues only centres waiting on agents', async () => {
    const h = harness({
      settings: [
        { orgId: 'due', dograhDialers: { inbound: slot(), outbound: slot({ enabled: false }), info: slot({ workflowId: 7, workflowUuid: 'u' }) }, enrichStatus: 'none' },
        { orgId: 'filled', dograhDialers: { inbound: slot({ workflowId: 9, workflowUuid: 'x' }) }, enrichStatus: 'done' },
        { orgId: 'running', dograhDialers: { inbound: slot() }, enrichStatus: 'running' },
        { orgId: 'queued', dograhDialers: { inbound: slot() }, enrichStatus: 'queued' },
        { orgId: 'nothing-on', dograhDialers: {}, enrichStatus: 'none' },
        { orgId: 'broken', dograhDialers: { outbound: slot() }, enrichStatus: 'failed' },
      ],
      enqueueFails: ['broken'],
    });
    const out = await h.ctrl.save({ baseUrl: 'https://voice.example', apiKey: SECRET }, actor);

    expect(h.settings.saveDograh).toHaveBeenCalledWith({ baseUrl: 'https://voice.example', apiKey: SECRET }, 'u-op');
    const audit = JSON.stringify(h.prisma.auditLog.create.mock.calls);
    expect(audit).not.toContain(SECRET);
    expect(audit).toContain('platform.dograh.update');

    // Fallback centres only: the query itself filters out centres with their own Dograh.
    const where = (h.prisma.setting.findMany.mock.calls[0] as unknown as [{ where: Record<string, unknown> }])[0].where;
    expect(where).toMatchObject({ dograhSecretsEnc: null });

    expect(h.enrichment.enqueueBuildAgents.mock.calls).toEqual([
      ['due', ['inbound']],
      ['broken', ['outbound']],
    ]);
    expect(out.queuedCentres).toBe(1); // 'broken' failed to queue and is skipped
    expect(JSON.stringify(out)).not.toContain(SECRET);
    expect(out.view.effectiveSource).toBe('platform');
  });

  it('tests the stored key when only the host changes', async () => {
    const h = harness({ stored: { baseUrl: 'https://old.example', apiKey: SECRET, apiKeyLast4: '1234' } });
    await h.ctrl.save({ baseUrl: 'https://new.example' }, actor);
    expect(h.dograh.testConnection).toHaveBeenCalledWith('https://new.example', SECRET);
  });
});

describe('POST platform/settings/dograh/test', () => {
  it('uses the stored key when none is given', async () => {
    const h = harness({ stored: { baseUrl: 'https://voice.example', apiKey: SECRET, apiKeyLast4: '1234' } });
    const out = await h.ctrl.test({ baseUrl: 'https://other.example' });
    expect(h.dograh.testConnection).toHaveBeenCalledWith('https://other.example', SECRET);
    expect(out).toEqual({ ok: true, detail: 'Connected' });
  });

  it('asks for a key when there is none anywhere', async () => {
    const h = harness();
    expect(await h.ctrl.test({ baseUrl: 'https://voice.example' })).toEqual({
      ok: false,
      detail: 'No API key to test — enter one',
    });
    expect(h.dograh.testConnection).not.toHaveBeenCalled();
  });
});
