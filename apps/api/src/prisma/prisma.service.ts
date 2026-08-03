import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@fit-ai/db';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(PrismaService.name);

  constructor() {
    super({ log: ['warn', 'error'] });
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
