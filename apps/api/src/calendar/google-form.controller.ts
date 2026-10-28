import { Body, Controller, HttpCode, Inject, Param, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { ApiEnv } from '@superdemo/contracts';
import { Public } from '../auth/guards';
import { ENV } from '../config/config.module';
import { submitGoogleForm, type GoogleFormResult, type SlotGuard } from './google-form';
import { officeHoursFrom } from './office-hours';

/**
 * A voice agent's "save this to the sheet" tool, as a plain HTTP tool.
 *
 * Public and stateless, like the office-hours check: the form id is in the
 * path, the `entry.*` fields are the tool's body template, form- or
 * JSON-encoded. Always 200, so the agent reads `ok` rather than apologising
 * for an HTTP error.
 *
 *   POST /api/public/google-form/1FAIpQLSc0fBbhTiFW…
 *        entry.950186145=Sachin&entry.1378196029=2026-10-22&…
 */
@Public()
@Controller('public/google-form')
export class GoogleFormController {
  constructor(@Inject(ENV) private readonly env: ApiEnv) {}

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  /**
   * With `date_field` and `time_field` naming the form's date and time entries,
   * the slot is checked against the office hours in the other query parameters
   * (same ones as the office-hours check) before anything is submitted. With
   * `require_token=1` as well, the body must carry `check_token` from the
   * office-hours check for that slot, so a slot that was never checked is
   * never saved either.
   *
   *   POST …/google-form/<id>?date_field=entry.137&time_field=entry.386&require_token=1
   *        &tz=Asia/Dubai&days=1,2,3,4,5&open=09:00&close=17:00&breaks=1@12:00-13:00
   */
  @Post(':formId')
  @HttpCode(200)
  submit(
    @Param('formId') formId: string,
    @Body() body: unknown,
    @Query('date_field') dateField?: string,
    @Query('time_field') timeField?: string,
    @Query('require_token') requireToken?: string,
    @Query('tz') tz?: string,
    @Query('days') days?: string,
    @Query('open') open?: string,
    @Query('close') close?: string,
    @Query('breaks') breaks?: string,
    @Query('closed') closed?: string,
    @Query('max_days') max_days?: string,
  ): Promise<GoogleFormResult> {
    const guard: SlotGuard | null =
      dateField && timeField
        ? {
            dateField,
            timeField,
            hours: officeHoursFrom({ tz, days, open, close, breaks, closed, max_days }),
            tokenSecret:
              requireToken && requireToken !== '0' ? this.env.JWT_ACCESS_SECRET : undefined,
          }
        : null;
    return submitGoogleForm(formId, body, fetch, guard);
  }
}
