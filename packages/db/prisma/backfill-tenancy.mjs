/**
 * One-off migration to tenancy for an existing database.
 *
 * `prisma db push` refuses to add Setting.orgId (a required FK) while a row
 * exists, and every other orgId column would land as "" — invisible to the
 * scoped client. So: stash the settings row, let push run, then adopt all the
 * existing data into one organisation.
 *
 * Raw SQL throughout, because the generated client already expects columns the
 * database does not have yet, and because the tenant extension must not be in
 * the way while we are backfilling the very column it filters on.
 *
 * Usage:  node backfill-tenancy.mjs stash   (before db push)
 *         node backfill-tenancy.mjs adopt   (after db push)
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync, writeFileSync } from 'node:fs';
import argon2 from 'argon2';

const STASH = new URL('./.tenancy-stash.json', import.meta.url);
const prisma = new PrismaClient();

/**
 * Tables whose orgId is `String @default("")`, so the new column arrives as ""
 * and is adopted by matching on that.
 *
 * User is absent on purpose: its orgId is nullable (the superadmin belongs to no
 * centre), so the column arrives as NULL and needs its own statement — one that
 * must not sweep the superadmin into a tenant.
 */
const TENANT_TABLES = [
  'AgentState', 'AgentStateEvent', 'Contact', 'Conversation', 'Call',
  'CallParticipant', 'Message', 'Recording', 'TranscriptSegment', 'AiSession',
  'AiAgent', 'KnowledgeDoc', 'KnowledgeChunk', 'Queue', 'QueueMembership',
  'PhoneNumber', 'OutboxEvent', 'CrmSyncLog', 'CallMetricsDaily', 'AuditLog',
];

async function stash() {
  const rows = await prisma.$queryRawUnsafe('SELECT * FROM "Setting"');
  writeFileSync(STASH, JSON.stringify(rows, null, 2));
  await prisma.$executeRawUnsafe('DELETE FROM "Setting"');
  console.log(`stashed ${rows.length} settings row(s) and cleared the table`);
}

async function adopt() {
  // The stash is gone once this has run successfully, so re-running falls back
  // to the schema defaults rather than crashing.
  let saved = {};
  try {
    saved = JSON.parse(readFileSync(STASH, 'utf8'))[0] ?? {};
  } catch {
    console.log('no stashed settings — using defaults');
  }
  const name = saved.instituteName ?? 'FIT Institute';
  const timezone = saved.instituteTimezone ?? 'Asia/Dubai';

  // Idempotent: re-running must not mint a second centre for the same data.
  const existingOrg = await prisma.$queryRawUnsafe(
    `SELECT id FROM "Organization" WHERE slug = 'fit-ai'`,
  );
  const org =
    existingOrg[0] ??
    (
      await prisma.$queryRawUnsafe(
        `INSERT INTO "Organization" (id, name, slug, timezone, "isActive", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, 'fit-ai', $2, true, now(), now())
         RETURNING id`,
        name,
        timezone,
      )
    )[0];
  console.log(`organisation ${org.id} — ${name}`);

  for (const table of TENANT_TABLES) {
    const n = await prisma.$executeRawUnsafe(
      `UPDATE "${table}" SET "orgId" = $1 WHERE "orgId" = ''`,
      org.id,
    );
    console.log(`  ${table}: ${n}`);
  }

  // Staff join the centre; a SUPERADMIN must keep orgId NULL or it stops being a
  // platform account and starts being one centre's admin.
  const users = await prisma.$executeRawUnsafe(
    `UPDATE "User" SET "orgId" = $1 WHERE "orgId" IS NULL AND role <> 'SUPERADMIN'`,
    org.id,
  );
  console.log(`  User: ${users} (superadmins left unattached)`);

  // Settings: same values as before, now owned by the org. Every placeholder is
  // cast explicitly — Postgres will not match a text parameter against a
  // numeric or boolean default inside COALESCE.
  await prisma.$executeRawUnsafe(
    `INSERT INTO "Setting" (
       id, "orgId", "instituteName", "instituteTimezone", "recordingConsentText",
       "recordingConsentOn", "recordingRetentionDays", "wrapupSeconds",
       "agentRingTimeoutSec", "agentHourlyCostUsd", "bitrixPortalUrl", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3,
       COALESCE($4::text, 'This call may be recorded for quality and training purposes.'),
       COALESCE($5::boolean, true), COALESCE($6::int, 365), COALESCE($7::int, 20),
       COALESCE($8::int, 20), COALESCE($9::numeric, 12.00), $10::text, now())
     ON CONFLICT ("orgId") DO NOTHING`,
    org.id,
    name,
    timezone,
    saved.recordingConsentText ?? null,
    saved.recordingConsentOn ?? null,
    saved.recordingRetentionDays ?? null,
    saved.wrapupSeconds ?? null,
    saved.agentRingTimeoutSec ?? null,
    saved.agentHourlyCostUsd ?? null,
    saved.bitrixPortalUrl ?? null,
  );
  console.log('  Setting: recreated for the org');

  // The platform operator: belongs to no org, so it is created here rather than
  // adopted. Same dev password as the seeded staff accounts.
  const existing = await prisma.$queryRawUnsafe(
    `SELECT id FROM "User" WHERE email = 'super@hirestella.com'`,
  );
  if (existing.length === 0) {
    const hash = await argon2.hash('Password123!', { type: argon2.argon2id });
    await prisma.$executeRawUnsafe(
      `INSERT INTO "User" (id, "orgId", email, name, "passwordHash", role, location,
         timezone, skills, "avatarColor", "isActive", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, NULL, 'super@hirestella.com', 'Platform Operator',
         $1, 'SUPERADMIN', 'DUBAI', 'Asia/Dubai', ARRAY['GENERAL']::"Skill"[],
         '#0f172a', true, now(), now())`,
      hash,
    );
    console.log('  superadmin: super@hirestella.com created');
  } else {
    console.log('  superadmin: already present');
  }
}

const mode = process.argv[2];
try {
  if (mode === 'stash') await stash();
  else if (mode === 'adopt') await adopt();
  else throw new Error('usage: node backfill-tenancy.mjs stash|adopt');
} finally {
  await prisma.$disconnect();
}
