import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { MockCalendarProvider } from './mock-calendar.provider';
import { CalendarController } from './calendar.controller';
import { PublicSiteCalendarController, VoiceCalendarController } from './public-calendar.controller';

@Module({
  controllers: [CalendarController, PublicSiteCalendarController, VoiceCalendarController],
  providers: [CalendarService, MockCalendarProvider],
  // Exported for voice-agent provisioning, which needs ensureToken() to put
  // this centre's calendar token into the agent's tool URLs.
  exports: [CalendarService],
})
export class CalendarModule {}
