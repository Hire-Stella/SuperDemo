import { Global, Logger, Module } from '@nestjs/common';
import type { ApiEnv, CrmProvider } from '@fit-ai/contracts';
import { ENV } from '../../config/config.module';
import { MockCrm } from './mock.crm';
import { BitrixCrm } from './bitrix.crm';

export const CRM_PROVIDER = Symbol('CRM_PROVIDER');

@Global()
@Module({
  providers: [
    MockCrm,
    BitrixCrm,
    {
      provide: CRM_PROVIDER,
      useFactory: (env: ApiEnv, mock: MockCrm, bitrix: BitrixCrm): CrmProvider => {
        const log = new Logger('CrmModule');
        if (env.CRM_DRIVER === 'bitrix') {
          log.log(`CRM: bitrix (${bitrix.portalUrl ?? 'portal unknown'})`);
          return bitrix;
        }
        log.log('CRM: mock (no real portal attached)');
        return mock;
      },
      inject: [ENV, MockCrm, BitrixCrm],
    },
  ],
  exports: [CRM_PROVIDER, MockCrm, BitrixCrm],
})
export class CrmModule {}
