import { Controller, Get, Put, Query } from '@nestjs/common';
import { type SiteDto, type SiteLeadRow, UpdateSiteInput } from '@superdemo/contracts';
import { SitesService } from './sites.service';
import { Roles } from '../auth/guards';
import { ZodBody } from '../shared/zod.pipe';

/**
 * A centre's own landing page.
 *
 * Tenant-scoped like everything else, so "mine" needs no id — the request's org
 * context is the only answer it could have. ADMIN and SUPERVISOR only: the page
 * is public-facing marketing, which is not an agent's to edit.
 */
@Controller('sites')
export class SitesController {
  constructor(private readonly sites: SitesService) {}

  @Roles('ADMIN', 'SUPERVISOR')
  @Get('mine')
  mine(): Promise<SiteDto> {
    return this.sites.mine();
  }

  @Roles('ADMIN', 'SUPERVISOR')
  @Put('mine')
  update(@ZodBody(UpdateSiteInput) body: UpdateSiteInput): Promise<SiteDto> {
    return this.sites.update(body);
  }

  @Roles('ADMIN', 'SUPERVISOR')
  @Get('mine/leads')
  leads(@Query('limit') limit?: string): Promise<SiteLeadRow[]> {
    const parsed = Number(limit);
    return this.sites.leads(Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 200) : 50);
  }
}
