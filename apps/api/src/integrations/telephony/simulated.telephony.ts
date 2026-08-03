import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SCENARIOS, type CallScenario } from '@fit-ai/db/data';
import {
  NotImplementedByDriverError,
  type PlayAudioOptions,
  type TelephonyCallHandle,
  type TelephonyProvider,
  type TelephonySink,
} from '@fit-ai/contracts';

/**
 * Deterministic scenario runner.
 *
 * Replays a scripted FIT caller against the *real* orchestrator on a realistic
 * timeline. The caller's lines are scripted; the AI's replies are not — they
 * come from live retrieval over the knowledge base, so a broken KB or a broken
 * escalation rule shows up here exactly as it would on a real call. That is the
 * whole point: this is not a fixture, it is a substitute carrier.
 *
 * Every downstream system — state machine, routing, queueing, recordings,
 * transcripts, analytics, Bitrix — runs its production path.
 */
@Injectable()
export class SimulatedTelephony implements TelephonyProvider {
  readonly name = 'simulated';
  readonly supportsMedia = false;
  readonly supportsOutbound = false;

  private readonly log = new Logger(SimulatedTelephony.name);
  private sink?: TelephonySink;

  /** Timers per call, so a hangup cancels the rest of the script. */
  private readonly running = new Map<
    string,
    { timers: NodeJS.Timeout[]; cancelled: boolean; escalated: boolean; scenario: CallScenario }
  >();

  attachSink(sink: TelephonySink): void {
    this.sink = sink;
  }

  /* ------------------------------ provider API ---------------------------- */

  async answer(providerCallId: string): Promise<TelephonyCallHandle> {
    return { providerCallId, mediaSessionId: null };
  }

  /**
   * No audio to play. The orchestrator has already persisted the AI turn as a
   * message and transcript segment, so there is nothing to do but log — the
   * dashboard reads the same rows a real call would produce.
   */
  async play(providerCallId: string, opts: PlayAudioOptions): Promise<void> {
    this.log.debug(`[${providerCallId}] AI: ${opts.text.slice(0, 90)}`);
  }

  async bridgeAgent(
    providerCallId: string,
    agentUserId: string,
  ): Promise<{ mediaSessionId: string; agentToken: string | null }> {
    this.log.debug(`[${providerCallId}] bridged agent ${agentUserId} (no media)`);
    return { mediaSessionId: `sim-${providerCallId}`, agentToken: null };
  }

  async releaseAi(providerCallId: string): Promise<void> {
    this.log.debug(`[${providerCallId}] AI leg released`);
  }

  async hold(providerCallId: string, hold: boolean): Promise<void> {
    this.log.debug(`[${providerCallId}] hold=${hold}`);
  }

  async hangup(providerCallId: string): Promise<void> {
    this.cancel(providerCallId);
  }

  async dial(): Promise<TelephonyCallHandle> {
    throw new NotImplementedByDriverError('simulated', 'outbound dialling');
  }

  /* ------------------------------- simulation ----------------------------- */

  listScenarios(): CallScenario[] {
    return SCENARIOS;
  }

  getScenario(id: string): CallScenario | undefined {
    return SCENARIOS.find((s) => s.id === id);
  }

  /**
   * Start a scripted call.
   *
   * `speed` scales the scripted pauses: 1 = realistic, 0 = instant (used for
   * seeding traffic without waiting), >1 = slower for a live walkthrough.
   *
   * Returns as soon as the call is registered; the script continues on timers.
   */
  async startScenario(params: {
    scenario: CallScenario;
    toNumber: string;
    fromNumber?: string;
    speed?: number;
  }): Promise<{ providerCallId: string }> {
    if (!this.sink) throw new Error('SimulatedTelephony has no sink attached');

    const speed = params.speed ?? 1;
    const providerCallId = `sim-${randomUUID()}`;
    const fromNumber = params.fromNumber ?? this.randomCallerNumber(params.scenario.callerCountry);

    this.running.set(providerCallId, {
      timers: [],
      cancelled: false,
      escalated: false,
      scenario: params.scenario,
    });

    await this.sink.onInboundCall({
      providerCallId,
      fromNumber,
      toNumber: params.toNumber,
      callerName: params.scenario.callerName,
      receivedAt: new Date(),
      metadata: { scenarioId: params.scenario.id, simulated: true },
    });

    // Drive the script sequentially: each utterance waits for the previous AI
    // turn to be fully processed, which is what makes the timeline realistic
    // rather than a burst of overlapping turns.
    void this.driveScript(providerCallId, params.scenario, speed);

    return { providerCallId };
  }

