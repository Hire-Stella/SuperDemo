import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { DEFAULT_STAGES, GeneratedCentre, type ApiEnv } from '@superdemo/contracts';
import { GeneratorService } from './generator.service';

/*
 * What the generator does with a model's output, tested without a model.
 *
 * Synthetic fixtures only: `validate()` is the step between "the model replied"
 * and "the page is written", so it is exercised directly. Nothing here reaches
 * Groq, Anthropic or any other service.
 */

const generator = new GeneratorService({} as ApiEnv);
const validate = (raw: unknown): GeneratedCentre =>
  (generator as unknown as { validate(raw: unknown): GeneratedCentre }).validate(raw);

const stage = (n: number) => ({
  name: `Stage ${n}`,
  purpose: 'Answer the caller using the verified facts.',
  routeWhen: 'the caller asks about something specific',
});

/** A complete, in-limits model reply. Each test overrides what it is about. */
function reply(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    industry: 'PROFESSIONAL',
    tagline: 'System integrator in the UAE',
    hero: { headline: 'Headline', subhead: 'Subhead', ctaLabel: 'Call us', eyebrow: '' },
    highlights: [{ title: 'Highlight', body: 'Body' }],
    services: [{ name: 'Service', body: 'Body' }],
    faq: [{ q: 'Question?', a: 'Answer.' }],
    steps: [],
    agentGreeting: 'Thank you for calling.',
    knowledge: [{ title: 'Note', content: 'Content' }],
    stages: [stage(1), stage(2), stage(3)],
    testimonials: [],
    pricing: [],
    comparison: { beforeLabel: '', afterLabel: '', before: [], after: [] },
    ...over,
  };
}

describe('GeneratorService.validate — tagline', () => {
  it('leaves an ordinary tagline unchanged', () => {
    expect(validate(reply({ tagline: 'System integrator in the UAE' })).tagline).toBe(
      'System integrator in the UAE',
    );
  });

  it('keeps a tagline of exactly 120 characters', () => {
    const tagline = 'a'.repeat(120);
    expect(validate(reply({ tagline })).tagline).toBe(tagline);
  });

  it('truncates a tagline of 121 characters to 120 instead of failing', () => {
    const out = validate(reply({ tagline: 'a'.repeat(121) }));
    expect(out.tagline).toBe('a'.repeat(120));
  });

  it('truncates a much longer tagline and keeps the rest of the reply', () => {
    const out = validate(reply({ tagline: 'word '.repeat(80) }));
    expect(out.tagline).toHaveLength(120);
    expect(out.services).toHaveLength(1);
    expect(out.knowledge).toHaveLength(1);
  });

  it('does not leave half a surrogate pair at the cut', () => {
    // 119 ASCII + one emoji (two UTF-16 units) puts the cut inside the pair.
    const out = validate(reply({ tagline: `${'a'.repeat(119)}😀` }));
    expect(out.tagline).toBe('a'.repeat(119));
  });

  it('does not mutate the model output it was given', () => {
    const raw = reply({ tagline: 'a'.repeat(200), services: Array.from({ length: 10 }, () => ({ name: 'S', body: 'B' })) });
    const before = JSON.stringify(raw);
    validate(raw);
    expect(JSON.stringify(raw)).toBe(before);
  });
});

