import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import {
  AnswerCallInput,
  BrowserCallTurnInput,
  type BrowserCallTurnOutput,
  CompleteWrapupInput,
  HangupCallInput,
  HoldCallInput,
  RejectCallInput,
  type ScenarioDto,
  type ScreenPopPayload,
  SimulateCallInput,
  StartBrowserCallInput,
  TransferCallInput,
  type SessionUser,
} from '@fit-ai/contracts';
import { CallsService } from './calls.service';
import { CurrentUser, Roles } from '../auth/guards';
import { ZodBody } from '../shared/zod.pipe';
import { SimulatedTelephony } from '../integrations/telephony/simulated.telephony';
import { BrowserTelephony } from '../integrations/telephony/browser.telephony';
import { PrismaService } from '../prisma/prisma.service';

@Controller('calls')
export class CallsController {
  constructor(
    private readonly calls: CallsService,
    private readonly simulated: SimulatedTelephony,
    private readonly browser: BrowserTelephony,
    private readonly prisma: PrismaService,
  ) {}

  /* ---------------------------- agent softphone --------------------------- */

  @Post('answer')
  @HttpCode(200)
  answer(@ZodBody(AnswerCallInput) body: { callId: string }, @CurrentUser() user: SessionUser) {
    return this.calls.answerCall(body.callId, user.id);
  }

  @Post('reject')
  @HttpCode(200)
  async reject(
    @ZodBody(RejectCallInput) body: { callId: string; reason?: string },
    @CurrentUser() user: SessionUser,
  ) {
    await this.calls.rejectCall(body.callId, user.id, body.reason);
    return { ok: true };
  }

  @Post('hangup')
  @HttpCode(200)
  async hangup(@ZodBody(HangupCallInput) body: { callId: string }, @CurrentUser() user: SessionUser) {
    await this.calls.agentHangup(body.callId, user.id);
    return { ok: true };
  }

  @Post('hold')
  @HttpCode(200)
  async hold(@ZodBody(HoldCallInput) body: { callId: string; hold: boolean }) {
    await this.calls.holdCall(body.callId, body.hold);
    return { ok: true };
  }

  @Post('transfer')
  @HttpCode(200)
  async transfer(
    @ZodBody(TransferCallInput)
    body: { callId: string; targetQueueId?: string; targetUserId?: string },
  ) {
    await this.calls.transferCall(body);
    return { ok: true };
  }

  @Post('wrapup')
  @HttpCode(200)
  async wrapup(
    @ZodBody(CompleteWrapupInput) body: CompleteWrapupInput,
    @CurrentUser() user: SessionUser,
  ) {
    await this.calls.completeWrapup(body.callId, user.id, body.disposition, body.notes);
    return { ok: true };
  }

  /** Re-fetch a screen-pop, e.g. after a page reload mid-ring. */
  @Get(':id/screen-pop')
  screenPop(
    @Param('id') callId: string,
    @CurrentUser() user: SessionUser,
  ): Promise<ScreenPopPayload> {
    return this.calls.buildScreenPop(callId, user.id);
  }

  /* ------------------------------- simulator ------------------------------ */

  @Get('scenarios')
  scenarios(): ScenarioDto[] {
    return this.simulated.listScenarios().map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      skill: s.skill,
      escalates: s.escalates,
      expectedTurns: s.turns.length,
    }));
  }

  /**
   * Start a scripted call. This is the demo's workhorse: it drives the real
   * pipeline end to end without a carrier.
   */
  @Roles('ADMIN', 'SUPERVISOR')
  @Post('simulate')
  @HttpCode(202)
  async simulate(@ZodBody(SimulateCallInput) body: SimulateCallInput) {
    const scenarios = this.simulated.listScenarios();
    const scenario = body.scenarioId
      ? this.simulated.getScenario(body.scenarioId)
      : scenarios[Math.floor(Math.random() * scenarios.length)];
    if (!scenario) return { error: 'Scenario not found' };

    const toNumber = body.toNumber ?? (await this.defaultInboundNumber());
    const { providerCallId } = await this.simulated.startScenario({
      scenario,
      toNumber,
      fromNumber: body.fromNumber,
      speed: body.speed,
    });

    return { providerCallId, scenarioId: scenario.id, title: scenario.title };
  }

  /* --------------------------- browser call path -------------------------- */

  /**
   * Start a live browser call. The caller's tab then POSTs each recognised
   * utterance to `/calls/browser/turn` and speaks the reply it gets back.
   */
  @Post('browser/start')
  @HttpCode(201)
  async startBrowserCall(@ZodBody(StartBrowserCallInput) body: StartBrowserCallInput) {
    const toNumber = body.toNumber ?? (await this.defaultInboundNumber());
    const fromNumber = body.fromNumber ?? '+971500000000';

    const { providerCallId } = await this.browser.startBrowserCall({
      toNumber,
      fromNumber,
      callerName: body.callerName,
    });

    const call = await this.prisma.call.findUniqueOrThrow({
      where: { providerCallId },
      select: { id: true, conversationId: true },
    });

    // The greeting is already persisted as the first AI message; hand it back so
    // the browser can speak it immediately.
    const greeting = await this.prisma.message.findFirst({
      where: { conversationId: call.conversationId, role: 'AI' },
      orderBy: { createdAt: 'asc' },
      select: { text: true },
    });

    return {
      callId: call.id,
      conversationId: call.conversationId,
      providerCallId,
      greeting: greeting?.text ?? '',
    };
  }

  /** One caller utterance → one AI reply. */
  @Post('browser/turn')
  @HttpCode(200)
  async browserTurn(
    @ZodBody(BrowserCallTurnInput) body: BrowserCallTurnInput,
  ): Promise<BrowserCallTurnOutput> {
    const call = await this.prisma.call.findUniqueOrThrow({
      where: { id: body.callId },
      select: { providerCallId: true },
    });

    const result = await this.calls.handleUtterance({
      providerCallId: call.providerCallId,
      text: body.text,
      startMs: body.startMs,
      endMs: body.endMs,
      confidence: body.confidence,
    });

    return {
      reply: result.reply,
      escalated: result.escalated,
      escalationReason: result.escalationReason,
      endCall: result.endCall,
      citations: result.citations,
      latencyMs: result.latencyMs,
      turn: result.turn,
    };
  }

  @Post('browser/hangup')
  @HttpCode(200)
  async browserHangup(@ZodBody(z.object({ callId: z.string() })) body: { callId: string }) {
    const call = await this.prisma.call.findUniqueOrThrow({
      where: { id: body.callId },
      select: { providerCallId: true },
    });
    await this.calls.onCallerHangup(call.providerCallId);
    return { ok: true };
  }

  /** Fall back to their published admissions line. */
  private async defaultInboundNumber(): Promise<string> {
    const number = await this.prisma.phoneNumber.findFirst({
      where: { status: 'ASSIGNED' },
      orderBy: { createdAt: 'asc' },
      select: { e164: true },
    });
    return number?.e164 ?? '+971528876388';
  }
}
