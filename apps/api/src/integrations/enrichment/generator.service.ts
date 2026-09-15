import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import * as z from 'zod/v4';
import { DEFAULT_STAGES, GeneratedCentre, type ApiEnv, type ScrapedSite } from '@superdemo/contracts';
import { ENV } from '../../config/config.module';

/**
 * Turns a scraped website into a landing page and a voice-agent brief.
 *
 * One call, not two. The page and the agent must agree about what the business
 * does — a page selling diplomas beside an agent briefed on dentistry is worse
 * than either being generic — and the cheapest way to guarantee that is to make
 * them the same generation.
 *
 * The schema below is zod/v4 because that is what the SDK's structured-output
 * helper needs; the result is re-validated against the v3 contract in
 * @superdemo/contracts so the rest of the codebase keeps one source of truth.
 */

const Generated = z.object({
  // Mirrors Industry in packages/contracts/src/enums.ts. Duplicated rather than
  // imported because the SDK helper needs a zod/v4 schema and the contract is
  // v3; the result is re-validated against the contract below, which is what
  // catches this list drifting.
  industry: z.enum([
    'EDUCATION',
    'CLINIC',
    'RESTAURANT',
    'RETAIL',
    'FITNESS',
    'PROFESSIONAL',
    'GENERIC',
  ]),
  tagline: z.string(),
  hero: z.object({ headline: z.string(), subhead: z.string(), ctaLabel: z.string(), eyebrow: z.string() }),
  highlights: z.array(z.object({ title: z.string(), body: z.string() })),
  services: z.array(z.object({ name: z.string(), body: z.string() })),
  faq: z.array(z.object({ q: z.string(), a: z.string() })),
  steps: z.array(z.object({ title: z.string(), body: z.string() })),
  agentGreeting: z.string(),
  knowledge: z.array(z.object({ title: z.string(), content: z.string() })),
  stages: z.array(
    z.object({ name: z.string(), purpose: z.string(), routeWhen: z.string() }),
  ),
  testimonials: z.array(z.object({ quote: z.string(), author: z.string(), role: z.string() })),
  pricing: z.array(
    z.object({ name: z.string(), price: z.string(), note: z.string(), features: z.array(z.string()) }),
  ),
  comparison: z.object({
    beforeLabel: z.string(),
    afterLabel: z.string(),
    before: z.array(z.string()),
    after: z.array(z.string()),
  }),
});

@Injectable()
export class GeneratorService {
  private readonly log = new Logger(GeneratorService.name);
  private client?: Anthropic;

  constructor(@Inject(ENV) private readonly env: ApiEnv) {}

  private anthropic(): Anthropic {
    if (!this.env.ANTHROPIC_API_KEY) {
      throw new BadRequestException(
        'ANTHROPIC_API_KEY is not configured — it writes the page and briefs the agent',
      );
    }
    this.client ??= new Anthropic({ apiKey: this.env.ANTHROPIC_API_KEY });
    return this.client;
  }

