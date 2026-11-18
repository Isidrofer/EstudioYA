import { Module } from '@nestjs/common';
import { StorageModule } from '../../storage/storage.module';
import { AuthModule } from '../auth/auth.module';
import { TeacherApplicationsController } from './teacher-applications.controller';
import { TeacherApplicationsService } from './teacher-applications.service';

@Module({
  imports: [AuthModule, StorageModule],
  controllers: [TeacherApplicationsController],
  providers: [TeacherApplicationsService],
  exports: [TeacherApplicationsService],
})
export class TeachersModule {}
