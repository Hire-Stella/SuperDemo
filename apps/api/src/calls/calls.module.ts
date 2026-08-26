import { Module } from '@nestjs/common';
import { CallsController } from './calls.controller';
import { CampaignsController } from './campaigns.controller';
import { CallsService } from './calls.service';
import { DialerService } from './dialer.service';
import { RoutingService } from './routing.service';
import { AiOrchestrator } from './ai-orchestrator.service';

@Module({
  controllers: [CallsController, CampaignsController],
  providers: [CallsService, DialerService, RoutingService, AiOrchestrator],
  exports: [CallsService, DialerService, RoutingService, AiOrchestrator],
})
export class CallsModule {}
