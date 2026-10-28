import { Controller, Get, HttpCode, Inject, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { ApiEnv } from '@superdemo/contracts';
import { Public } from '../auth/guards';
import { ENV } from '../config/config.module';
import {
  checkOfficeHours,
  officeHoursFrom,
  officeHoursNow,
  type OfficeHoursCheck,
  type OfficeHoursNow,
} from './office-hours';

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
  constructor(@Inject(ENV) private readonly env: ApiEnv) {}

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
    @Query('closed') closed?: string,
    @Query('max_days') max_days?: string,
  ): OfficeHoursCheck {
    return checkOfficeHours(
      String(day).slice(0, 200),
      String(time).slice(0, 100),
      officeHoursFrom({ tz, days, open, close, breaks, closed, max_days }),
      new Date(),
      this.env.JWT_ACCESS_SECRET,
    );
  }

  /**
   * "What is the date and time right now?", for an agent that must never
   * guess it. As a GET it is a plain HTTP tool; as a POST it is the shape of a
   * Dograh pre-call data fetch, which runs once when the call connects and
   * merges `initial_context` into the call, so the prompts can say
   * {{today_spoken}} without the model ever calling a tool.
   *
   *   GET|POST /api/public/office-hours/now?tz=Asia/Dubai
   */
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @Get('now')
  now(@Query('tz') tz?: string): OfficeHoursNow {
    return officeHoursNow(officeHoursFrom({ tz }).timeZone);
  }

  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @Post('now')
  @HttpCode(200)
  nowForPreCallFetch(@Query('tz') tz?: string): OfficeHoursNow {
    return this.now(tz);
  }
}
