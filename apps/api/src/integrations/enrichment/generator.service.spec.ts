import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_STAGES, GeneratedCentre, type ApiEnv, type ScrapedSite } from '@superdemo/contracts';
import { GeneratorService } from './generator.service';

const site: ScrapedSite = {
  url: 'https://acme.example',
  finalUrl: 'https://acme.example/',
  title: 'Acme Plumbing',
  description: 'Emergency plumbing in Dubai',
  text: 'We fix leaks across Dubai, day and night, with a fixed call-out fee for every visit.',
  headings: ['Leak repair', 'Boiler servicing', 'Drain unblocking', 'Bathroom fitting'],
  imageUrl: null,
  images: [],
  phone: null,
  alsoRead: [],
  pages: [],
};

function groqGenerator(): GeneratorService {
  const env = {
    ENRICH_LLM: 'groq',
    GROQ_API_KEY: 'test-key',
    GROQ_MODEL: 'test-model',
    GROQ_BASE_URL: 'https://groq.invalid/openai/v1',
  } as unknown as ApiEnv;
  const g = new GeneratorService(env);
  g.retryDelayMs = 0;
  return g;
}

afterEach(() => vi.unstubAllGlobals());

describe('GeneratedCentre is lenient', () => {
  it('accepts 24 services, a 500-character headline and an unknown industry', () => {
    const services = Array.from({ length: 24 }, (_, i) => ({ name: `Service ${i}`, body: 'x'.repeat(400) }));
    const parsed = GeneratedCentre.safeParse({
      industry: 'PLUMBING',
      hero: { headline: 'h'.repeat(500) },
      services,
      faq: [{ q: 'Q?', a: 'A.' }, null, 'nonsense'],
      stages: [
        { name: 'Bookings', purpose: 'Book a visit.', routeWhen: 'they want a visit' },
        { name: '', purpose: 'dropped', routeWhen: 'dropped' },
      ],
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.industry).toBe('GENERIC');
    expect(parsed.data.services).toHaveLength(24);
    expect(parsed.data.hero.headline).toHaveLength(500);
    expect(parsed.data.hero.subhead).toBe('');
    expect(parsed.data.faq).toHaveLength(1);
    expect(parsed.data.stages).toHaveLength(1);
    expect(parsed.data.knowledge).toEqual([]);
  });

  it('fills a missing hero with empty strings and still rejects a non-object', () => {
    const parsed = GeneratedCentre.safeParse({});
    expect(parsed.success && parsed.data.hero).toEqual({ headline: '', subhead: '', ctaLabel: '', eyebrow: '' });
    expect(GeneratedCentre.safeParse('not json').success).toBe(false);
    expect(GeneratedCentre.safeParse(null).success).toBe(false);
  });
});

describe('generateOrFallback', () => {
  it('retries a transient failure once, then falls back to the site’s own words', async () => {
    const fetch = vi.fn(async () => {
      throw new Error('ETIMEDOUT');
    });
    vi.stubGlobal('fetch', fetch);
    const out = await groqGenerator().generateOrFallback(site, 'Acme');
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(out.hero.headline).toBe('Acme Plumbing');
    expect(out.stages).toEqual(DEFAULT_STAGES);
  });

  it('does not retry a permanent refusal', async () => {
    const fetch = vi.fn(async () => new Response('bad request', { status: 400 }));
    vi.stubGlobal('fetch', fetch);
    const out = await groqGenerator().generateOrFallback(site, 'Acme');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(out.industry).toBe('GENERIC');
  });

  it('falls back when the provider itself throws', async () => {
    const g = groqGenerator();
    vi.spyOn(g, 'generate').mockRejectedValue(new Error('anything at all'));
    const out = await g.generateOrFallback(site, 'Acme');
    expect(out.hero.headline).toBe('Acme Plumbing');
  });

  it('reads a Groq reply wrapped in a code fence', async () => {
    const reply = '```json\n{"industry":"clinic","hero":{"headline":"Smiles"},"services":[]}\n```';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: reply } }] }))),
    );
    const out = await groqGenerator().generateOrFallback(site, 'Acme');
    expect(out.industry).toBe('CLINIC');
    expect(out.hero.headline).toBe('Smiles');
  });
});

describe('parseJsonLoosely', () => {
  it('finds the object inside prose', () => {
    expect(GeneratorService.parseJsonLoosely('Here you go: {"a":1} hope that helps')).toEqual({ a: 1 });
    expect(GeneratorService.parseJsonLoosely('no json here')).toBeUndefined();
  });
});
