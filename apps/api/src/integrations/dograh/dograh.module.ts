import { Global, Module } from '@nestjs/common';
import { DograhService } from './dograh.service';
import { DograhController } from './dograh.controller';
import { DemoCallsController } from './demo-calls.controller';

/**
 * Global because two very different callers need it: the authenticated website
 * editor, and the public landing page's lead endpoint. Exporting one service
 * rather than wiring it into both modules keeps the credential-resolving logic
 * in exactly one place.
 */
@Global()
@Module({
  controllers: [DograhController, DemoCallsController],
  providers: [DograhService],
  exports: [DograhService],
})
export class DograhModule {}
