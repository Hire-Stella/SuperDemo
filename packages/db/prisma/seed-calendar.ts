/**
 * Give every existing centre a calendar to look at.
 *
 * The calendar ships with a mock provider, so a centre's week view is empty
 * until somebody books something — which on a demo database reads as the
 * feature not working. This fills each centre's this-week and next-week with a
 * realistic handful of appointments (see calendar-seed.ts).
 *
 * Idempotent: a centre with a calendarConfig keeps it, and a centre that
 * already has any booking at all is skipped entirely, so running this twice —
 * or after real bookings exist — never adds a second batch on top.
 *
 *   pnpm --filter @superdemo/db seed:calendar
 *   pnpm --filter @superdemo/db seed:calendar -- --dry
 */
import { PrismaClient } from '@prisma/client';
import { CalendarConfig } from '@superdemo/contracts';
import { seedBookingsFor } from './calendar-seed';

const dry = process.argv.includes('--dry');
const prisma = new PrismaClient();

async function main(): Promise<void> {
  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, slug: true, timezone: true, settings: { select: { id: true, calendarConfig: true } } },
  });

  let seeded = 0;
  for (const org of orgs) {
    let config = org.settings?.calendarConfig ?? null;
    if (!config) {
      config = CalendarConfig.parse({});
      if (!dry) {
        await prisma.setting.upsert({
          where: { orgId: org.id },
          create: { orgId: org.id, calendarConfig: config },
          update: { calendarConfig: config },
        });
      }
      console.log(`  config  ${org.slug.padEnd(26)} → defaults (Mon–Sat 09:00–18:00, 30m)`);
    }

    const existing = await prisma.calendarBooking.count({ where: { orgId: org.id } });
    if (existing > 0) {
      console.log(`  skip    ${org.slug.padEnd(26)} already has ${existing} booking(s)`);
      continue;
    }
    if (dry) {
      console.log(`  would   ${org.slug.padEnd(26)} → ~10 bookings`);
      continue;
    }
    const n = await seedBookingsFor(prisma, org, config);
    seeded += 1;
    console.log(`  seeded  ${org.slug.padEnd(26)} → ${n} bookings (${org.timezone})`);
  }

  console.log(
    dry
      ? `\n  dry run — nothing written`
      : `\n  ${seeded} centre(s) seeded, ${orgs.length - seeded} left untouched`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
