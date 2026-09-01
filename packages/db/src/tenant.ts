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
 * Pin a client to one organisation. Used by the seed and by any script that
 * works on a single tenant; the API uses the request-scoped resolver instead.
 */
export function withOrg<T extends PrismaClient>(client: T, orgId: string): T {
  // The extended client is structurally a different type; the cast keeps the
  // call sites (a seed script, one-off tooling) readable, and the delegates it
  // exposes are the same ones minus the ability to escape the org.
  return client.$extends(tenantExtension(() => orgId)) as unknown as T;
}
