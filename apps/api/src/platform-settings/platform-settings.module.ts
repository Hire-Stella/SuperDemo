import { Global, Module } from '@nestjs/common';
import { PlatformSettingsService } from './platform-settings.service';
import { PlatformSettingsController } from './platform-settings.controller';

/**
 * Global because the reader is DograhService, which is itself global and
 * injected far from the platform page that writes it.
 *
 * The controller needs DograhService and EnrichmentService, both of which come
 * from global modules — so nothing is imported here, and DograhService (which
 * reads this module's service) cannot form a cycle with it.
 */
@Global()
@Module({
  controllers: [PlatformSettingsController],
  providers: [PlatformSettingsService],
  exports: [PlatformSettingsService],
})
export class PlatformSettingsModule {}
