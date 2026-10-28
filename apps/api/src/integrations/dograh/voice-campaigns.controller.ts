import { Controller, Get, HttpCode, Param, ParseIntPipe, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  CreateVoiceCampaignInput,
  type CreateVoiceCampaignResult,
  type VoiceCampaignDetail,
  type VoiceCampaignRow,
  type VoiceCampaignsView,
} from '@superdemo/contracts';
import { TenantContext } from '../../tenancy/tenant-context.service';
import { Roles } from '../../auth/guards';
import { ZodBody } from '../../shared/zod.pipe';
import { VoiceCampaignsService } from './voice-campaigns.service';

/**
 * The Campaign tab: campaigns that run on the voice platform itself.
 * See VoiceCampaignsService for why nothing here dials.
 */
@Roles('ADMIN', 'SUPERVISOR')
@Controller('voice-campaigns')
export class VoiceCampaignsController {
  constructor(
    private readonly campaigns: VoiceCampaignsService,
    private readonly tenants: TenantContext,
  ) {}

  @Get()
  view(): Promise<VoiceCampaignsView> {
    return this.campaigns.view(this.tenants.requireOrgId());
  }

  /** Upload the contacts and create the campaign, as a draft. */
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  create(@ZodBody(CreateVoiceCampaignInput) body: CreateVoiceCampaignInput): Promise<CreateVoiceCampaignResult> {
    return this.campaigns.create(this.tenants.requireOrgId(), body);
  }

  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number): Promise<VoiceCampaignDetail> {
    return this.campaigns.detail(this.tenants.requireOrgId(), id);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post(':id/start')
  @HttpCode(200)
  start(@Param('id', ParseIntPipe) id: number): Promise<VoiceCampaignRow> {
    return this.campaigns.action(this.tenants.requireOrgId(), id, 'start');
  }

  @Post(':id/pause')
  @HttpCode(200)
  pause(@Param('id', ParseIntPipe) id: number): Promise<VoiceCampaignRow> {
    return this.campaigns.action(this.tenants.requireOrgId(), id, 'pause');
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post(':id/resume')
  @HttpCode(200)
  resume(@Param('id', ParseIntPipe) id: number): Promise<VoiceCampaignRow> {
    return this.campaigns.action(this.tenants.requireOrgId(), id, 'resume');
  }
}