  /**
   * The instruction, and the two failure modes it is written against.
   *
   * *Inventing facts.* A landing page that promises a service the client does
   * not offer, or a voice agent that quotes a price it made up, is worse than a
   * generic one — it is a liability the client discovers from a customer. So
   * the rule is explicit and repeated: nothing that is not on the site.
   *
   * *Marketing voice.* Left alone, a model writes "Unlock your potential with
   * our world-class solutions" for every business on earth. Naming the failure
   * is more effective than asking for "good copy".
   */
  private system(): string {
    return [
      'You turn a scraped business website into (a) landing-page copy for that business and',
      '(b) a brief for a voice AI agent that will answer their phone.',
      '',
      'HARD RULES',
      '- Use only what the scraped text supports. Never invent a service, price, qualification,',
      '  accreditation, location or opening hour. If the site does not say, leave it out.',
      '- No superlatives you were not given. "world-class", "leading", "unlock your potential",',
      '  "cutting-edge" and "seamless" are banned unless the site itself uses them.',
      '- Write in the register the site uses. A dental clinic and a gym do not sound alike.',
      '- British English. The audience is Gulf/UK, not US.',
      '',
      'hero.eyebrow: a very short proof chip, two to five words, of something the site actually',
      'claims — "KHDA approved", "Trusted by 500+ homeowners", "Since 1998". Leave it an empty',
      'string if the site claims nothing checkable. Never invent a number.',
      '',
      'testimonials: quotes the site actually publishes, with the name attached. EXTRACT ONLY.',
      'Return [] if the site has no testimonials — never compose one, never attribute words to a',
      'person who did not say them. This is the single most important rule here.',
      '',
      'pricing: tiers the site actually publishes, with the figures exactly as written. EXTRACT',
      'ONLY. Return [] if the site quotes no prices. Never estimate, never round, never infer a',
      'tier structure the business has not stated.',
      '',
      'comparison: how the site frames the difference the business makes — the problem without',
      'them against the outcome with them. Up to four short lines each side, drawn from their own',
      'positioning. Labels short, e.g. "Doing it alone" / "Working with us". Empty arrays if the',
      'site makes no such argument.',
      '',
      'steps: the stages of working with this business, in order — what happens after someone',
      'gets in touch. Three or four, each a short title and one sentence. ONLY if the site actually',
      'describes a process (consultation, quote, fitting, aftercare...). If it does not, return an',
      'empty array — do not invent a process for a shop that simply sells things.',
      '',
      'agentGreeting: the first thing said when the phone is answered. The agent is called Stella',
      'and works for the business — e.g. "Thank you for calling <business>, this is Stella, how can',
      'I help you today?". Never use any other name for the agent.',
      '',
      'industry: one of EDUCATION, CLINIC, RESTAURANT, RETAIL, FITNESS, PROFESSIONAL, GENERIC —',
      'the closest match, since it decides the queues and the routing labels. A dentist, vet or',
      'physio is CLINIC; a law or accountancy firm is PROFESSIONAL; GENERIC if nothing fits.',
      'knowledge: 3-6 factual notes lifted from the site (services, hours, location, policies) that',
      'the agent can answer from. Quote the site, do not embellish it.',
      '',
      'THE STAGES (stages)',
      'Three to five distinct things a caller to THIS business actually rings about, which become',
      'separate stages of the phone agent with routing between them. Derive them from what the site',
      'sells — a clinic gets appointments/treatments/insurance, a supplier gets products/stock/',
      'quotations. Do not invent a stage the business has no evidence for, and do not include',
      'greeting or ending; those exist already.',
      '  name      — 2-4 words, how it reads in a flow diagram.',
      '  purpose   — what the agent does in this stage: what it answers, what it must collect, and',
      '              when to hand to a human. Written as instructions to the agent.',
      '  routeWhen — the caller need that should send someone here, e.g. "the caller asks what a',
      '              course costs or how to pay". Becomes a routing condition, so describe the',
      '              CALLER, not the stage.',
    ].join('\n');
  }

  /** Which provider actually runs, given the config and the keys present. */
  private resolveProvider(): 'anthropic' | 'groq' | 'none' {
    const choice = this.env.ENRICH_LLM;
    if (choice === 'anthropic') return 'anthropic';
    if (choice === 'groq') return 'groq';
    if (choice === 'none') return 'none';
    // auto: Groq first — a deployment that set that key chose it deliberately.
    // A model id is not required; resolveGroqModel() discovers one.
    if (this.env.GROQ_API_KEY) return 'groq';
    if (this.env.ANTHROPIC_API_KEY) return 'anthropic';
    return 'none';
  }

  async generate(site: ScrapedSite, centreName: string): Promise<GeneratedCentre> {
    const provider = this.resolveProvider();
    this.log.log(`generating copy for ${centreName} with ${provider}`);
    if (provider === 'groq') return this.viaGroq(site, centreName);
    if (provider === 'none') return this.withoutModel(site, centreName);
    return this.viaAnthropic(site, centreName);
  }

