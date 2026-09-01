import { Global, Logger, Module } from '@nestjs/common';
import type { ApiEnv, CrmProvider } from '@superdemo/contracts';
import { ENV } from '../../config/config.module';
import { MockCrm } from './mock.crm';
import { BitrixCrm } from './bitrix.crm';
import { CrmResolver } from './crm.resolver';

/**
 * The deployment-wide default, for system paths with no tenant in context.
 *
 * Per-centre configuration goes through CrmResolver instead — a single token
 * cannot represent "Bitrix for this client, Zoho for that one".
 */
export const CRM_PROVIDER = Symbol('CRM_PROVIDER');

@Global()
@Module({
  providers: [
    MockCrm,
    CrmResolver,
    {
      provide: CRM_PROVIDER,
      useFactory: (env: ApiEnv, mock: MockCrm): CrmProvider => {
        const log = new Logger('CrmModule');
        if (env.CRM_DRIVER === 'bitrix' && env.BITRIX_WEBHOOK_URL) {
          const bitrix = new BitrixCrm({ webhookUrl: env.BITRIX_WEBHOOK_URL });
          log.log(`CRM default: bitrix (${bitrix.portalUrl ?? 'portal unknown'})`);
          return bitrix;
        }
        log.log(
          `CRM default: mock — centres configure their own (Bitrix24 or Zoho) in Settings`,
        );
        return mock;
      },
      inject: [ENV, MockCrm],
    },
  ],
  exports: [CRM_PROVIDER, CrmResolver, MockCrm],
})
export class CrmModule {}
