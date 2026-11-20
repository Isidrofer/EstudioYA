import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  teacherSearchSchema,
  type TeacherProfileDto,
  type TeacherSearchInput,
  type TeacherSearchResponse,
} from '@estudioya/shared';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { TeachersService } from './teachers.service';

/** Búsqueda y perfil público de profesores. Rutas públicas (sin sesión). */
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachers: TeachersService) {}

  @Get()
  search(
    @Query(new ZodValidationPipe(teacherSearchSchema)) query: TeacherSearchInput,
  ): Promise<TeacherSearchResponse> {
    return this.teachers.search(query);
  }

  /** Cuando existan rutas como `teachers/me`, declararlas ANTES de esta (el id exige UUID). */
  @Get(':teacherId')
  getProfile(@Param('teacherId', ParseUUIDPipe) teacherId: string): Promise<TeacherProfileDto> {
    return this.teachers.getProfile(teacherId);
  }
}
