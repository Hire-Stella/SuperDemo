import { CalendarConfig } from '@superdemo/contracts';
import type { PrismaService } from '../prisma/prisma.service';

export interface CalendarSettings {
  config: CalendarConfig;
  /** Organization.timezone — the same zone the dialler's calling window uses. */
  timezone: string;
}

/**
 * A centre's calendar config and timezone, with defaults.
 *
 * `safeParse` for the same reason sites.service.ts reads its JSON columns that
 * way: a shape change in contracts must not turn every centre's calendar into a
 * 500. A centre that has never opened the Hours card has a null here, which is
 * the normal state rather than an error, and gets Mon–Sat 09:00–18:00.
 *
 * Organization.timezone rather than Setting.instituteTimezone: the dialler
 * already decides "is it working hours for this centre" from the org's zone,
 * and two features disagreeing about when the centre is open would be worse
 * than either being slightly wrong.
 */
export async function readCalendarSettings(
  prisma: PrismaService,
  orgId: string,
): Promise<CalendarSettings> {
  const [org, setting] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId }, select: { timezone: true } }),
    prisma.setting.findFirst({ where: { orgId }, select: { calendarConfig: true } }),
  ]);
  const parsed = CalendarConfig.safeParse(setting?.calendarConfig ?? {});
  return {
    config: parsed.success ? parsed.data : CalendarConfig.parse({}),
    timezone: org?.timezone || 'Asia/Dubai',
  };
}
