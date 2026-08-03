import { Controller, Get } from '@nestjs/common';
import {
  type ActiveCallRow,
  type AgentScorecard,
  type AnalyticsOverview,
  AnalyticsRangeQuery,
  type LiveOpsSnapshot,
} from '@fit-ai/contracts';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../auth/guards';
import { ZodQuery } from '../shared/zod.pipe';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  /** Live ops tiles. Polled as a fallback; WebSocket pushes keep it fresh. */
  @Get('live')
  live(): Promise<LiveOpsSnapshot> {
    return this.analytics.liveSnapshot();
  }

  @Get('active-calls')
  activeCalls(): Promise<ActiveCallRow[]> {
    return this.analytics.activeCalls();
  }

  @Roles('ADMIN', 'SUPERVISOR')
  @Get('overview')
  overview(@ZodQuery(AnalyticsRangeQuery) query: AnalyticsRangeQuery): Promise<AnalyticsOverview> {
    return this.analytics.overview(query);
  }

  @Roles('ADMIN', 'SUPERVISOR')
  @Get('agents')
  agents(@ZodQuery(AnalyticsRangeQuery) query: AnalyticsRangeQuery): Promise<AgentScorecard[]> {
    return this.analytics.agentScorecards(query);
  }
}