  private async driveScript(
    providerCallId: string,
    scenario: CallScenario,
    speed: number,
  ): Promise<void> {
    const state = this.running.get(providerCallId);
    if (!state || !this.sink) return;

    let cursorMs = 0;

    try {
      for (const turn of scenario.turns) {
        await this.wait(providerCallId, turn.delayMs * speed);
        if (this.running.get(providerCallId)?.cancelled) return;

        const startMs = cursorMs + turn.delayMs;
        // ~150 wpm speaking rate, so transcript offsets look plausible against
        // the waveform on the conversation detail page.
        const durationMs = Math.max(900, (turn.text.split(/\s+/).length / 150) * 60_000);
        cursorMs = startMs + durationMs;

        await this.sink.onCallerUtterance({
          providerCallId,
          text: turn.text,
          startMs,
          endMs: cursorMs,
          confidence: 0.94,
        });

        // The orchestrator may have escalated on this turn. Once a human is
        // involved the script stops — a scripted caller cannot hold a
        // conversation with a live agent.
        const after = this.running.get(providerCallId);
        if (!after || after.cancelled || after.escalated) return;
      }

      // Caller abandons rather than waiting for an agent.
      if (scenario.abandonsInQueueAfterMs) {
        await this.wait(providerCallId, scenario.abandonsInQueueAfterMs * speed);
        if (this.running.get(providerCallId)?.cancelled) return;
        await this.sink.onCallerHangup(providerCallId);
        return;
      }

      // Otherwise the caller rings off shortly after their last line. If the
      // call escalated, the caller is waiting in a queue and it is the agent who
      // ends the call — firing this would hang up on them mid-wait.
      if (this.running.get(providerCallId)?.escalated) return;
      await this.wait(providerCallId, 2500 * speed);
      const state2 = this.running.get(providerCallId);
      if (!state2 || state2.cancelled || state2.escalated) return;
      await this.sink.onCallerHangup(providerCallId);
    } catch (error) {
      this.log.error(`[${providerCallId}] script failed: ${String(error)}`);
      await this.sink.onCallerHangup(providerCallId).catch(() => undefined);
    } finally {
      // Keep the entry alive while a human handles an escalated call, so a later
      // hangup can still clean up its abandon timer.
      if (!this.running.get(providerCallId)?.escalated) {
        this.running.delete(providerCallId);
      }
    }
  }

  /** Cancellable sleep — a hangup mid-script must not leave timers pending. */
  private wait(providerCallId: string, ms: number): Promise<void> {
    if (ms <= 0) return Promise.resolve();
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, ms);
      this.running.get(providerCallId)?.timers.push(timer);
    });
  }

  /**
   * Stop the remaining script. Called when the caller hangs up, an agent ends
   * the call, or the call otherwise completes.
   */
  cancel(providerCallId: string): void {
    const state = this.running.get(providerCallId);
    if (!state) return;
    state.cancelled = true;
    for (const t of state.timers) clearTimeout(t);
    this.running.delete(providerCallId);
  }

  /**
   * The AI handed off to a human.
   *
   * The conversational script stops here — a scripted caller cannot hold a
   * conversation with a live agent, and letting the script run would fire its
   * closing auto-hangup while the call is still queued, ending it before anyone
   * could answer.
   *
   * What replaces it depends on the scenario's intent: one written to test
   * abandonment keeps its abandon timer, so the caller still rings off while
   * waiting; every other scenario simply waits for an agent, and the agent ends
   * the call.
   */
  onEscalated(providerCallId: string): void {
    const state = this.running.get(providerCallId);
    if (!state || state.cancelled) return;

    // The flag matters as much as clearing the timers: driveScript resumes after
    // this returns and would otherwise create a fresh closing-hangup timer.
    state.escalated = true;
    for (const t of state.timers) clearTimeout(t);
    state.timers = [];

    const abandonAfterMs = state.scenario.abandonsInQueueAfterMs;
    if (!abandonAfterMs) {
      // Caller waits. Keep the entry so a later hangup can still clean up.
      this.log.debug(`[${providerCallId}] escalated — scripted caller now waiting for an agent`);
      return;
    }

    this.log.debug(`[${providerCallId}] escalated — will abandon in ${abandonAfterMs}ms`);
    const timer = setTimeout(() => {
      if (this.running.get(providerCallId)?.cancelled) return;
      void this.sink?.onCallerHangup(providerCallId);
    }, abandonAfterMs);
    state.timers.push(timer);
  }

  private randomCallerNumber(countryCode: string): string {
    if (countryCode === '+971') {
      const prefixes = ['50', '52', '54', '55', '56', '58'];
      const p = prefixes[Math.floor(Math.random() * prefixes.length)]!;
      return `+971${p}${Math.floor(1_000_000 + Math.random() * 9_000_000)}`;
    }
    return `${countryCode}${Math.floor(100_000_000 + Math.random() * 900_000_000)}`;
  }
}
