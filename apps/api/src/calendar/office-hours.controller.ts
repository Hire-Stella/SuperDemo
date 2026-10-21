import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/guards';
import { checkOfficeHours, officeHoursFrom, type OfficeHoursCheck } from './office-hours';

/**
 * A voice agent's "is the office open then?" check, as a plain HTTP tool.
 *
 * Public and stateless: the hours come from the tool's own preset query
 * parameters, nothing is read from or written to any centre, so there is no
 * token. Always 200 with a `speech` sentence, for the same reason as the
 * calendar tools: a sentence gets read out, an error gets a vague apology.
 *
 *   GET /api/public/office-hours/check?day=tomorrow&time=3pm
 *       &tz=Asia/Dubai&days=1,2,3,4,5&open=09:00&close=17:00&breaks=1@12:00-13:00
 */
@Public()
@Controller('public/office-hours')
export class OfficeHoursController {
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @Get('check')
  check(
    @Query('day') day = '',
    @Query('time') time = '',
    @Query('tz') tz?: string,
    @Query('days') days?: string,
    @Query('open') open?: string,
    @Query('close') close?: string,
    @Query('breaks') breaks?: string,
  ): OfficeHoursCheck {
    return checkOfficeHours(
      String(day).slice(0, 200),
      String(time).slice(0, 100),
      officeHoursFrom({ tz, days, open, close, breaks }),
    );
  }
}
