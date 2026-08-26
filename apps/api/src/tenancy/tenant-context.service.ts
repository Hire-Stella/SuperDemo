import { Injectable, Logger } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantStore {
  /** The org whose data this request may touch. Null = system/platform scope. */
  orgId: string | null;
  /** Who set it, for the log line when something looks wrong. */
  actorId: string | null;
  /** True when a SUPERADMIN is reading a tenant via ?org / X-Org-Id. */
  impersonating: boolean;
}

/**
 * Request-scoped tenant context.
 *
 * AsyncLocalStorage rather than a REQUEST-scoped Nest provider: request scoping
 * would force every service that touches Prisma to become request-scoped too,
 * which re-instantiates half the app per call and breaks the singletons the
 * routing and presence services rely on. ALS threads one value through the
 * async call graph without changing anybody's lifetime.
 *
 * The store object is created empty by TenantMiddleware and filled in by
 * JwtAuthGuard once the token is verified — middleware runs before guards, so
 * the guard mutates a store that already exists rather than opening a second
 * one.
 */
@Injectable()
export class TenantContext {
  private readonly log = new Logger(TenantContext.name);
  private readonly als = new AsyncLocalStorage<TenantStore>();

  /** Wrap a request (or any async task) in a fresh, empty context. */
  run<T>(fn: () => T): T {
    return this.als.run({ orgId: null, actorId: null, impersonating: false }, fn);
  }

  /** Wrap a task in a context pinned to one org — used by the WS gateway. */
  runAs<T>(orgId: string | null, actorId: string | null, fn: () => T): T {
    return this.als.run({ orgId, actorId, impersonating: false }, fn);
  }

  /** Called by the auth guard once it knows who is asking. */
  set(store: Partial<TenantStore>): void {
    const current = this.als.getStore();
    if (!current) {
      // A code path that queries tenant data outside any context. Not fatal —
      // the extension falls through to unscoped, which is right for the worker
      // — but on an HTTP request it means the middleware was bypassed.
      this.log.warn('tenant context set outside of a run() scope — ignored');
      return;
    }
    Object.assign(current, store);
  }

  /** Null in system contexts: the outbox worker, the seed, login before auth. */
  orgId(): string | null {
    return this.als.getStore()?.orgId ?? null;
  }

  /**
   * The org id, or a thrown error. For handlers that cannot do anything
   * sensible without one (creating a queue, reading settings) — better a 500
   * than a silently cross-tenant write.
   */
  requireOrgId(): string {
    const orgId = this.orgId();
    if (!orgId) {
      throw new Error('No organisation in context — this route requires a tenant user');
    }
    return orgId;
  }

  store(): TenantStore | undefined {
    return this.als.getStore();
  }
}
