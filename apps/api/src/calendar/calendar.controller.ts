import { Controller, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import {
  type AvailabilityOutput,
  type BookingRow,
  CalendarConfig,
  type CalendarConfigView,
  CreateBookingInput,
} from '@superdemo/contracts';
import { CalendarService } from './calendar.service';
import { Roles } from '../auth/guards';
import { ZodBody } from '../shared/zod.pipe';

/**
 * The centre's own appointment book.
 *
 * Reading is everyone's: an agent on a call needs to see who is coming in
 * tomorrow as much as anyone. Writing — booking, cancelling, and above all
 * changing the hours — is ADMIN and SUPERVISOR, the same split as the website
 * and the demo dialers, because a wrong opening time is offered to every
 * visitor and every caller the voice agent speaks to.
 *
 * A SUPERADMIN inside a centre gets the reads for free (the guard lets an
 * operator GET any tenant route) and none of the writes, which the guard
 * refuses on its own.
 */
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  @Roles('ADMIN', 'SUPERVISOR', 'AGENT')
  @Get('bookings')
  bookings(@Query('from') from?: string, @Query('to') to?: string): Promise<BookingRow[]> {
    return this.calendar.list(from, to);
  }

  @Roles('ADMIN', 'SUPERVISOR', 'AGENT')
  @Get('availability')
  availability(@Query('date') date: string): Promise<AvailabilityOutput> {
    return this.calendar.availability(date);
  }

  @Roles('ADMIN', 'SUPERVISOR')
  @Post('bookings')
  create(@ZodBody(CreateBookingInput) body: CreateBookingInput): Promise<BookingRow> {
    return this.calendar.create(body, 'dashboard');
  }

  @Roles('ADMIN', 'SUPERVISOR')
  @Post('bookings/:id/cancel')
  @HttpCode(200)
  cancel(@Param('id') id: string): Promise<BookingRow> {
    return this.calendar.cancel(id);
  }

  @Roles('ADMIN', 'SUPERVISOR', 'AGENT')
  @Get('config')
  config(): Promise<CalendarConfigView> {
    return this.calendar.config();
  }

  @Roles('ADMIN', 'SUPERVISOR')
  @Put('config')
  updateConfig(@ZodBody(CalendarConfig) body: CalendarConfig): Promise<CalendarConfigView> {
    return this.calendar.updateConfig(body);
  }
}
