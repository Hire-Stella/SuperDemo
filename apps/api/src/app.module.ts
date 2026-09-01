import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MaintenanceService } from './maintenance.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { ConfigModule, ENV } from './config/config.module';
import { TenancyModule } from './tenancy/tenancy.module';
import { TenantMiddleware } from './tenancy/tenant.middleware';
import { PlatformModule } from './platform/platform.module';
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
import { ElevenLabsModule } from './integrations/elevenlabs/elevenlabs.module';
import { ElevenLabsController } from './integrations/elevenlabs/elevenlabs.controller';
import { TtsModule } from './integrations/tts/tts.module';
import { CallsModule } from './calls/calls.module';
import { ConversationsModule } from './conversations/conversations.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NumbersModule } from './numbers/numbers.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { CrmSyncModule } from './crm/crm-sync.module';
import { AdminModule } from './admin/admin.module';
import { SitesModule } from './sites/sites.module';
import { MediaModule } from './media/media.module';
import { ReportsModule } from './reports/reports.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule,
    // Before PrismaModule: PrismaService takes TenantContext in its constructor.
    TenancyModule,
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
    ElevenLabsModule,
    TtsModule,
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
    SitesModule,
    MediaModule,
    ReportsModule,

    // Platform administration — organisations themselves, superadmin only.
    PlatformModule,
  ],
  controllers: [HealthController, ElevenLabsController],
  providers: [
    MaintenanceService,
    // Auth is global and opt-out: a new controller is protected by default, and
    // exposing one requires an explicit @Public() that shows up in review.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  /**
   * Every route gets a tenant context, including @Public() ones — login has no
   * org yet, but the context must exist before the guard can fill it in, and a
   * per-route opt-in is a filter someone would forget.
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