  /**
   * Which Groq model writes the copy.
   *
   * Asked of Groq rather than hardcoded, because a pinned id is a 404 waiting
   * to happen: they retire and rename hosted models on their own schedule, and
   * the failure would surface months later as "enrichment failed" rather than
   * "that model is gone". `GET /models` is the authority on what a given key
   * can use, so the choice is made from that.
   *
   * The preference order is quality-first — this runs once per centre and
   * writes prose a client reads, so a bigger model is worth a few seconds.
   * Anything not on the list is judged by context window, with the families
   * that cannot do this job excluded by name: whisper is speech-to-text,
   * prompt-guard is a safety classifier, orpheus is text-to-speech, and
   * Groq's `compound` models are tool-using agents rather than plain
   * completers.
   *
   * Cached for the process: the list does not change between two tenants
   * created in the same afternoon, and this is on the path of every enrichment.
   */
  private groqModel?: string;

  private static readonly GROQ_PREFERRED = [
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b',
    'qwen/qwen3.6-27b',
  ];
  private static readonly GROQ_UNSUITABLE = /whisper|prompt-guard|orpheus|tts|guard|compound/i;

  private async resolveGroqModel(key: string): Promise<string> {
    if (this.env.GROQ_MODEL) return this.env.GROQ_MODEL;
    if (this.groqModel) return this.groqModel;

    const res = await fetch(`${this.env.GROQ_BASE_URL.replace(/\/+$/, '')}/models`, {
      headers: { authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15_000),
    }).catch((e: unknown) => {
      throw new BadRequestException(
        `Could not ask Groq which models are available — ${e instanceof Error ? e.message : 'request failed'}`,
      );
    });
    if (!res.ok) {
      throw new BadRequestException(
        `Groq refused the model list (${res.status}) — check GROQ_API_KEY`,
      );
    }

    const body = (await res.json()) as { data?: { id?: string; context_window?: number }[] };
    const usable = (body.data ?? []).filter(
      (m): m is { id: string; context_window?: number } =>
        typeof m.id === 'string' && !GeneratorService.GROQ_UNSUITABLE.test(m.id),
    );

    const chosen =
      GeneratorService.GROQ_PREFERRED.find((want) => usable.some((m) => m.id === want)) ??
      // Nothing recognised: the widest context window that could hold a page.
      usable
        .filter((m) => (m.context_window ?? 0) >= 32_000)
        .sort((a, b) => (b.context_window ?? 0) - (a.context_window ?? 0))[0]?.id;

    if (!chosen) {
      throw new BadRequestException(
        'No Groq model on this key can write page copy. Available: ' +
          ((body.data ?? []).map((m) => m.id).join(', ') || 'none') +
          '. Set GROQ_MODEL explicitly if one of these will do.',
      );
    }
    this.groqModel = chosen;
    this.log.log(`groq: using ${chosen} (discovered; set GROQ_MODEL to pin it)`);
    return chosen;
  }