describe('GeneratorService.validate — other limits, boundary and one over', () => {
  const lengths: [string, (n: number) => Record<string, unknown>, (o: GeneratedCentre) => string, number][] = [
    ['hero.headline', (n) => ({ hero: { headline: 'h'.repeat(n), subhead: 's', ctaLabel: 'c', eyebrow: '' } }), (o) => o.hero.headline, 120],
    ['hero.subhead', (n) => ({ hero: { headline: 'h', subhead: 's'.repeat(n), ctaLabel: 'c', eyebrow: '' } }), (o) => o.hero.subhead, 300],
    ['hero.eyebrow', (n) => ({ hero: { headline: 'h', subhead: 's', ctaLabel: 'c', eyebrow: 'e'.repeat(n) } }), (o) => o.hero.eyebrow, 60],
    ['services[].body', (n) => ({ services: [{ name: 'S', body: 'b'.repeat(n) }] }), (o) => o.services[0]!.body, 240],
    ['faq[].a', (n) => ({ faq: [{ q: 'Q?', a: 'a'.repeat(n) }] }), (o) => o.faq[0]!.a, 400],
    ['knowledge[].content', (n) => ({ knowledge: [{ title: 'T', content: 'c'.repeat(n) }] }), (o) => o.knowledge[0]!.content, 2000],
  ];

  it.each(lengths)('%s: at the limit is kept, one over is trimmed', (_name, make, read, max) => {
    expect(read(validate(reply(make(max))))).toHaveLength(max);
    expect(read(validate(reply(make(max + 1))))).toHaveLength(max);
  });

  const counts: [string, number, (n: number) => Record<string, unknown>, (o: GeneratedCentre) => number][] = [
    ['highlights', 6, (n) => ({ highlights: Array.from({ length: n }, () => ({ title: 'T', body: 'B' })) }), (o) => o.highlights.length],
    ['services', 8, (n) => ({ services: Array.from({ length: n }, () => ({ name: 'S', body: 'B' })) }), (o) => o.services.length],
    ['faq', 6, (n) => ({ faq: Array.from({ length: n }, () => ({ q: 'Q?', a: 'A' })) }), (o) => o.faq.length],
    ['knowledge', 6, (n) => ({ knowledge: Array.from({ length: n }, () => ({ title: 'T', content: 'C' })) }), (o) => o.knowledge.length],
    ['stages', 6, (n) => ({ stages: Array.from({ length: n }, (_, i) => stage(i)) }), (o) => o.stages.length],
  ];

  it.each(counts)('%s: %i items are kept, one over is cut to the limit', (_name, max, make, read) => {
    expect(read(validate(reply(make(max))))).toBe(max);
    expect(read(validate(reply(make(max + 1))))).toBe(max);
  });

  it('keeps the first items when an array is cut, in order', () => {
    const faq = Array.from({ length: 8 }, (_, i) => ({ q: `Q${i}?`, a: 'A' }));
    expect(validate(reply({ faq })).faq.map((f) => f.q)).toEqual(['Q0?', 'Q1?', 'Q2?', 'Q3?', 'Q4?', 'Q5?']);
  });

  it('trims a capped string inside an over-long array element too', () => {
    const faq = Array.from({ length: 7 }, () => ({ q: 'Q?', a: 'a'.repeat(500) }));
    const out = validate(reply({ faq }));
    expect(out.faq).toHaveLength(6);
    expect(out.faq.every((f) => f.a.length === 400)).toBe(true);
  });

  it('leaves an in-limits reply exactly as given', () => {
    const raw = reply();
    expect(validate(raw)).toEqual(GeneratedCentre.parse(raw));
  });
});

describe('GeneratorService.validate — structure is still strict', () => {
  const rejects = (raw: unknown) =>
    expect(() => validate(raw)).toThrow(BadRequestException);

  it('rejects a reply with no industry', () => {
    const { industry: _industry, ...rest } = reply();
    rejects(rest);
  });

  it('rejects an industry that is not in the enum, even with a valid tagline', () => {
    rejects(reply({ industry: 'SPACEPORT' }));
  });

  it('rejects a missing tagline', () => {
    const { tagline: _tagline, ...rest } = reply();
    rejects(rest);
  });

  it('rejects wrong types', () => {
    rejects(reply({ tagline: 42 }));
    rejects(reply({ services: 'not an array' }));
    rejects(reply({ hero: 'not an object' }));
    rejects(reply({ highlights: [{ title: 1, body: 'B' }] }));
  });

  it('rejects an over-long tagline of the wrong type rather than coercing it', () => {
    rejects(reply({ tagline: ['a'.repeat(200)] }));
  });

  it('rejects a service missing a required field', () => {
    rejects(reply({ services: [{ name: 'Only a name' }] }));
  });

  it('rejects null, a string and an array in place of the object', () => {
    rejects(null);
    rejects('{}');
    rejects([]);
  });

  it('still rejects when an over-long tagline arrives alongside a structural fault', () => {
    rejects(reply({ tagline: 'a'.repeat(200), industry: 'NOPE' }));
  });

  it('does not rescue a too-short stage, which is a minimum and not a maximum', () => {
    rejects(reply({ stages: [{ name: 'X', purpose: 'short', routeWhen: 'short' }, stage(2)] }));
  });
});

describe('GeneratorService.validate — stages fallback is unchanged', () => {
  it('substitutes the default stages when fewer than two come back', () => {
    expect(validate(reply({ stages: [] })).stages).toEqual(DEFAULT_STAGES);
    expect(validate(reply({ stages: [stage(1)] })).stages).toEqual(DEFAULT_STAGES);
  });
});

describe('the fallback (no-model) path uses the same validation', () => {
  it('produces a valid page from a scrape with an over-long description', () => {
    const out = (
      generator as unknown as {
        withoutModel(site: unknown, name: string): GeneratedCentre;
      }
    ).withoutModel(
      {
        url: 'https://example.test/',
        finalUrl: 'https://example.test/',
        title: 'T'.repeat(200),
        description: 'D'.repeat(500),
        text: 'A sentence that is long enough to be picked up as a sentence. '.repeat(5),
        headings: ['Services we offer', 'Why choose us', 'Contact us'],
        imageUrl: null,
        images: [],
        phone: null,
        alsoRead: [],
      },
      'Example',
    );
    expect(out.tagline.length).toBeLessThanOrEqual(120);
    expect(out.hero.headline.length).toBeLessThanOrEqual(120);
  });
});
