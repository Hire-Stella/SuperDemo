import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { TenantContext } from './tenant-context.service';

/**
 * Opens an empty tenant context for every request.
 *
 * Middleware, not an interceptor: middleware runs before guards, so the context
 * exists by the time JwtAuthGuard has a user to put in it. An interceptor runs
 * *after* guards and would have to wrap `next.handle()`'s observable to keep the
 * ALS context alive across the handler — correct but subtle, and easy to get
 * wrong on the next refactor.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenants: TenantContext) {}

  use(_req: Request, _res: Response, next: NextFunction): void {
    this.tenants.run(() => next());
  }
}
