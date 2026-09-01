import { Module } from '@nestjs/common';
import { SitesService } from './sites.service';
import { SitesController } from './sites.controller';
import { PublicSitesController } from './public-sites.controller';

@Module({
  controllers: [SitesController, PublicSitesController],
  providers: [SitesService],
  // Exported so provisioning can create a page inside the same transaction that
  // creates the centre — see PlatformController.
  exports: [SitesService],
})
export class SitesModule {}
