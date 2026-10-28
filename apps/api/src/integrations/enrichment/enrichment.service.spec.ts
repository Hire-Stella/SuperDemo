import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_STAGES, GeneratedCentre, SiteContent, type ScrapedSite } from '@superdemo/contracts';
import {
  DOGRAH_NOT_CONNECTED,
  EnrichmentService,
  fitToPage,
  foldStages,
  isTransientAgentFailure,
  trimWords,
} from './enrichment.service';

const site: ScrapedSite = {
  url: 'https://acme.example',
  finalUrl: 'https://acme.example/',
  title: 'Acme Plumbing',
  description: 'Emergency plumbing in Dubai',
  text: 'We fix leaks across Dubai.',
  headings: [],
  imageUrl: null,
  images: [],
  phone: null,
  alsoRead: [],
  pages: [
    { url: 'https://acme.example/', title: 'Home', text: 'We fix leaks.' },
    { url: 'https://acme.example/about', title: '', text: 'Family run since 1998.' },
  ],
};

const generated = GeneratedCentre.parse({
  industry: 'GENERIC',
  hero: { headline: 'Leaks fixed fast', subhead: 'Day and night.', ctaLabel: 'Call us' },
  services: [{ name: 'Leak repair', body: 'Any leak.' }],
  stages: DEFAULT_STAGES,
});

function harness(opts: {
  scrape?: () => Promise<ScrapedSite>;
  generate?: () => Promise<GeneratedCentre>;
  dograhHost?: string | null;
  buildAgentFor?: () => Promise<{ ok: true } | { ok: false; detail: string }>;
}) {
  const statuses: { enrichStatus: string; enrichError?: string | null }[] = [];
  const prisma = {
    setting: {
      updateMany: vi.fn(async ({ data }: { data: { enrichStatus: string; enrichError?: string | null } }) => {
        statuses.push(data);
      }),
    },
    organization: {
      findUnique: vi.fn(async () => ({
        id: 'org1',
        name: 'Acme',
        slug: 'acme',
        industry: 'GENERIC',
        logoUrl: null,
        tagline: null,
      })),
      update: vi.fn(async () => ({})),
    },
    site: {
      findFirst: vi.fn(async () => ({ id: 'site1', content: {}, metaTitle: null, metaDescription: null })),
      update: vi.fn(async () => ({})),
    },
    knowledgeDoc: {
      findMany: vi.fn(async () => []),
      deleteMany: vi.fn(async () => ({})),
      create: vi.fn(async () => ({})),
    },
  };
  const tenants = { runAs: (_org: string, _user: null, fn: () => unknown) => fn() };
  const scraper = { scrape: vi.fn(opts.scrape ?? (async () => site)) };
  const generator = { generateOrFallback: vi.fn(opts.generate ?? (async () => generated)) };
  const dograh = {
    view: vi.fn(async () => ({
      baseUrl: opts.dograhHost === undefined ? 'https://dograh.invalid' : opts.dograhHost,
      hasApiKey: true,
      workflowId: null,
    })),
    buildAgentFor: vi.fn(opts.buildAgentFor ?? (async () => ({ ok: true as const }))),
    buildDemoAgentsFor: vi.fn(async () => ({ ok: true as const })),
    enableBooking: vi.fn(async () => ({ ok: true as const })),
  };
  const svc = new EnrichmentService(
    prisma as never,
    {} as never,
    tenants as never,
    scraper as never,
    generator as never,
    dograh as never,
  );
  const run = () =>
    (svc as unknown as { run: (...a: unknown[]) => Promise<void> }).run(
      'org1',
      'https://acme.example',
      false,
      ['inbound', 'outbound', 'info'],
    );
  return { run, prisma, dograh, statuses, generator };
}

