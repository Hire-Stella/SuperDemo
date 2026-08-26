import { Global, Module } from '@nestjs/common';
import { TenantContext } from './tenant-context.service';

/**
 * Global because PrismaService depends on it, and PrismaService is itself
 * global — the alternative is importing this module into all twenty feature
 * modules to satisfy one transitive dependency.
 */
@Global()
@Module({
  providers: [TenantContext],
  exports: [TenantContext],
})
export class TenancyModule {}
