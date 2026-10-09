import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../../analytics/analytics.module';
import { AiLiveController } from './ai-live.controller';
import { DograhSyncService } from './dograh-sync.service';

/** Imports Dograh calls into mapped centres, and serves their live board. */
@Module({
  imports: [AnalyticsModule],
  controllers: [AiLiveController],
  providers: [DograhSyncService],
})
export class DograhSyncModule {}
