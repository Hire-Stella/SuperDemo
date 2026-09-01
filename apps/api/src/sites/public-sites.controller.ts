import { Controller, Get, HttpCode, NotFoundException, Param, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { type PublicSiteDto, SiteLeadInput, type SiteLeadOutput } from '@superdemo/contracts';
import { SitesService } from './sites.service';
import { Public } from '../auth/guards';
import { ZodBody } from '../shared/zod.pipe';

/**
 * The only unauthenticated, tenant-touching surface on the platform.
 *
 * Everything about it is deliberately narrow: two routes, one of which is a
 * read, and the org is always derived from the slug in the path — never from a
 * body field, a header, or anything else a caller controls beyond which page
 * they asked for.
 *
 * Grouped in its own controller rather than added to SitesController with a
 * route-level @Public(): a class where every route is public is a thing a
 * reviewer can check at a glance, whereas one public route among five
 * authenticated ones is a thing a reviewer has to notice.
 */
@Public()
@Controller('public/sites')
export class PublicSitesController {
  constructor(private readonly sites: SitesService) {}

  @Get(':slug')
  async bySlug(@Param('slug') slug: string): Promise<PublicSiteDto> {
    const site = await this.sites.publicBySlug(slug);
    // One 404 for an unknown slug, a suspended centre and an unpublished page
    // alike — see publicBySlug. A probe should not be able to distinguish them.
    if (!site) throw new NotFoundException('No page here');
    return site;
  }

  /**
   * A callback request.
   *
   * Ten a minute per address, against the app-wide 300: a landing-page form is
   * the cheapest thing on the platform to submit in a loop, and the cost of
   * abuse is rows in a client's contact list plus outbound calls to numbers
   * nobody asked us to ring.
   *
   * Not tighter, because the limit is keyed by IP and a lot of genuine traffic
   * shares one — a page linked from Instagram reaches a dozen people behind the
   * same mobile carrier NAT, and an office all submits from one address. A real
   * visitor submits once, so ten leaves room for the crowd without leaving room
   * for a script.
   */
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post(':slug/leads')
  @HttpCode(200)
  lead(
    @Param('slug') slug: string,
    @ZodBody(SiteLeadInput) body: SiteLeadInput,
    @Req() req: Request,
  ): Promise<SiteLeadOutput> {
    return this.sites.captureLead(slug, body, {
      ip: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }
}
