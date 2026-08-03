import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  ApiEnv,
  BrainRequest,
  BrainResponse,
  ConversationTurn,
  LlmProvider,
} from '@fit-ai/contracts';
import { ENV } from '../../config/config.module';

/**
 * Local generative brain via Ollama — free, offline, no API key.
 *
 * Useful for developing the generative path without spending anything: a small
 * local model is far too slow and too weak for a real phone call, but it
 * exercises exactly the same code as the Claude driver.
 *
 * Asks for JSON via prompt rather than a schema-enforcement API, so it
 * tolerates a malformed response by falling back to escalation.
 */
@Injectable()
export class OllamaBrain implements LlmProvider {
  readonly name = 'ollama';
  private readonly log = new Logger(OllamaBrain.name);

  constructor(@Inject(ENV) private readonly env: ApiEnv) {}

  private async chat(system: string, prompt: string): Promise<string | null> {
    try {
      const res = await fetch(`${this.env.OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: this.env.OLLAMA_MODEL,
          stream: false,
          format: 'json',
          options: { temperature: 0.3, num_predict: 400 },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: prompt },
          ],
        }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) {
        this.log.error(`Ollama returned ${res.status}`);
        return null;
      }
      const body = (await res.json()) as { message?: { content?: string } };
      return body.message?.content ?? null;
    } catch (error) {
      this.log.error(
        `Ollama unreachable at ${this.env.OLLAMA_BASE_URL} — is \`ollama serve\` running? ${String(error)}`,
      );
      return null;
    }
  }

  async respond(req: BrainRequest): Promise<BrainResponse> {
    const citations = [...new Set(req.context.slice(0, 3).map((c) => c.docTitle))];
    const retrievalConfidence = req.context[0]?.score ?? 0;

    const context = req.context.length
      ? req.context.slice(0, 3).map((c) => `${c.docTitle}: ${c.content}`).join('\n\n')
      : '(nothing relevant found)';

    const system = [
      req.systemPrompt,
      '',
      'Reply with JSON only, matching exactly this shape:',
      '{"reply": string, "answered_from_context": boolean, "detected_intent": string|null,',
      ' "course_of_interest": string|null, "sentiment": number, "wants_human": boolean, "resolved": boolean}',
      '',
      'Keep "reply" to two or three spoken sentences. Use only the extracts below.',
      'If they do not answer the question, set answered_from_context false and wants_human true.',
      '',
      context,
    ].join('\n');

    const history = req.history
      .slice(-6)
      .map((t) => `${t.role === 'CALLER' ? 'Caller' : 'Assistant'}: ${t.text}`)
      .join('\n');

    const raw = await this.chat(system, `${history}\nCaller: ${req.utterance}`);
    if (!raw) return this.fallback(retrievalConfidence, citations);

    try {
      const p = JSON.parse(raw) as Record<string, unknown>;
      const reply = typeof p.reply === 'string' ? p.reply.trim() : '';
      if (!reply) return this.fallback(retrievalConfidence, citations);

      const answered = p.answered_from_context !== false;
      return {
        reply,
        confidence: answered ? retrievalConfidence : 0,
        detectedIntent: typeof p.detected_intent === 'string' ? p.detected_intent : null,
        courseOfInterest: typeof p.course_of_interest === 'string' ? p.course_of_interest : null,
        sentiment: typeof p.sentiment === 'number' ? Math.max(-1, Math.min(1, p.sentiment)) : 0,
        wantsHuman: p.wants_human === true,
        resolved: p.resolved === true,
        citations,
      };
    } catch {
      this.log.warn('Ollama returned unparseable JSON — escalating');
      return this.fallback(retrievalConfidence, citations);
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

    const raw = await this.chat(
      'Summarise this admissions call in two sentences. Reply with JSON: ' +
        '{"summary": string, "detected_intent": string|null, "course_of_interest": string|null}',
      transcript,
    );

    if (raw) {
      try {
        const p = JSON.parse(raw) as Record<string, unknown>;
        if (typeof p.summary === 'string' && p.summary.trim()) {
          return {
            summary: p.summary.trim(),
            detectedIntent: typeof p.detected_intent === 'string' ? p.detected_intent : null,
            courseOfInterest:
              typeof p.course_of_interest === 'string' ? p.course_of_interest : null,
          };
        }
      } catch {
        /* fall through */
      }
    }

    const first = history.find((h) => h.role === 'CALLER')?.text ?? 'No caller speech captured.';
    return {
      summary: `Caller enquiry. Opening question: "${first.slice(0, 140)}"`,
      detectedIntent: null,
      courseOfInterest: null,
    };
  }

  private fallback(confidence: number, citations: string[]): BrainResponse {
    return {
      reply:
        "I'm sorry, I'm not able to help with that right now. Let me pass you to one of our advisors.",
      confidence,
      detectedIntent: null,
      courseOfInterest: null,
      sentiment: 0,
      wantsHuman: true,
      resolved: false,
      citations,
    };
  }
}
