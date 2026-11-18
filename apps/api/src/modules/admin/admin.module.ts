import { Module } from '@nestjs/common';
import { StorageModule } from '../../storage/storage.module';
import { AuthModule } from '../auth/auth.module';
import { AdminApplicationsController } from './admin-applications.controller';
import { AdminApplicationsService } from './admin-applications.service';

@Module({
  imports: [AuthModule, StorageModule],
  controllers: [AdminApplicationsController],
  providers: [AdminApplicationsService],
})
export class AdminModule {}
