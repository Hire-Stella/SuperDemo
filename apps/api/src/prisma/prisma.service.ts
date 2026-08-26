import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaClient, tenantExtension } from '@fit-ai/db';
import { TenantContext } from '../tenancy/tenant-context.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(PrismaService.name);

  constructor(private readonly tenants: TenantContext) {
    super({ log: ['warn', 'error'] });

    // Returning from a constructor replaces the instance, so every injected
    // PrismaService *is* the tenant-scoped client — no second symbol to
    // remember and no way to reach the unscoped delegates by accident. The
    // extension proxies to this instance, so $connect, $transaction, $queryRaw
    // and the methods below all still resolve (verified, not assumed).
    //
    // The resolver is read per query rather than captured, which is what lets
    // one singleton client serve every request's own org.
    return this.$extends(tenantExtension(() => this.tenants.orgId())) as unknown as PrismaService;
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.log.log('connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Wipe every table. Test-only guard rail: refuses to run outside NODE_ENV=test
   * so nobody destroys a demo database with a stray call.
   *
   * Raw SQL, so the tenant extension does not see it — which is correct here
   * (the point is to truncate everything) and a reminder that raw queries are
   * outside the isolation guarantee.
   */
  async truncateAllForTests(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('truncateAllForTests is only permitted with NODE_ENV=test');
    }
    const tables = await this.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename NOT LIKE '_prisma%'
    `;
    const list = tables.map((t) => `"public"."${t.tablename}"`).join(', ');
    if (list) await this.$executeRawUnsafe(`TRUNCATE TABLE ${list} CASCADE`);
  }
}
