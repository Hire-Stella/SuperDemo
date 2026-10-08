#!/usr/bin/env node
/**
 * Local service manager for SuperDemo.
 *
 * This machine has no Homebrew and no system package manager, so Postgres is
 * vendored: `embedded-postgres` ships genuine PostgreSQL 17 binaries and we run
 * a persistent cluster out of `.data/pg`. Redis is already present on PATH.
 *
 *   node scripts/services.mjs up | down | status | reset
 */
import { existsSync, mkdirSync, readdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn, execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, '.data');
const PG_DIR = join(DATA, 'pg');
const REDIS_DIR = join(DATA, 'redis');

const PG_PORT = Number(process.env.PG_PORT ?? 55432);
const PG_USER = process.env.PG_USER ?? 'fitai';
const PG_PASSWORD = process.env.PG_PASSWORD ?? 'fitai';
const PG_DATABASE = process.env.PG_DATABASE ?? 'fitai';
const REDIS_PORT = Number(process.env.REDIS_PORT ?? 6379);

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

function portOpen(port, host = '127.0.0.1', timeout = 400) {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    const done = (v) => {
      sock.destroy();
      resolve(v);
    };
    sock.setTimeout(timeout);
    sock.once('connect', () => done(true));
    sock.once('timeout', () => done(false));
    sock.once('error', () => done(false));
    sock.connect(port, host);
  });
}

async function waitForPort(port, label, tries = 60) {
  for (let i = 0; i < tries; i++) {
    if (await portOpen(port)) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`${label} did not open port ${port} in time`);
}

/* ------------------------------- Postgres -------------------------------- */

function pgBinDir() {
  // Resolve the platform-specific package that holds initdb/pg_ctl/postgres.
  const platform = process.platform === 'win32' ? 'windows' : process.platform;
  const candidates = [
    `@embedded-postgres/${platform}-${process.arch === 'x64' ? 'x64' : 'arm64'}`,
  ];
  for (const pkg of candidates) {
    for (const base of [ROOT, join(ROOT, 'node_modules', '.pnpm')]) {
      const direct = join(base, 'node_modules', pkg, 'native', 'bin');
      if (existsSync(direct)) return direct;
    }
  }
  // pnpm hoists into a content-addressed store; scan for it.
  const pnpmDir = join(ROOT, 'node_modules', '.pnpm');
  if (existsSync(pnpmDir)) {
    for (const entry of readdirSync(pnpmDir)) {
      if (!entry.startsWith('@embedded-postgres')) continue;
      const guess = join(pnpmDir, entry, 'node_modules', ...entry.split('@').slice(0, 1));
      const scoped = readdirSync(join(pnpmDir, entry, 'node_modules', '@embedded-postgres'), {
        withFileTypes: true,
      }).find((d) => d.isDirectory());
      if (scoped) {
        const bin = join(
          pnpmDir,
          entry,
          'node_modules',
          '@embedded-postgres',
          scoped.name,
          'native',
          'bin',
        );
        if (existsSync(bin)) return bin;
      }
      void guess;
    }
  }
  return null;
}

function pgInitialised() {
  return existsSync(join(PG_DIR, 'PG_VERSION'));
}

