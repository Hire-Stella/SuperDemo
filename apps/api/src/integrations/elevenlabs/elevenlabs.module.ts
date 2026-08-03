import { Global, Module } from '@nestjs/common';
import { ElevenLabsService } from './elevenlabs.service';
import { ElevenLabsTelephony } from './elevenlabs.telephony';

/**
 * Exported globally (without the controller) so the telephony module can select
 * the driver at boot. The controller is registered separately in AppModule,
 * because it depends on CallsService and would otherwise create a cycle.
 */
@Global()
@Module({
  providers: [ElevenLabsService, ElevenLabsTelephony],
  exports: [ElevenLabsService, ElevenLabsTelephony],
})
export class ElevenLabsModule {}
