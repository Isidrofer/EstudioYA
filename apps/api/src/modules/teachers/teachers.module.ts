import { Module } from '@nestjs/common';
import { StorageModule } from '../../storage/storage.module';
import { AuthModule } from '../auth/auth.module';
import { TeacherApplicationsController } from './teacher-applications.controller';
import { TeacherApplicationsService } from './teacher-applications.service';
import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';

@Module({
  imports: [AuthModule, StorageModule],
  controllers: [TeacherApplicationsController, TeachersController],
  providers: [TeacherApplicationsService, TeachersService],
  exports: [TeacherApplicationsService, TeachersService],
})
export class TeachersModule {}