async function pgUp() {
  const bin = pgBinDir();
  if (!bin) {
    console.error(
      c.red('✗ PostgreSQL binaries not found.') +
        '\n  Run `pnpm install`. If it still fails, pnpm blocked the postinstall script —\n' +
        '  check `onlyBuiltDependencies` in pnpm-workspace.yaml includes @embedded-postgres/*.',
    );
    process.exit(1);
  }

  if (await portOpen(PG_PORT)) {
    console.log(c.green('✓') + ` postgres already listening on :${PG_PORT}`);
    return;
  }

  mkdirSync(DATA, { recursive: true });

  if (!pgInitialised()) {
    if (existsSync(PG_DIR)) rmSync(PG_DIR, { recursive: true, force: true });
    mkdirSync(PG_DIR, { recursive: true });
    const pwFile = join(DATA, '.pgpass-init');
    writeFileSync(pwFile, PG_PASSWORD, 'utf8');
    console.log(c.dim('  initialising new cluster…'));
    execFileSync(
      join(bin, 'initdb'),
      ['-D', PG_DIR, '-U', PG_USER, `--pwfile=${pwFile}`, '-E', 'UTF8', '--locale=C'],
      { stdio: 'ignore' },
    );
    rmSync(pwFile, { force: true });
  }

  const log = join(DATA, 'pg.log');
  execFileSync(
    join(bin, 'pg_ctl'),
    ['-D', PG_DIR, '-l', log, '-o', `-p ${PG_PORT} -k ${PG_DIR}`, '-w', 'start'],
    { stdio: 'ignore' },
  );
  await waitForPort(PG_PORT, 'postgres');

  // Ensure the application database exists (idempotent).
  const { Client } = await import('pg').catch(() => ({ Client: null }));
  if (Client) {
    const admin = new Client({
      host: '127.0.0.1',
      port: PG_PORT,
      user: PG_USER,
      password: PG_PASSWORD,
      database: 'postgres',
    });
    await admin.connect();
    const { rowCount } = await admin.query('select 1 from pg_database where datname = $1', [
      PG_DATABASE,
    ]);
    if (!rowCount) await admin.query(`create database "${PG_DATABASE}"`);
    await admin.end();
  }

  console.log(c.green('✓') + ` postgres 17 on :${PG_PORT} ` + c.dim(`(${PG_DIR})`));
}

function pgDown() {
  const bin = pgBinDir();
  if (!bin || !pgInitialised()) return;
  try {
    execFileSync(join(bin, 'pg_ctl'), ['-D', PG_DIR, '-m', 'fast', '-w', 'stop'], {
      stdio: 'ignore',
    });
    console.log(c.green('✓') + ' postgres stopped');
  } catch {
    console.log(c.dim('· postgres was not running'));
  }
}

/* --------------------------------- Redis --------------------------------- */

async function redisUp() {
  if (await portOpen(REDIS_PORT)) {
    console.log(c.green('✓') + ` redis already listening on :${REDIS_PORT}`);
    return;
  }
  mkdirSync(REDIS_DIR, { recursive: true });
  const child = spawn(
    'redis-server',
    [
      '--port',
      String(REDIS_PORT),
      '--dir',
      REDIS_DIR,
      '--daemonize',
      'yes',
      '--save',
      '60',
      '1',
      '--appendonly',
      'no',
      '--pidfile',
      join(REDIS_DIR, 'redis.pid'),
    ],
    { stdio: 'ignore' },
  );
  child.unref();
  await waitForPort(REDIS_PORT, 'redis');
  console.log(c.green('✓') + ` redis on :${REDIS_PORT}`);
}

function redisDown() {
  const pidFile = join(REDIS_DIR, 'redis.pid');
  if (!existsSync(pidFile)) {
    console.log(c.dim('· redis pidfile not found (may be system-managed; left alone)'));
    return;
  }
  try {
    process.kill(Number(readFileSync(pidFile, 'utf8').trim()), 'SIGTERM');
    console.log(c.green('✓') + ' redis stopped');
  } catch {
    console.log(c.dim('· redis was not running'));
  }
}

/* --------------------------------- main ---------------------------------- */

const cmd = process.argv[2] ?? 'up';

switch (cmd) {
  case 'up': {
    console.log(c.bold('SuperDemo local services'));
    await pgUp();
    await redisUp();
    console.log(
      c.dim(
        `\n  DATABASE_URL=postgresql://${PG_USER}:${PG_PASSWORD}@127.0.0.1:${PG_PORT}/${PG_DATABASE}?schema=public` +
          `\n  REDIS_URL=redis://127.0.0.1:${REDIS_PORT}\n`,
      ),
    );
    break;
  }
  case 'down':
    pgDown();
    redisDown();
    break;
  case 'status': {
    const [pg, rd] = await Promise.all([portOpen(PG_PORT), portOpen(REDIS_PORT)]);
    console.log(`postgres :${PG_PORT}  ${pg ? c.green('up') : c.red('down')}`);
    console.log(`redis    :${REDIS_PORT}  ${rd ? c.green('up') : c.red('down')}`);
    break;
  }
  case 'reset':
    pgDown();
    rmSync(PG_DIR, { recursive: true, force: true });
    console.log(c.yellow('⚠') + ' postgres cluster deleted — run `pnpm services:up` then `pnpm db:push && pnpm db:seed`');
    break;
  default:
    console.error(`unknown command: ${cmd}\nusage: services.mjs up|down|status|reset`);
    process.exit(1);
}
