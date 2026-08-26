import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  EscalationRules,
  type ApiEnv,
  type BrainResponse,
  type ConversationTurn,
  type EscalationDecision,
  type EscalationReason,
  type LlmProvider,
  type Skill,
} from '@fit-ai/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { LLM_PROVIDER } from '../integrations/llm/llm.module';
import { ENV } from '../config/config.module';

export interface TurnResult {
  reply: string;
  brain: BrainResponse;
  escalation: EscalationDecision;
  latencyMs: number;
  turn: number;
  /** Category of the top retrieved document, used for skills-based routing. */
  retrievedCategory: Skill | null;
}

/**
 * Runs one AI turn and decides whether to hand off.
 *
 * The split matters: the *brain* produces an answer and a confidence; the
 * *orchestrator* owns the escalation policy. Keeping the policy here means it is
 * identical across the scripted, Claude and Ollama drivers, and it is
 * configurable per AI agent by the client's own admin rather than buried in a
 * prompt.
 */
@Injectable()
export class AiOrchestrator {
  private readonly log = new Logger(AiOrchestrator.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly knowledge: KnowledgeService,
    @Inject(LLM_PROVIDER) private readonly brain: LlmProvider,
    @Inject(ENV) private readonly env: ApiEnv,
  ) {}

  get driverName(): string {
    return this.brain.name;
  }

  /**
   * Handle one caller utterance.
   *
   * Retrieval runs first so the escalation decision can be made on real
   * evidence of coverage rather than on the model's self-assessment.
   */
  async runTurn(params: {
    conversationId: string;
    aiAgentId: string;
    utterance: string;
    history: ConversationTurn[];
    /** Course established earlier in the call — anchors follow-up questions. */
    topicHint?: string | null;
  }): Promise<TurnResult> {
    const started = Date.now();

    const agent = await this.prisma.aiAgent.findUniqueOrThrow({
      where: { id: params.aiAgentId },
    });
    const rules = EscalationRules.parse(agent.escalationRules);

    const context = await this.knowledge.search({
      query: this.anchorQuery(params.utterance, params.topicHint),
      limit: 4,
    });
    const turn = params.history.filter((h) => h.role === 'CALLER').length + 1;

    const brain = await this.brain.respond({
      history: params.history,
      utterance: params.utterance,
      systemPrompt: agent.systemPrompt,
      context,
      turn,
      handoffKeywords: rules.handoffKeywords,
    });

    const escalation = this.decide({
      utterance: params.utterance,
      brain,
      rules,
      turn,
    });

    const latencyMs = Date.now() - started;
    if (latencyMs > 1500) {
      this.log.warn(`AI turn took ${latencyMs}ms — above the conversational comfort threshold`);
    }

    return {
      reply: brain.reply,
      brain,
      escalation,
      latencyMs,
      turn,
      retrievedCategory: context[0]?.category ?? null,
    };
  }

  /**
   * Carry the conversation's topic into retrieval.
   *
   * Real callers are anaphoric: having said "the ABA certification", their next
   * question is "and how much does it cost?" — which on its own contains no
   * course term at all. Searching that bare phrase retrieves whichever document
   * happens to mention fees, and the assistant confidently quotes the wrong
   * course's price. That is worse than not answering.
   *
   * So once a course is established, it is prepended to every follow-up query
   * unless the caller names a different one.
   */
  private anchorQuery(utterance: string, topicHint?: string | null): string {
    if (!topicHint) return utterance;

    // If the caller has named a course themselves, respect the change of subject
    // rather than dragging the old topic along.
    const namesAnotherCourse = /\b(diploma|certification|course|programme|program|preparation|training)\b/i.test(
      utterance,
    );
    if (namesAnotherCourse) return utterance;

    // Weight the utterance over the anchor by repeating it: the anchor should
    // disambiguate, not dominate.
    return `${topicHint}. ${utterance} ${utterance}`;
  }

  /**
   * Escalation policy, in priority order. The order is deliberate: an explicit
   * request for a person outranks everything, because arguing with a caller who
   * asked for a human is the fastest way to make them angry.
   */
  private decide(params: {
    utterance: string;
    brain: BrainResponse;
    rules: EscalationRules;
    turn: number;
  }): EscalationDecision {
    const { brain, rules, turn, utterance } = params;

    if (brain.wantsHuman) {
      return {
        escalate: true,
        reason: 'CALLER_REQUESTED' satisfies EscalationReason,
        detail: 'Caller asked to speak to a person, or the assistant judged a human was needed.',
      };
    }

    // Intents the institute has decided the AI must never handle alone —
    // refunds, complaints, visas, attestation, corporate pricing.
    if (brain.detectedIntent) {
      const matched = rules.humanOnlyIntents.find((i) =>
        brain.detectedIntent!.toLowerCase().includes(i.toLowerCase()),
      );
      if (matched) {
        return {
          escalate: true,
          reason: 'HUMAN_ONLY_INTENT',
          detail: `Intent "${brain.detectedIntent}" is configured as human-only (matched "${matched}").`,
        };
      }
    }

    if (brain.sentiment < rules.sentimentFloor) {
      return {
        escalate: true,
        reason: 'NEGATIVE_SENTIMENT',
        detail: `Caller sentiment ${brain.sentiment.toFixed(2)} is below the floor of ${rules.sentimentFloor}.`,
      };
    }

    if (brain.confidence < rules.confidenceFloor) {
      return {
        escalate: true,
        reason: brain.confidence < 0.18 ? 'OUT_OF_SCOPE' : 'LOW_CONFIDENCE',
        detail:
          `Knowledge base coverage ${(brain.confidence * 100).toFixed(0)}% is below the ` +
          `${(rules.confidenceFloor * 100).toFixed(0)}% floor — handing off rather than guessing.`,
      };
    }

    if (turn >= rules.maxTurns) {
      return {
        escalate: true,
        reason: 'MAX_TURNS',
        detail: `Reached the ${rules.maxTurns}-turn cap without resolving the enquiry.`,
      };
    }

    void utterance;
    return { escalate: false, reason: null, detail: null };
  }

  /** Post-call summary for the CRM timeline and the screen-pop. */
  summarise(history: ConversationTurn[]) {
    return this.brain.summarise(history);
  }

  /** The consent line spoken before anything else, where enabled. */
  async consentAnnouncement(): Promise<string | null> {
    if (!this.env.RECORDING_CONSENT_ENABLED) return null;
    const settings = await this.prisma.setting.findFirst();
    if (settings && !settings.recordingConsentOn) return null;
    return (
      settings?.recordingConsentText ??
      'This call may be recorded for quality and training purposes.'
    );
  }

  driverNames(): { stt: string; llm: string; tts: string } {
    return {
      stt: this.env.STT_DRIVER,
      llm: this.brain.name,
      tts: this.env.TTS_DRIVER,
    };
  }
}
