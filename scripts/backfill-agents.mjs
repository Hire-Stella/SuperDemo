#!/usr/bin/env node
/**
 * Queue demo-call agents for every centre that is still waiting on them.
 *
 * Centres made before agents were built automatically — or made while their
 * Dograh was not yet connected — have demo-call slots switched on with no
 * workflow behind them, and nothing that would ever fill them. The API now
 * queues the build on creation and again when an operator connects Dograh;
 * this is the one-off sweep for the centres that predate both.
 *
 * It enqueues exactly what EnrichmentService.enqueueBuildAgents does: one
 * `centre.build-agents` OutboxEvent per centre plus Setting.enrichStatus =
 * 'queued', in one transaction. The outbox drainer polls every five seconds,
 * so a running API picks the rows up without being told; nothing is built by
 * this script itself.
 *
 *   node scripts/backfill-agents.mjs            # dry run: list who would be queued
 *   node scripts/backfill-agents.mjs --apply    # queue them
 *
 * Skipped, and reported:
 *   - a build or enrichment already queued or running (it fills the same slots,
 *     and a second would race it into duplicate agents);
 *   - no Dograh host or key, neither the centre's own nor the deployment's
 *     DOGRAH_BASE_URL / DOGRAH_API_KEY — the build would only fail.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Must match BUILD_AGENTS_EVENT in apps/api/src/integrations/enrichment. */
const BUILD_AGENTS_EVENT = 'centre.build-agents';
const KINDS = ['inbound', 'outbound', 'info'];
const BATCH = 5;

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

/**
 * The root .env, read by hand rather than with dotenv so the script needs
 * nothing that is not already installed. Real environment variables win, the
 * same precedence the API's config uses.
 */
function loadEnv() {
  const file = join(ROOT, '.env');
  const out = {};
  if (existsSync(file)) {
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      } else {
        v = v.replace(/\s+#.*$/, '');
      }
      out[m[1]] = v;
    }
  }
  return { ...out, ...process.env };
}

/** The switched-on slots with no workflow, from a raw Setting.dograhDialers. */
function missingKinds(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  return KINDS.filter((kind) => {
    const slot = raw[kind];
    return slot && slot.enabled === true && !slot.workflowId;
  });
}

async function main() {
  const apply = process.argv.includes('--apply');
  const env = loadEnv();
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set (root .env or environment)');

  // Prisma's ?schema= is not a libpq parameter; pg would ignore it at best.
  const url = new URL(env.DATABASE_URL);
  const schema = url.searchParams.get('schema') ?? 'public';
  url.searchParams.delete('schema');

  const envBaseUrl = env.DOGRAH_BASE_URL?.trim() || null;
  const envKey = env.DOGRAH_API_KEY?.trim() || null;

  const client = new pg.Client({ connectionString: url.toString() });
  await client.connect();
  try {
    await client.query(`SET search_path TO "${schema.replaceAll('"', '""')}"`);

    const { rows } = await client.query(`
      SELECT o.id, o.slug, o.name,
             s."dograhDialers", s."enrichStatus", s."dograhBaseUrl", s."dograhSecretsEnc"
        FROM "Organization" o
        JOIN "Setting" s ON s."orgId" = o.id
       ORDER BY o."createdAt" ASC
    `);

    const due = [];
    const busy = [];
    const noDograh = [];
    for (const r of rows) {
      const kinds = missingKinds(r.dograhDialers);
      if (kinds.length === 0) continue;
      const row = { id: r.id, slug: r.slug, name: r.name, kinds, status: r.enrichStatus };
      if (r.enrichStatus === 'queued' || r.enrichStatus === 'running') busy.push(row);
      else if (!(r.dograhBaseUrl?.trim() || envBaseUrl) || !(r.dograhSecretsEnc || envKey)) {
        noDograh.push(row);
      } else due.push(row);
    }

    const line = (r) =>
      `  ${r.slug.padEnd(28)} ${r.kinds.join(', ').padEnd(24)} ${c.dim(`status=${r.status} id=${r.id}`)}`;

    console.log(c.bold(`Centres with switched-on slots and no agent: ${due.length + busy.length + noDograh.length}`));
    if (due.length) {
      console.log(c.green(`\n${apply ? 'Queueing' : 'Would queue'} (${due.length}):`));
      due.forEach((r) => console.log(line(r)));
    }
    if (busy.length) {
      console.log(c.yellow(`\nSkipped — a build is already queued or running (${busy.length}):`));
      busy.forEach((r) => console.log(line(r)));
    }
    if (noDograh.length) {
      console.log(
        c.yellow(`\nSkipped — no Dograh host/key, own or DOGRAH_BASE_URL/DOGRAH_API_KEY (${noDograh.length}):`),
      );
      noDograh.forEach((r) => console.log(line(r)));
    }

    if (!apply) {
      console.log(c.dim(`\nDry run. Re-run with --apply to queue ${due.length} build(s).`));
      return;
    }

    let queued = 0;
    let failed = 0;
    for (let i = 0; i < due.length; i += BATCH) {
      for (const r of due.slice(i, i + BATCH)) {
        try {
          await client.query('BEGIN');
          // Re-checked under a row lock: a build queued since the scan above
          // (by the API, or another run of this script) must not be doubled.
          const { rows: locked } = await client.query(
            `SELECT "enrichStatus" FROM "Setting" WHERE "orgId" = $1 FOR UPDATE`,
            [r.id],
          );
          const status = locked[0]?.enrichStatus;
          if (status === 'queued' || status === 'running') {
            await client.query('ROLLBACK');
            console.log(c.dim(`  ${r.slug}: build started meanwhile — skipped`));
            continue;
          }
          await client.query(
            `INSERT INTO "OutboxEvent"
               ("orgId", aggregate, "aggregateId", type, payload, attempts, "nextAttemptAt", "createdAt")
             VALUES ($1, 'organization', $1, $2, $3::jsonb, 0, now() AT TIME ZONE 'UTC', now() AT TIME ZONE 'UTC')`,
            [r.id, BUILD_AGENTS_EVENT, JSON.stringify({ orgId: r.id, demoCallKinds: r.kinds })],
          );
          await client.query(
            `UPDATE "Setting" SET "enrichStatus" = 'queued', "enrichError" = NULL WHERE "orgId" = $1`,
            [r.id],
          );
          await client.query('COMMIT');
          queued++;
          console.log(c.green(`  ${r.slug}: queued ${r.kinds.join(', ')}`));
        } catch (e) {
          await client.query('ROLLBACK').catch(() => {});
          failed++;
          console.log(c.red(`  ${r.slug}: ${e instanceof Error ? e.message : String(e)}`));
        }
      }
    }
    console.log(
      `\n${c.bold(`${queued} queued`)}${failed ? c.red(`, ${failed} failed`) : ''}. ` +
        c.dim('A running API drains them within five seconds; progress shows on each centre.'),
    );
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(c.red(e instanceof Error ? e.message : String(e)));
  process.exit(1);
});
