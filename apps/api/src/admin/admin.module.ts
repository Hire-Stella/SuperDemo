import { Module } from '@nestjs/common';
import { CallsModule } from '../calls/calls.module';
import { CrmSyncModule } from '../crm/crm-sync.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [CallsModule, CrmSyncModule],
  controllers: [AdminController],
})
export class AdminModule {}
