import { Injectable, Logger } from '@nestjs/common';
import type {
  BrainRequest,
  BrainResponse,
  ConversationTurn,
  LlmProvider,
} from '@fit-ai/contracts';

/**
 * Deterministic conversation brain.
 *
 * This is the v1 default, and the choice is deliberate rather than a shortcut:
 *
 *  · It cannot hallucinate a fee or invent a course. Everything it says is
 *    assembled from retrieved knowledge-base text.
 *  · It costs nothing and needs no API key that could rate-limit mid-demo.
 *  · It is reproducible — the same question produces the same answer, so a
 *    rehearsal and the live call behave identically.
 *  · When retrieval confidence is low it says so and hands off, which is the
 *    behaviour a client actually wants from a first-line assistant.
 *
 * What it is not: a general conversationalist. Swap LLM_DRIVER=claude for
 * generative handling; the interface is unchanged.
 */
@Injectable()
export class ScriptedBrain implements LlmProvider {
  readonly name = 'scripted';
  private readonly log = new Logger(ScriptedBrain.name);

  /* --------------------------- intent detection --------------------------- */

  /**
   * Order is significant: `detectIntent` returns the FIRST match.
   *
   * The human-only intents are listed first on purpose. They are the specific
   * ones, and the general enquiry patterns are broad enough to swallow them:
   *   - `accreditation_enquiry` matched "attest", shadowing `attestation`, so
   *     "I need the certificate attested for MOH" was answered with generic KHDA
   *     text at 0.50 confidence instead of being handed to a human.
   *   - `enrolment_process` matches "registration", shadowing `refund` for
   *     "cancel my registration".
   * Both are cases where answering confidently is worse than escalating, so the
   * intents the institute reserves for humans get first refusal on every turn.
   */
  private static readonly INTENT_PATTERNS: { intent: string; patterns: RegExp[] }[] = [
    // ---- human-only: must win over the general patterns below ----
    { intent: 'refund', patterns: [/\b(refund|money back|cancel my|withdraw|defer)\b/i] },
    { intent: 'complaint', patterns: [/\b(complain|complaint|terrible|awful|unacceptable|manager|escalate)\b/i] },
    { intent: 'visa', patterns: [/\b(visa|residency|resident permit|sponsor|immigration|emirates id application)\b/i] },
    { intent: 'attestation', patterns: [/\b(attest|attestation|equivalency|moh|dha|embassy)\b/i] },
    { intent: 'corporate_pricing', patterns: [/\b(company|corporate|our team|our staff|group|bulk|employees|invoice)\b/i] },
    // ---- general enquiries the AI is allowed to answer ----
    { intent: 'fee_enquiry', patterns: [/\b(fee|fees|cost|costs|price|pricing|how much|charge|payment|instal?ment|discount)\b/i] },
    { intent: 'schedule_enquiry', patterns: [/\b(timing|timings|schedule|when|start|starts|evening|weekend|saturday|morning|duration|how long)\b/i] },
    { intent: 'enrolment_process', patterns: [/\b(enrol|enroll|register|registration|apply|admission|document|documents|join|sign up)\b/i] },
    { intent: 'location_enquiry', patterns: [/\b(where|located|location|address|parking|metro|directions|office)\b/i] },
    { intent: 'accreditation_enquiry', patterns: [/\b(accredit|khda|recognis|recogniz|valid|certificate|certification)\b/i] },
    { intent: 'course_details', patterns: [/\b(course|diploma|programme|program|certification|training|syllabus|module|content)\b/i] },
  ];

  private detectIntent(text: string): string | null {
    for (const { intent, patterns } of ScriptedBrain.INTENT_PATTERNS) {
      if (patterns.some((p) => p.test(text))) return intent;
    }
    return null;
  }

  /* ---------------------------- sentiment ---------------------------- */

  private static readonly NEGATIVE = [
    'frustrated','frustrating','annoyed','annoying','angry','upset','terrible','awful','useless',
    'ridiculous','unacceptable','disappointed','waste','rude','ignored','nobody','no one helped',
    'third time','again and again','still waiting','fed up','poor service',
  ];
  private static readonly POSITIVE = [
    'thanks','thank you','great','perfect','lovely','excellent','helpful','brilliant','appreciate',
    'wonderful','good','nice','please',
  ];

