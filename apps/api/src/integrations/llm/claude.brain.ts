import { Inject, Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
// The SDK's zod helper is built against the v4 API, which zod 3.25 ships
// alongside the classic one. Scoped to this file; the rest of the codebase
// (and @superdemo/contracts) stays on the classic API.
import * as z from 'zod/v4';
import type {
  ApiEnv,
  BrainRequest,
  BrainResponse,
  ConversationTurn,
  LlmProvider,
} from '@superdemo/contracts';
import { ENV } from '../../config/config.module';

/**
 * Generative conversation brain, for production.
 *
 * Design notes:
 *
 *  · **Structured output, not prose parsing.** The turn loop needs a reply plus
 *    confidence, intent, course and sentiment. Asking for JSON via
 *    `output_config.format` gets all of it in one call, schema-validated, with
 *    no brittle text parsing.
 *
 *  · **Low effort, thinking left on.** A phone caller notices latency above
 *    roughly 800ms, so this runs at `effort: 'low'`. Thinking is deliberately
 *    *not* disabled: on Opus 5 that risks internal tags leaking into text the
 *    caller would hear spoken aloud. Low effort with thinking on is both faster
 *    to first token than high effort and safe.
 *
 *  · **A refusal escalates.** If the safety classifiers decline, we hand to a
 *    human rather than retrying on another model — for an admissions line
 *    that's the correct outcome anyway, and it needs no fallback config.
 *
 *  · **The knowledge base is still the source of truth.** Retrieved context is
 *    injected and the prompt forbids going beyond it, so switching to this
 *    driver does not licence the assistant to invent fees.
 */

/** Mirrors BrainResponse's model-decided fields. */
const ReplySchema = z.object({
  reply: z
    .string()
    .describe(
      'What to say to the caller. Two or three sentences maximum — this is spoken aloud on a phone call.',
    ),
  answered_from_context: z
    .boolean()
    .describe(
      'True only if the provided knowledge base context actually contained the answer. False if you had to say you were unsure.',
    ),
  detected_intent: z
    .string()
    .nullable()
    .describe(
      'Short snake_case label, e.g. fee_enquiry, course_details, schedule_enquiry, enrolment_process, refund, visa.',
    ),
  course_of_interest: z
    .string()
    .nullable()
    .describe('Exact FIT course title the caller is asking about, or null if unclear.'),
  sentiment: z
    .number()
    .min(-1)
    .max(1)
    .describe('Caller sentiment from -1 (angry) to 1 (delighted).'),
  wants_human: z
    .boolean()
    .describe('True if the caller asked for a person, or the request needs a human to decide.'),
  resolved: z.boolean().describe("True if the caller's need is met and the call can end."),
});

const SummarySchema = z.object({
  summary: z.string().describe('Two sentences maximum, for a CRM timeline entry.'),
  detected_intent: z.string().nullable(),
  course_of_interest: z.string().nullable(),
});

@Injectable()
export class ClaudeBrain implements LlmProvider {
  readonly name = 'claude';
  private readonly log = new Logger(ClaudeBrain.name);
  private readonly client: Anthropic;

  constructor(@Inject(ENV) private readonly env: ApiEnv) {
    this.client = new Anthropic({ apiKey: this.env.ANTHROPIC_API_KEY });
  }

  async respond(req: BrainRequest): Promise<BrainResponse> {
    const citations = [...new Set(req.context.slice(0, 3).map((c) => c.docTitle))];
    // Retrieval confidence is computed by the knowledge service and is the
    // number the escalation rules compare against — the model does not get to
    // grade its own coverage.
    const retrievalConfidence = req.context[0]?.score ?? 0;

    const context = req.context.length
      ? req.context
          .slice(0, 4)
          .map((c, i) => `[${i + 1}] ${c.docTitle}\n${c.content}`)
          .join('\n\n')
      : '(no relevant knowledge base entries were found for this question)';

    const system = [
      req.systemPrompt,
      '',
      'You are speaking on a live phone call. Keep every reply short enough to say aloud',
      'comfortably — two or three sentences. No lists, no markdown, no emoji.',
      '',
      'Answer only from the knowledge base extracts below. If they do not cover the',
      "question, say you are not certain and offer to pass the caller to an advisor —",
      'set answered_from_context to false and wants_human to true. Never invent a fee,',
      'a date, or a course that is not in the extracts.',
      '',
      '--- KNOWLEDGE BASE EXTRACTS ---',
      context,
      '--- END EXTRACTS ---',
    ].join('\n');

    const messages: Anthropic.MessageParam[] = [
      ...req.history.map(
        (t): Anthropic.MessageParam => ({
          role: t.role === 'CALLER' ? 'user' : 'assistant',
          content: t.text,
        }),
      ),
      { role: 'user', content: req.utterance },
    ];

    try {
      const response = await this.client.messages.parse({
        model: this.env.ANTHROPIC_MODEL,
        // Generous enough that adaptive thinking plus a short reply cannot
        // truncate — thinking and response text share this budget.
        max_tokens: 4096,
        system,
        messages,
        output_config: {
          effort: 'low',
          format: zodOutputFormat(ReplySchema),
        },
      });

      if (response.stop_reason === 'refusal') {
        this.log.warn(
          `Claude declined the turn (${response.stop_details?.category ?? 'unknown'}) — escalating`,
        );
        return this.escalationFallback(retrievalConfidence, citations);
      }

      const parsed = response.parsed_output;
      if (!parsed) {
        this.log.error('Claude returned no parseable output — escalating');
        return this.escalationFallback(retrievalConfidence, citations);
      }

      const usage = response.usage;
      return {
        reply: parsed.reply,
        // If the model admits the context didn't cover it, force confidence to
        // zero so the escalation rules fire regardless of retrieval score.
        confidence: parsed.answered_from_context ? retrievalConfidence : 0,
        detectedIntent: parsed.detected_intent,
        courseOfInterest: parsed.course_of_interest,
        sentiment: parsed.sentiment,
        wantsHuman: parsed.wants_human,
        resolved: parsed.resolved,
        citations,
        usage: {
          inputTokens: usage.input_tokens,
          outputTokens: usage.output_tokens,
          costUsd: this.estimateCostUsd(usage.input_tokens, usage.output_tokens),
        },
      };
    } catch (error) {
      // Never let a provider failure drop a live call — hand to a human.
      if (error instanceof Anthropic.RateLimitError) {
        this.log.error('Claude rate limited — escalating this call to a human');
      } else if (error instanceof Anthropic.APIConnectionError) {
        this.log.error('Claude unreachable — escalating this call to a human');
      } else if (error instanceof Anthropic.APIError) {
        this.log.error(`Claude API error ${error.status}: ${error.message}`);
      } else {
        this.log.error(`Unexpected brain failure: ${String(error)}`);
      }
      return this.escalationFallback(retrievalConfidence, citations);
    }
  }

  async summarise(history: ConversationTurn[]): Promise<{
    summary: string;
    detectedIntent: string | null;
    courseOfInterest: string | null;
  }> {
    const transcript = history
      .map((t) => `${t.role === 'CALLER' ? 'Caller' : 'Assistant'}: ${t.text}`)
      .join('\n');

    try {
      const response = await this.client.messages.parse({
        model: this.env.ANTHROPIC_MODEL,
        max_tokens: 2048,
        system:
          'Summarise this admissions call for a CRM timeline. Be factual and specific about ' +
          'what the caller wanted. Do not speculate beyond the transcript.',
        messages: [{ role: 'user', content: transcript }],
        output_config: {
          effort: 'low',
          format: zodOutputFormat(SummarySchema),
        },
      });

      const parsed = response.parsed_output;
      if (!parsed) return this.summaryFallback(history);

      return {
        summary: parsed.summary,
        detectedIntent: parsed.detected_intent,
        courseOfInterest: parsed.course_of_interest,
      };
    } catch (error) {
      this.log.warn(`Summary generation failed, using fallback: ${String(error)}`);
      return this.summaryFallback(history);
    }
  }

  private summaryFallback(history: ConversationTurn[]) {
    const first = history.find((h) => h.role === 'CALLER')?.text ?? 'No caller speech captured.';
    return {
      summary: `Caller enquiry. Opening question: "${first.slice(0, 140)}"`,
      detectedIntent: null,
      courseOfInterest: null,
    };
  }

  private escalationFallback(confidence: number, citations: string[]): BrainResponse {
    return {
      reply:
        "I'm sorry, I'm having trouble with that just now. Let me put you through to one of " +
        'our admissions advisors who can help you properly.',
      confidence,
      detectedIntent: null,
      courseOfInterest: null,
      sentiment: 0,
      wantsHuman: true,
      resolved: false,
      citations,
    };
  }

  /**
   * Opus 5 list pricing: $5 per Mtok input, $25 per Mtok output. Indicative
   * only — it drives the cost-per-contained-call figure on the analytics page,
   * not billing.
   */
  private estimateCostUsd(inputTokens: number, outputTokens: number): number {
    return Number(((inputTokens / 1e6) * 5 + (outputTokens / 1e6) * 25).toFixed(6));
  }
}
