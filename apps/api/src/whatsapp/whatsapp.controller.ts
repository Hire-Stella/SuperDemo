import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { z } from 'zod';
import {
  ClaimConversationInput,
  SendMessageInput,
  SimulateWhatsAppInput,
  type SessionUser,
} from '@superdemo/contracts';
import { WhatsAppService } from './whatsapp.service';
import { CurrentUser, Roles } from '../auth/guards';
import { ZodBody } from '../shared/zod.pipe';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsapp: WhatsAppService) {}

  @Get('scenarios')
  scenarios() {
    return this.whatsapp.listScenarios().map((s) => ({
      id: s.id,
      title: s.title,
      callerName: s.callerName,
      skill: s.skill,
      escalates: s.escalates,
      messageCount: s.messages.length,
    }));
  }

  /** Agent takes over a thread from the AI. */
  @Post('claim')
  @HttpCode(200)
  async claim(
    @ZodBody(ClaimConversationInput) body: { conversationId: string },
    @CurrentUser() user: SessionUser,
  ) {
    await this.whatsapp.claim(body.conversationId, user.id);
    return { ok: true };
  }

  @Post('send')
  @HttpCode(200)
  async send(@ZodBody(SendMessageInput) body: SendMessageInput, @CurrentUser() user: SessionUser) {
    await this.whatsapp.sendAsAgent({
      conversationId: body.conversationId,
      userId: user.id,
      text: body.text,
    });
    return { ok: true };
  }

  @Post('close')
  @HttpCode(200)
  async close(@ZodBody(z.object({ conversationId: z.string() })) body: { conversationId: string }) {
    await this.whatsapp.close(body.conversationId);
    return { ok: true };
  }

  /* ------------------------------- simulator ------------------------------ */

  @Roles('ADMIN', 'SUPERVISOR')
  @Post('simulate/scenario')
  @HttpCode(202)
  simulateScenario(
    @ZodBody(z.object({ scenarioId: z.string().optional() })) body: { scenarioId?: string },
  ) {
    return this.whatsapp.simulateScenario(body.scenarioId);
  }

  @Roles('ADMIN', 'SUPERVISOR')
  @Post('simulate/message')
  @HttpCode(202)
  async simulateMessage(@ZodBody(SimulateWhatsAppInput) body: SimulateWhatsAppInput) {
    // Returns the AI's reply so the handset mock can render the customer's side.
    return this.whatsapp.simulateMessage(body);
  }
}