  /**
   * Lexical sentiment. Crude, but it only has to answer one question: is this
   * caller unhappy enough that a human should take over? For that, keyword
   * matching is adequate and, unlike a model, it never mislabels a calm caller
   * as furious.
   */
  private sentiment(text: string): number {
    const lower = ` ${text.toLowerCase()} `;
    let score = 0;
    for (const w of ScriptedBrain.NEGATIVE) if (lower.includes(w)) score -= 0.45;
    for (const w of ScriptedBrain.POSITIVE) if (lower.includes(w)) score += 0.25;
    if (/[A-Z]{5,}/.test(text)) score -= 0.2; // shouting
    if ((text.match(/!/g) ?? []).length >= 2) score -= 0.15;
    return Math.max(-1, Math.min(1, Number(score.toFixed(2))));
  }

  /* ------------------------- human-request detection ---------------------- */

  /**
   * Ways a caller asks for a person.
   *
   * Three distinct shapes, because they are all common and only the first is
   * obvious:
   *   1. "can I speak to someone"      — verb then person
   *   2. "can someone call me back"    — person then verb (a callback request)
   *   3. "I need a human"              — bare noun phrase
   *
   * Missing shape 2 is what made "can someone call me please, I want to register
   * today" fall through to a low-confidence escalation and get answered with
   * course details instead of a handoff.
   */
  private static readonly HUMAN_REQUEST = new RegExp(
    [
      // 1. verb → person
      String.raw`\b(speak|talk|connect|transfer|put me through|pass me)\b.{0,25}\b(human|person|someone|somebody|agent|advisor|adviser|representative|consultant|staff|team|manager)\b`,
      // 2. person → contact verb (callback requests)
      String.raw`\b(someone|somebody|a person|an? (advisor|adviser|agent|consultant)|your team|the team)\b.{0,20}\b(call|contact|phone|ring|email|reach)\b.{0,10}\bme\b`,
      // 3. explicit callback phrasing and bare noun phrases
      String.raw`\b(call me back|ring me back|have someone (call|contact)|real person|human being|live agent|customer service)\b`,
    ].join('|'),
    'i',
  );

