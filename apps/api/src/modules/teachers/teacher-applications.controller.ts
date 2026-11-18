import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  MAX_DOCUMENT_BYTES,
  teacherApplicationSchema,
  uploadDocumentSchema,
  type TeacherApplicationDto,
  type TeacherApplicationInput,
  type UploadDocumentInput,
  type VerificationDocumentDto,
} from '@estudioya/shared';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { AuthGuard } from '../auth/auth.guard';
import type { SessionUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/roles';
import { TeacherApplicationsService } from './teacher-applications.service';

/** Solicitud del usuario autenticado para ser profesor. */
@Controller('teacher-applications')
@UseGuards(AuthGuard)
export class TeacherApplicationsController {
  constructor(private readonly applications: TeacherApplicationsService) {}

  @Get('me')
  getMine(@CurrentUser() user: SessionUser): Promise<TeacherApplicationDto> {
    return this.applications.getMine(user.id);
  }

  /** Crea o reemplaza los datos de la solicitud (mientras esté en borrador o rechazada). */
  @Put('me')
  save(
    @CurrentUser() user: SessionUser,
    @Body(new ZodValidationPipe(teacherApplicationSchema)) body: TeacherApplicationInput,
  ): Promise<TeacherApplicationDto> {
    return this.applications.upsert(user.id, body);
  }

  /** Sube un certificado o título (multipart/form-data: campos `kind` y `file`). */
  @Post('me/documents')
  @HttpCode(201)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_DOCUMENT_BYTES, files: 1 } }))
  uploadDocument(
    @CurrentUser() user: SessionUser,
    @Body(new ZodValidationPipe(uploadDocumentSchema)) body: UploadDocumentInput,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<VerificationDocumentDto> {
    return this.applications.uploadDocument(user.id, body, file);
  }

  @Delete('me/documents/:documentId')
  @HttpCode(204)
  async deleteDocument(
    @CurrentUser() user: SessionUser,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ): Promise<void> {
    await this.applications.deleteDocument(user.id, documentId);
  }

  /** Envía la solicitud a revisión del administrador. */
  @Post('me/submit')
  @HttpCode(200)
  submit(@CurrentUser() user: SessionUser): Promise<TeacherApplicationDto> {
    return this.applications.submit(user.id);
  }
}
