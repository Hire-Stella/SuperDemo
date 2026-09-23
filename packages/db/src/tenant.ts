import { Prisma, type PrismaClient } from '@prisma/client';

/**
 * Tenant isolation, enforced in one place.
 *
 * There are ~240 Prisma call sites in the API. Filtering each one by hand would
 * work exactly until someone adds the 241st and forgets, and a forgotten filter
 * here is one client reading another client's calls. So the rule lives in a
 * client extension instead: `orgId` is injected into every where-clause and
 * every create, for every tenant-owned model, whether or not the caller thought
 * about it.
 *
 * What this does NOT cover — know these before trusting it:
 *  * `$queryRaw` / `$executeRawUnsafe`. Extensions never see raw SQL. There is
 *    one raw call in the codebase (truncateAllForTests, test-only).
 *  * Nested writes. `user.create({ data: { presence: { create: {...} } } })`
 *    creates the AgentState without an orgId, because the extension only sees
 *    the top-level model. Nested creates on scoped models must pass orgId
 *    explicitly; NESTED_WRITE_SITES in the API notes where.
 *  * Cross-model `include`/`select`. A scoped parent gates the children, which
 *    is why children carry orgId too — a direct `message.findMany({ where:
 *    { conversationId } })` with a guessed id from another org is filtered.
 */

/** Models that belong to a tenant. Everything else is platform-level. */
export const TENANT_MODELS = new Set<string>([
  'User',
  'AgentState',
  'AgentStateEvent',
  'Contact',
  'Conversation',
  'Call',
  'CallParticipant',
  'Message',
  'Recording',
  'TranscriptSegment',
  'AiSession',
  'AiAgent',
  'KnowledgeDoc',
  'KnowledgeChunk',
  'Queue',
  'QueueMembership',
  'PhoneNumber',
  'OutboxEvent',
  'CrmSyncLog',
  'CallMetricsDaily',
  'AuditLog',
  'Setting',
  'Campaign',
  'CampaignTarget',
  'CallEval',
  'Site',
  // Scoped despite arriving from an anonymous visitor: the public controller
  // enters the tenant's context by slug before writing, so the extension is
  // what stops a mistyped siteId depositing one centre's lead in another's.
  'SiteLead',
]);

/**
 * Deliberately NOT tenant-scoped:
 *  * Organization — the superadmin's own table.
 *  * RefreshToken — reached only by token hash, which is unguessable, and the
 *    login path needs it before any org context exists.
 *  * ProcessedWebhook — a platform-wide dedupe ledger keyed by provider event
 *    id. Scoping it would let a redelivered webhook process twice.
 */
export const PLATFORM_MODELS = new Set<string>([
  'Organization',
  'RefreshToken',
  'ProcessedWebhook',
]);

/** Operations whose `where` we constrain. */
const WHERE_OPS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
  'update',
  'updateMany',
  'delete',
  'deleteMany',
]);

type Args = Record<string, unknown>;

/**
 * `orgId` resolver. Returns null for system contexts — the outbox worker, the
 * seed, the login path before a user is known — where queries are intentionally
 * cross-tenant.
 */
export type OrgIdResolver = () => string | null;

export function tenantExtension(getOrgId: OrgIdResolver) {
  return Prisma.defineExtension({
    name: 'tenant-scope',
    query: {
      $allModels: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async $allOperations({ model, operation, args, query }: any) {
          if (!TENANT_MODELS.has(model)) return query(args);

          const orgId = getOrgId();
          // No context = system path. Unscoped on purpose; see OrgIdResolver.
          if (orgId === null) return query(args);

          const next: Args = { ...(args as Args) };

          if (WHERE_OPS.has(operation)) {
            // findUnique accepts non-unique fields alongside the unique one
            // (extendedWhereUnique, GA since Prisma 5), so by-id reads get the
            // same guard as list reads — `GET /conversations/:id` with another
            // org's id returns nothing rather than their conversation.
            next.where = { ...((next.where as Args) ?? {}), orgId };
          }

          if (operation === 'create') {
            next.data = { orgId, ...((next.data as Args) ?? {}) };
          }

          if (operation === 'createMany' || operation === 'createManyAndReturn') {
            const data = (next.data ?? []) as Args | Args[];
            next.data = Array.isArray(data)
              ? data.map((row) => ({ orgId, ...row }))
              : { orgId, ...data };
          }

          if (operation === 'upsert') {
            next.where = { ...((next.where as Args) ?? {}), orgId };
            next.create = { orgId, ...((next.create as Args) ?? {}) };
          }

          return query(next);
        },
      },
    },
  });
}

/**
 * Retry a query whose connection went away underneath it.
 *
 * Seeding a remote database from a laptop runs for tens of minutes on one
 * connection, and Azure closes it periodically — Prisma reports `P1017 Server
 * has closed the connection`, or `P1001` if it is gone when the next query
 * starts. Neither is fatal: the very next attempt opens a fresh connection and
 * succeeds. Without this, though, the failure lands on whichever insert
 * happened to be in flight and takes the whole run down with it, discarding
 * everything still buffered — which is how a sixty-day seed comes to die four
 * times in a row twenty minutes in.
 *
 * Deliberately narrow: only the two connection codes are retried, so a real
 * error (a constraint violation, a bad argument) still fails immediately
 * rather than being attempted four times and then reported late.
 */
export function withConnectionRetry<T extends PrismaClient>(client: T): T {
  return client.$extends({
    query: {
      async $allOperations({ args, query }: { args: unknown; query: (a: unknown) => Promise<unknown> }) {
        let last: unknown;
        /*
         * Patient on purpose. Four quick attempts covers a connection the far
         * end closed and immediately reopens, but not the longer outages that
         * actually happen here: a laptop whose public address changes mid-run
         * is unreachable until its new one is allowed through, which is tens
         * of seconds at best. Ten attempts backing off to eight seconds gives
         * roughly a minute of tolerance, which turns most of those from a dead
         * run into a pause.
         */
        for (let attempt = 0; attempt < 10; attempt += 1) {
          try {
            return await query(args);
          } catch (err) {
            const code = (err as { code?: string }).code;
            if (code !== 'P1017' && code !== 'P1001') throw err;
            last = err;
            await new Promise((r) => setTimeout(r, Math.min(8000, 400 * 2 ** attempt)));
          }
        }
        throw last;
      },
    },
  }) as unknown as T;
}

/**
 * Pin a client to one organisation. Used by the seed and by any script that
 * works on a single tenant; the API uses the request-scoped resolver instead.
 */
export function withOrg<T extends PrismaClient>(client: T, orgId: string): T {
  // The extended client is structurally a different type; the cast keeps the
  // call sites (a seed script, one-off tooling) readable, and the delegates it
  // exposes are the same ones minus the ability to escape the org.
  return client.$extends(tenantExtension(() => orgId)) as unknown as T;
}
