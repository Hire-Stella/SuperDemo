/**
 * Stand up a demo centre: the org, its queues, its admin and its landing page.
 *
 * `demo-data.ts` pours traffic into a centre that already exists. This makes the
 * centre — which otherwise means clicking through onboarding, or hand-writing
 * the same five inserts against whichever database you are pointed at. The two
 * together are the whole demo:
 *
 *   pnpm demo:tenant --slug legend --name "Legend Rent A Car" \
 *     --email legend@hirestella.com --password '…' --industry GENERIC --queues rental
 *   pnpm demo:seed   --slug legend --pack CAR_RENTAL --days 60 --volume 12
 *
 * Idempotent: re-running updates in place rather than duplicating. Safe against
 * a database holding real centres — everything is addressed by slug or email
 * and nothing else is read or written.
 */
import { PrismaClient, type Prisma } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
}

const SLUG = arg('slug');
const NAME = arg('name');
const EMAIL = arg('email');
const PASSWORD = arg('password');
const INDUSTRY = (arg('industry', 'GENERIC') ?? 'GENERIC') as Prisma.OrganizationCreateInput['industry'];
const TAGLINE = arg('tagline');
const QUEUES = arg('queues', 'generic');
const TIMEZONE = arg('timezone', 'Asia/Dubai')!;

/**
 * Queue names per vertical.
 *
 * The five `Skill` slots are fixed in the database; what a slot is *called* is
 * the tenant's business. `demo-data.ts` only invents queues when it finds none,
 * and left to itself it names them after a grocery — so a rental desk's
 * bookings line comes out as "Orders & delivery".
 */
const QUEUE_SETS: Record<string, { name: string; requiredSkill: string; slaSeconds: number }[]> = {
  rental: [
    { name: 'Bookings & availability', requiredSkill: 'EDUCATION', slaSeconds: 20 },
    { name: 'Payments, deposits & fines', requiredSkill: 'FINANCE', slaSeconds: 25 },
    { name: 'Corporate & leasing', requiredSkill: 'MANAGEMENT', slaSeconds: 30 },
    { name: 'Roadside & vehicle support', requiredSkill: 'LANGUAGE', slaSeconds: 15 },
    { name: 'Front desk', requiredSkill: 'GENERAL', slaSeconds: 20 },
  ],
  education: [
    { name: 'Admissions & courses', requiredSkill: 'EDUCATION', slaSeconds: 20 },
    { name: 'Fees & payments', requiredSkill: 'FINANCE', slaSeconds: 25 },
    { name: 'Corporate training', requiredSkill: 'MANAGEMENT', slaSeconds: 30 },
    { name: 'Language programmes', requiredSkill: 'LANGUAGE', slaSeconds: 25 },
    { name: 'Front desk', requiredSkill: 'GENERAL', slaSeconds: 20 },
  ],
  generic: [
    { name: 'Sales & enquiries', requiredSkill: 'EDUCATION', slaSeconds: 20 },
    { name: 'Billing', requiredSkill: 'FINANCE', slaSeconds: 25 },
    { name: 'Accounts', requiredSkill: 'MANAGEMENT', slaSeconds: 30 },
    { name: 'Support', requiredSkill: 'LANGUAGE', slaSeconds: 20 },
    { name: 'Front desk', requiredSkill: 'GENERAL', slaSeconds: 20 },
  ],
};

async function main() {
  if (!SLUG) throw new Error('--slug is required');
  const queues = QUEUE_SETS[QUEUES!];
  if (!queues) {
    throw new Error(`No queue set "${QUEUES}". Available: ${Object.keys(QUEUE_SETS).join(', ')}`);
  }

  const org = await prisma.organization.upsert({
    where: { slug: SLUG },
    create: {
      name: NAME ?? SLUG,
      slug: SLUG,
      industry: INDUSTRY,
      timezone: TIMEZONE,
      ...(TAGLINE ? { tagline: TAGLINE } : {}),
    },
    update: {
      ...(NAME ? { name: NAME } : {}),
      industry: INDUSTRY,
      isActive: true,
      ...(TAGLINE ? { tagline: TAGLINE } : {}),
    },
  });
  console.log(`org      ${org.name} (${org.slug}) · ${org.industry}`);

  await prisma.setting.upsert({
    where: { orgId: org.id },
    create: { orgId: org.id, instituteName: org.name, instituteTimezone: org.timezone },
    update: {},
  });

  for (const q of queues) {
    const existing = await prisma.queue.findFirst({
      where: { orgId: org.id, requiredSkill: q.requiredSkill as Prisma.QueueCreateInput['requiredSkill'] },
    });
    if (existing) {
      await prisma.queue.update({ where: { id: existing.id }, data: { name: q.name } });
    } else {
      await prisma.queue.create({
        data: {
          orgId: org.id,
          name: q.name,
          requiredSkill: q.requiredSkill as Prisma.QueueCreateInput['requiredSkill'],
          slaSeconds: q.slaSeconds,
        },
      });
    }
  }
  console.log(`queues   ${queues.length} (${QUEUES})`);

  if (EMAIL) {
    if (!PASSWORD) {
      throw new Error('--password is required with --email. Do not reuse the seeded demo password on a public deployment.');
    }
    const passwordHash = await argon2.hash(PASSWORD, { type: argon2.argon2id });
    const user = await prisma.user.upsert({
      where: { email: EMAIL },
      create: {
        orgId: org.id,
        email: EMAIL,
        name: NAME ? `${NAME.split(' ')[0]} Admin` : 'Admin',
        passwordHash,
        role: 'ADMIN',
        location: 'DUBAI',
        timezone: TIMEZONE,
        skills: ['EDUCATION', 'FINANCE', 'MANAGEMENT', 'GENERAL'],
        extension: '100',
        avatarColor: '#1d4ed8',
        presence: { create: { orgId: org.id, status: 'AVAILABLE', since: new Date() } },
      },
      update: { orgId: org.id, passwordHash, role: 'ADMIN', isActive: true },
    });
    console.log(`admin    ${user.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
