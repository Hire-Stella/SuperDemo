import { Module } from '@nestjs/common';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';
import { RoutingService } from './routing.service';
import { AiOrchestrator } from './ai-orchestrator.service';

@Module({
  controllers: [CallsController],
  providers: [CallsService, RoutingService, AiOrchestrator],
  exports: [CallsService, RoutingService, AiOrchestrator],
})
export class CallsModule {}
