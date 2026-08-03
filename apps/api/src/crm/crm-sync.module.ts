import { Module } from '@nestjs/common';
import { CrmSyncService } from './crm-sync.service';

@Module({
  providers: [CrmSyncService],
  exports: [CrmSyncService],
})
export class CrmSyncModule {}
