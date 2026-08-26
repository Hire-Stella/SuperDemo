import { Module } from '@nestjs/common';
import { PlatformController } from './platform.controller';

// AuthService comes from the global AuthModule; nothing else here is shared.
@Module({
  controllers: [PlatformController],
})
export class PlatformModule {}
