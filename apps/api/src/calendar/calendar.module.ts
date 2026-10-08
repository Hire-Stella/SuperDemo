import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { MockCalendarProvider } from './mock-calendar.provider';
import { CalendarController } from './calendar.controller';
import {
  CalcomWebhookController,
  PublicSiteCalendarController,
  VoiceCalendarController,
} from './public-calendar.controller';
import { CalcomService } from './calcom/calcom.service';
import { CalcomCalendarProvider } from './calcom/calcom-calendar.provider';

@Module({
  controllers: [
    CalendarController,
    PublicSiteCalendarController,
    VoiceCalendarController,
    CalcomWebhookController,
  ],
  providers: [CalendarService, MockCalendarProvider, CalcomService, CalcomCalendarProvider],
  // Exported for voice-agent provisioning, which needs ensureToken() to put
  // this centre's calendar token into the agent's tool URLs.
  exports: [CalendarService],
})
export class CalendarModule {}