  /**
   * Groq, through its OpenAI-compatible chat-completions endpoint.
   *
   * `response_format: json_object` rather than a JSON schema: schema support
   * varies by hosted model on Groq, and a request that a given model rejects
   * would fail the whole enrichment. Asking for an object and validating it
   * against the contract afterwards works on every model, and the validation
   * was going to happen regardless.
   */
  private async viaGroq(site: ScrapedSite, centreName: string): Promise<GeneratedCentre> {
    const key = this.env.GROQ_API_KEY;
    if (!key) throw new BadRequestException('GROQ_API_KEY must be set to use Groq');
    const model = await this.resolveGroqModel(key);

    const res = await fetch(`${this.env.GROQ_BASE_URL.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(90_000),
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: `${this.system()}\n\n${this.jsonShape()}` },
          { role: 'user', content: this.userInput(site, centreName) },
        ],
      }),
    }).catch((e: unknown) => {
      throw new BadRequestException(
        `Could not reach Groq — ${e instanceof Error ? e.message : 'request failed'}`,
      );
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new BadRequestException(
        `Groq refused the request (${res.status})${detail ? `: ${detail.slice(0, 300)}` : ''}`,
      );
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = body.choices?.[0]?.message?.content;
    if (!content) throw new BadRequestException('Groq returned no content for that site');

    let raw: unknown;
    try {
      raw = JSON.parse(content);
    } catch {
      throw new BadRequestException('Groq did not return valid JSON for that site');
    }
    return this.validate(raw);
  }

  /**
   * The shape, spelled out for a provider without typed structured output.
   *
   * Duplicating the schema in prose is not ideal, but the alternative — a JSON
   * schema in the request — is the thing that varies between Groq's hosted
   * models. The zod validation below is what actually enforces it either way,
   * so a model that ignores this produces a clear validation failure rather
   * than a malformed page.
   */
  private jsonShape(): string {
    return [
      'Reply with a single JSON object, no prose and no code fence, with exactly these keys.',
      'EVERY key is required, including "stages" — an empty stages array is not acceptable.',
      '{',
      '  "industry": "EDUCATION|CLINIC|RESTAURANT|RETAIL|FITNESS|PROFESSIONAL|GENERIC",',
      '  "tagline": "string, max 120 chars",',
      '  "hero": { "headline": "max 120", "subhead": "max 300", "ctaLabel": "max 40", "eyebrow": "max 60" },',
      '  "highlights": [ { "title": "max 60", "body": "max 200" } ],   // up to 6',
      '  "services":   [ { "name": "max 80",  "body": "max 240" } ],   // up to 8',
      '  "faq":        [ { "q": "max 160",    "a": "max 400" } ],      // up to 6',
      '  "steps":      [ { "title": "max 60", "body": "max 200" } ],    // 0 or 3-4, see below',
      '  "agentGreeting": "max 300",',
      '  "knowledge":  [ { "title": "max 120", "content": "max 2000" } ], // 3-6',
      '  "stages":     [ { "name": "max 40", "purpose": "max 600", "routeWhen": "max 240" } ], // 3-5',
      '  "testimonials": [ { "quote": "max 400", "author": "max 60", "role": "max 80" } ], // [] unless on the page',
      '  "pricing":    [ { "name": "max 40", "price": "max 40", "note": "max 120", "features": ["max 90"] } ], // [] unless on the page',
      '  "comparison": { "beforeLabel": "max 40", "afterLabel": "max 40", "before": ["max 120"], "after": ["max 120"] }',
      '}',
    ].join('\n');
  }

  private userInput(site: ScrapedSite, centreName: string): string {
    return [
      `BUSINESS NAME (as the operator entered it): ${centreName}`,
      `WEBSITE: ${site.finalUrl}`,
      site.title ? `PAGE TITLE: ${site.title}` : '',
      site.description ? `META DESCRIPTION: ${site.description}` : '',
      site.headings.length ? `HEADINGS:\n- ${site.headings.slice(0, 20).join('\n- ')}` : '',
      site.phone ? `PHONE FOUND ON SITE: ${site.phone}` : '',
      '',
      'SCRAPED TEXT:',
      site.text,
    ]
      .filter(Boolean)
      .join('\n');
  }

  private validate(raw: unknown): GeneratedCentre {
    const parsed = GeneratedCentre.safeParse(raw);
    if (!parsed.success) {
      this.log.warn(`generated content failed contract validation: ${parsed.error.message}`);
      throw new BadRequestException('The generated page did not fit the expected shape');
    }
    /*
     * A model that skipped the stages costs us tailored routing, nothing more.
     *
     * Groq returns an empty `stages` array often enough that treating it as
     * fatal threw away the page copy too. Two is the minimum for routing to
     * mean anything, so below that the generic set is substituted.
     */
    if (parsed.data.stages.length < 2) {
      this.log.warn('model returned no usable stages — falling back to the generic three');
      return { ...parsed.data, stages: DEFAULT_STAGES };
    }
    return parsed.data;
  }

  /**
   * No model configured: build the page from what the site literally says.
   *
   * Deliberately not a failure. A centre created from a URL should end up with
   * a page about the right business even on a deployment with no LLM keys at
   * all — the headline is their own page title, the services are their own
   * headings. The copy is plainer than a model's, and every word of it is
   * theirs, which is the one thing this cannot get wrong.
   *
   * The agent brief falls back to the scraped text itself, because Dograh's own
   * generator reads natural language and does not need ours to pre-digest it.
   */
  private withoutModel(site: ScrapedSite, centreName: string): GeneratedCentre {
    this.log.warn(
      `no ENRICH_LLM configured — building ${centreName}'s page from the page's own text`,
    );
    const headings = site.headings.filter((h) => h.length > 3 && h.length < 70);
    const sentences = site.text
      .split(/(?<=[.!?])\s+/)
      .map((x) => x.trim())
      .filter((x) => x.length > 40 && x.length < 240);

    return this.validate({
      industry: 'GENERIC',
      tagline: (site.description || site.title || centreName).slice(0, 120),
      hero: {
        headline: (site.title || centreName).slice(0, 120),
        subhead: (site.description || sentences[0] || '').slice(0, 300),
        ctaLabel: 'Call us',
        eyebrow: '',
      },
      highlights: headings.slice(0, 3).map((h, i) => ({
        title: h.slice(0, 60),
        body: (sentences[i + 1] ?? '').slice(0, 200),
      })),
      services: headings.slice(3, 9).map((h) => ({ name: h.slice(0, 80), body: '' })),
      faq: [],
      steps: [],
      testimonials: [],
      pricing: [],
      comparison: { beforeLabel: '', afterLabel: '', before: [], after: [] },
      agentGreeting: `Thank you for calling ${centreName}. How can I help you today?`.slice(0, 300),
      knowledge: headings.slice(0, 4).map((h, i) => ({
        title: h.slice(0, 120),
        content: (sentences[i] ?? h).slice(0, 2000),
      })),
      stages: DEFAULT_STAGES,
    });
  }

  private async viaAnthropic(site: ScrapedSite, centreName: string): Promise<GeneratedCentre> {
    const client = this.anthropic();

    const input = this.userInput(site, centreName);

    let response;
    try {
      response = await client.messages.parse({
        model: this.env.ANTHROPIC_MODEL,
        // Wide: the page copy, the FAQ, the knowledge notes and the brief all
        // share this budget with adaptive thinking.
        max_tokens: 8192,
        system: this.system(),
        messages: [{ role: 'user', content: input }],
        output_config: {
          // Higher than the turn loop's 'low': this runs once per centre and
          // the output is read by a client, not by a state machine.
          effort: 'medium',
          format: zodOutputFormat(Generated),
        },
      });
    } catch (e) {
      throw new BadRequestException(
        `Could not write the page — ${e instanceof Error ? e.message : 'the model call failed'}`,
      );
    }

    if (response.stop_reason === 'refusal') {
      // Worth surfacing plainly: the operator pasted a URL and deserves to know
      // the model would not write about it, rather than seeing a generic error.
      throw new BadRequestException(
        'The model declined to write about that site. Check the URL is the business you meant.',
      );
    }
    const raw = response.parsed_output;
    if (!raw) throw new BadRequestException('The model returned nothing usable for that site');

    // Re-validated against the shared contract, which also enforces the length
    // caps the DB columns and the templates assume.
    const parsed = this.validate(raw);
    this.log.log(
      `generated ${parsed.industry} content for ${centreName} from ${site.finalUrl} ` +
        `(${parsed.services.length} services, ${parsed.knowledge.length} notes)`,
    );
    return parsed;
  }
}