describe('fitToPage', () => {
  it('trims uncapped model copy until it passes SiteContent', () => {
    const draft = {
      hero: {
        eyebrow: 'e '.repeat(100),
        headline: 'A headline that goes on '.repeat(30),
        subhead: 's'.repeat(1000),
        primaryCta: { label: 'Book an appointment with our friendly team today', kind: 'call' },
      },
      services: Array.from({ length: 24 }, (_, i) => ({ name: `Service number ${i} `.repeat(10), body: 'b '.repeat(300) })),
      faq: [...Array.from({ length: 15 }, () => ({ q: 'Why? '.repeat(60), a: 'Because. '.repeat(200) })), { q: '', a: 'x' }],
      pricing: [{ name: 'Basic', features: Array.from({ length: 20 }, () => 'f '.repeat(80)) }],
      comparison: { before: Array(9).fill('slow '.repeat(40)), after: [] },
      sections: ['services', 'faq'],
    };
    const parsed = SiteContent.safeParse(fitToPage(draft));
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.services).toHaveLength(8);
    expect(parsed.data.faq).toHaveLength(10);
    expect(parsed.data.hero.headline.length).toBeLessThanOrEqual(120);
    expect(parsed.data.hero.headline.endsWith('…')).toBe(true);
  });

  it('cuts at a word boundary', () => {
    expect(trimWords('one two three four', 12)).toBe('one two…');
    expect(trimWords('short', 12)).toBe('short');
  });
});

describe('foldStages', () => {
  it('keeps five and folds the rest into Other services', () => {
    const stages = Array.from({ length: 9 }, (_, i) => ({
      name: `S${i}`,
      purpose: `Do ${i}`,
      routeWhen: `they ask ${i}`,
    }));
    const out = foldStages(stages);
    expect(out).toHaveLength(6);
    expect(out[5]!.name).toBe('Other services');
    expect(out[5]!.routeWhen).toContain('S5');
    expect(out[5]!.routeWhen).toContain('S8');
    expect(foldStages(DEFAULT_STAGES)).toBe(DEFAULT_STAGES);
  });
});

describe('isTransientAgentFailure', () => {
  it('retries outages, not refusals', () => {
    expect(isTransientAgentFailure('Could not reach https://d — fetch failed')).toBe(true);
    expect(isTransientAgentFailure('Dograh refused the request (503 Service Unavailable)')).toBe(true);
    expect(isTransientAgentFailure('Dograh refused the request (429): slow down')).toBe(true);
    expect(isTransientAgentFailure('Dograh refused the request (401): bad key')).toBe(false);
    expect(isTransientAgentFailure(DOGRAH_NOT_CONNECTED)).toBe(false);
  });
});

describe('run()', () => {
  it('builds the agents when the scrape throws', async () => {
    const h = harness({
      scrape: async () => {
        throw new Error('site unreachable');
      },
    });
    await h.run();
    expect(h.generator.generateOrFallback).not.toHaveBeenCalled();
    expect(h.dograh.buildAgentFor).toHaveBeenCalledTimes(1);
    expect(h.dograh.buildDemoAgentsFor).toHaveBeenCalledTimes(1);
    expect(h.statuses.at(-1)!.enrichStatus).toBe('ready');
  });

  it('builds the agents when the generator throws', async () => {
    const h = harness({
      generate: async () => {
        throw new Error('model exploded');
      },
    });
    await h.run();
    expect(h.dograh.buildAgentFor).toHaveBeenCalledTimes(1);
    const brief = (h.dograh.buildAgentFor.mock.calls[0] as unknown[])[1] as { stages: unknown };
    expect(brief.stages).toEqual(DEFAULT_STAGES);
    expect(h.statuses.at(-1)!.enrichStatus).toBe('ready');
  });

  it('writes the page and one knowledge doc per scraped page', async () => {
    const h = harness({});
    await h.run();
    expect(h.prisma.site.update).toHaveBeenCalled();
    const titles = h.prisma.knowledgeDoc.create.mock.calls.map(
      (c) => ((c as unknown[])[0] as { data: { title: string } }).data.title,
    );
    expect(titles).toEqual(['From the website — Home', 'From the website — /about']);
  });

  it('fails with the Dograh message, without retrying, when there is no host', async () => {
    const h = harness({ dograhHost: null });
    await expect(h.run()).resolves.toBeUndefined();
    expect(h.dograh.buildAgentFor).not.toHaveBeenCalled();
    const last = h.statuses.at(-1)!;
    expect(last.enrichStatus).toBe('failed');
    expect(last.enrichError).toContain(DOGRAH_NOT_CONNECTED);
  });

  it('rethrows a transient Dograh failure so the outbox retries', async () => {
    const h = harness({
      buildAgentFor: async () => ({ ok: false, detail: 'Could not reach https://d — The operation was aborted due to timeout' }),
    });
    await expect(h.run()).rejects.toThrow(/Could not reach/);
    expect(h.statuses.at(-1)!.enrichStatus).toBe('failed');
  });
});
