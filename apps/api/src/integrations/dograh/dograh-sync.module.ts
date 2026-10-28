import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../../analytics/analytics.module';
import { CalendarModule } from '../../calendar/calendar.module';
import { AiLiveController } from './ai-live.controller';
import { DograhSyncService } from './dograh-sync.service';

/** Imports Dograh calls into mapped centres, and serves their live board. */
@Module({
  imports: [AnalyticsModule, CalendarModule],
  controllers: [AiLiveController],
  providers: [DograhSyncService],
})
export class DograhSyncModule {}
