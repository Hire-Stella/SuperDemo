import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MaintenanceService } from './maintenance.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { ConfigModule, ENV } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards';
import { RealtimeModule } from './realtime/realtime.module';
import { PresenceModule } from './presence/presence.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { OutboxModule } from './outbox/outbox.module';
import { LlmModule } from './integrations/llm/llm.module';
import { StorageModule } from './integrations/storage/storage.module';
import { TelephonyModule } from './integrations/telephony/telephony.module';
import { CrmModule } from './integrations/crm/crm.module';
import { CallsModule } from './calls/calls.module';
import { ConversationsModule } from './conversations/conversations.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NumbersModule } from './numbers/numbers.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { CrmSyncModule } from './crm/crm-sync.module';
import { AdminModule } from './admin/admin.module';
import { MediaModule } from './media/media.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),

    AuthModule,
    RealtimeModule,
    PresenceModule,
    KnowledgeModule,
    OutboxModule,

    // Integration drivers — each selects its implementation from env at boot.
    LlmModule,
    StorageModule,
    TelephonyModule,
    CrmModule,

    // Domain
    CallsModule,
    ConversationsModule,
    AnalyticsModule,
    NumbersModule,
    WhatsAppModule,
    CrmSyncModule,
    AdminModule,
    MediaModule,
  ],
  controllers: [HealthController],
  providers: [
    MaintenanceService,
    // Auth is global and opt-out: a new controller is protected by default, and
    // exposing one requires an explicit @Public() that shows up in review.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
