import { Module } from '@nestjs/common';
import { CallsModule } from '../calls/calls.module';
import { WhatsAppController } from './whatsapp.controller';
import { MockWhatsApp, WhatsAppService } from './whatsapp.service';

@Module({
  imports: [CallsModule],
  controllers: [WhatsAppController],
  providers: [WhatsAppService, MockWhatsApp],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