  private wantsHuman(text: string, keywords: string[]): boolean {
    if (ScriptedBrain.HUMAN_REQUEST.test(text)) return true;
    const lower = text.toLowerCase();
    // Configured keywords are matched on word boundaries — "person" must not
    // fire on "personal", and "agent" must not fire on "agents' fees".
    return keywords.some((k) => {
      const escaped = k.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\b${escaped}\\b`, 'i').test(lower);
    });
  }

  /* ------------------------------- closing -------------------------------- */

  private static readonly CLOSING =
    /\b(that'?s all|that is all|nothing else|no more questions|i'?m done|all i needed|thank you very much|thanks a lot|goodbye|bye|that'?s everything|perfect thank)\b/i;

  /* ------------------------------- responding ----------------------------- */

  async respond(req: BrainRequest): Promise<BrainResponse> {
    const utterance = req.utterance.trim();
    const intent = this.detectIntent(utterance);
    const sentiment = this.sentiment(utterance);
    const top = req.context[0];
    const confidence = top?.score ?? 0;

    const citations = [...new Set(req.context.slice(0, 2).map((c) => c.docTitle))];

    // Did the caller ask for a person? Checked before anything else — this is
    // the single most important thing not to get wrong, because ignoring it and
    // answering anyway is precisely what makes callers hate phone assistants.
    const askedForHuman = this.wantsHuman(utterance, req.handoffKeywords ?? []);
    if (askedForHuman) {
      return {
        reply: "Of course — let me put you through to one of our admissions advisors now.",
        confidence,
        detectedIntent: intent,
        courseOfInterest: this.courseFrom(req.context, req.history),
        sentiment,
        wantsHuman: true,
        resolved: false,
        citations,
      };
    }

    // Caller is wrapping up — acknowledge and end rather than answering again.
    if (ScriptedBrain.CLOSING.test(utterance)) {
      return {
        reply:
          "You're very welcome. If anything else comes up, do call us back or message us on WhatsApp. " +
          'Have a good day.',
        confidence: 1,
        detectedIntent: intent,
        courseOfInterest: this.courseFrom(req.context, req.history),
        sentiment: Math.max(sentiment, 0.3),
        wantsHuman: false,
        resolved: true,
        citations: [],
      };
    }

    // Nothing useful retrieved: say so honestly and offer a person. This branch
    // is why the assistant is safe to put in front of prospective students.
    if (!top || confidence < 0.18) {
      return {
        reply:
          "I'm not certain I have the right information for that, and I'd rather not guess. " +
          'Let me put you through to one of our admissions advisors who can help properly.',
        confidence,
        detectedIntent: intent,
        courseOfInterest: this.courseFrom(req.context, req.history),
        sentiment,
        wantsHuman: true,
        resolved: false,
        citations,
      };
    }

    const reply = this.compose(utterance, intent, req.context, req.turn);

    return {
      reply,
      confidence,
      detectedIntent: intent,
      courseOfInterest: this.courseFrom(req.context, req.history),
      sentiment,
      wantsHuman: false,
      resolved: false,
      citations,
    };
  }

  /**
   * Build a spoken-length answer from retrieved text.
   *
   * Phone answers must be short. Rather than reading a paragraph aloud, this
   * pulls the sentences that actually address the detected intent.
   */
  private compose(
    utterance: string,
    intent: string | null,
    context: BrainRequest['context'],
    turn: number,
  ): string {
    const top = context[0]!;
    const sentences = this.sentences(top.content);

    const intentTerms: Record<string, RegExp> = {
      fee_enquiry: /\b(fee|aed|instalment|payment|cost|confirm)\b/i,
      schedule_enquiry: /\b(schedule|week|evening|weekend|saturday|blended|online|duration|intake|start)\b/i,
      enrolment_process: /\b(enrol|document|passport|emirates|photograph|registration|step|placement)\b/i,
      location_enquiry: /\b(located|address|jlt|metro|parking|office|hours|phone|whatsapp|email)\b/i,
      accreditation_enquiry: /\b(khda|approved|accredit|certificate|attest|recognis|licens)\b/i,
      course_details: /\b(offered|duration|who it is for|able to do|category)\b/i,
    };

    const matcher = intent ? intentTerms[intent] : undefined;
    let chosen = matcher ? sentences.filter((s) => matcher.test(s)) : [];

    // Fall back to the opening sentences, which for a course document are the
    // title line and duration — a sensible generic answer.
    if (chosen.length === 0) chosen = sentences.slice(0, 2);

    const body = chosen
      .slice(0, 3)
      .join(' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    const offer = this.followUp(intent);
    void turn;

    return [body, offer].filter(Boolean).join(' ').trim();
  }

  private followUp(intent: string | null): string {
    switch (intent) {
      case 'fee_enquiry':
        return 'Would you like me to put you through to admissions to confirm the exact figure and the payment options?';
      case 'enrolment_process':
        return 'Shall I connect you to an advisor to get you registered?';
      case 'schedule_enquiry':
        return 'Would you like me to check the next available intake for you?';
      default:
        return 'Is there anything else I can help you with?';
    }
  }

  /**
   * Split a document into speakable sentences.
   *
   * Bullet lines ("- Apply revenue and cost control to F&B") are dropped: they
   * are learning-outcome fragments, they read badly aloud, and an earlier
   * version flattened them with commas and spliced one onto the end of a fee
   * answer — producing a confident-sounding non-sequitur.
   */
  private sentences(text: string): string[] {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('-'))
      .flatMap((line) => line.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [])
      .map((s) => s.trim())
      .filter((s) => s.length > 12);
  }

  /** Best guess at which FIT course the caller means, for the screen-pop. */
  private courseFrom(
    context: BrainRequest['context'],
    history: ConversationTurn[],
  ): string | null {
    const courseDoc = context.find(
      (c) => c.category !== 'GENERAL' && /diploma|certification|course|preparation|programme/i.test(c.docTitle),
    );
    if (courseDoc) return courseDoc.docTitle;
    void history;
    return null;
  }

  /* ------------------------------ summarising ----------------------------- */

  async summarise(history: ConversationTurn[]): Promise<{
    summary: string;
    detectedIntent: string | null;
    courseOfInterest: string | null;
  }> {
    const callerTurns = history.filter((h) => h.role === 'CALLER').map((h) => h.text);
    const joined = callerTurns.join(' ');
    const intent = this.detectIntent(joined);

    const intentPhrase: Record<string, string> = {
      fee_enquiry: 'asked about fees and payment options',
      schedule_enquiry: 'asked about class timings and course duration',
      enrolment_process: 'asked how to enrol and what documents are needed',
      location_enquiry: 'asked where the institute is located',
      accreditation_enquiry: 'asked about accreditation and certificate recognition',
      course_details: 'asked for details about a course',
      refund: 'requested a refund',
      complaint: 'raised a complaint',
      visa: 'asked about visa or residency',
      attestation: 'asked about certificate attestation',
      corporate_pricing: 'enquired about corporate or group training',
    };

    const what = intent ? intentPhrase[intent] : undefined;
    const first = callerTurns[0]?.slice(0, 140) ?? 'No caller speech captured.';

    return {
      summary: what
        ? `Caller ${what}. Opening question: "${first}"`
        : `Caller enquiry. Opening question: "${first}"`,
      detectedIntent: intent,
      courseOfInterest: null,
    };
  }
}
