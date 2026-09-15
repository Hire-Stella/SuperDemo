import { Module } from '@nestjs/common';
import { PlatformController } from './platform.controller';
import { PlatformVoiceController } from './platform-voice.controller';

// AuthService comes from the global AuthModule; nothing else here is shared.
@Module({
  controllers: [PlatformController, PlatformVoiceController],
})
export class PlatformModule {}
