import { Controller, Get, Post } from '@nestjs/common';
import {
  type AgentSummary,
  SetPresenceInput,
  type SessionUser,
} from '@superdemo/contracts';
import { PresenceService } from './presence.service';
import { CurrentUser } from '../auth/guards';
import { ZodBody } from '../shared/zod.pipe';

@Controller('presence')
export class PresenceController {
  constructor(private readonly presence: PresenceService) {}

  @Get('roster')
  roster(): Promise<AgentSummary[]> {
    return this.presence.roster();
  }

  @Post()
  async setMine(
    @CurrentUser() user: SessionUser,
    @ZodBody(SetPresenceInput) body: SetPresenceInput,
  ): Promise<{ ok: true }> {
    await this.presence.setByAgent(user.id, body.status, body.reason);
    return { ok: true };
  }
}
