import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  adminApplicationsQuerySchema,
  rejectApplicationSchema,
  type AdminApplicationDetailDto,
  type AdminApplicationsQuery,
  type AdminApplicationSummaryDto,
  type Paginated,
  type RejectApplicationInput,
} from '@estudioya/shared';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { AuthGuard } from '../auth/auth.guard';
import type { SessionUser } from '../auth/auth.types';
import { CurrentUser, Roles, RolesGuard } from '../auth/roles';
import { AdminApplicationsService } from './admin-applications.service';

/** Revisión manual de solicitudes de profesores. Solo ADMIN. */
@Controller('admin/teacher-applications')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminApplicationsController {
  constructor(private readonly applications: AdminApplicationsService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(adminApplicationsQuerySchema)) query: AdminApplicationsQuery,
  ): Promise<Paginated<AdminApplicationSummaryDto>> {
    return this.applications.list(query);
  }

  @Get(':applicationId')
  detail(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ): Promise<AdminApplicationDetailDto> {
    return this.applications.detail(applicationId);
  }

  @Get(':applicationId/documents/:documentId')
  downloadDocument(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ): Promise<StreamableFile> {
    return this.applications.downloadDocument(applicationId, documentId);
  }

  @Post(':applicationId/approve')
  @HttpCode(200)
  approve(
    @CurrentUser() admin: SessionUser,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ): Promise<AdminApplicationDetailDto> {
    return this.applications.approve(admin.id, applicationId);
  }

  @Post(':applicationId/reject')
  @HttpCode(200)
  reject(
    @CurrentUser() admin: SessionUser,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body(new ZodValidationPipe(rejectApplicationSchema)) body: RejectApplicationInput,
  ): Promise<AdminApplicationDetailDto> {
    return this.applications.reject(admin.id, applicationId, body.reason);
  }
}
