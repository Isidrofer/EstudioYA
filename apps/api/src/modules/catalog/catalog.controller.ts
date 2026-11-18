import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  subjectSearchSchema,
  type FacultyDto,
  type Paginated,
  type SubjectDto,
  type SubjectSearchInput,
} from '@estudioya/shared';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { CatalogService } from './catalog.service';

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  /** Lista corta y acotada: no se pagina. */
  @Get('faculties')
  listFaculties(): Promise<FacultyDto[]> {
    return this.catalog.listFaculties();
  }

  @Get('faculties/:facultyId/subjects')
  listSubjects(@Param('facultyId', ParseUUIDPipe) facultyId: string): Promise<SubjectDto[]> {
    return this.catalog.listSubjectsByFaculty(facultyId);
  }

  @Get('subjects')
  searchSubjects(
    @Query(new ZodValidationPipe(subjectSearchSchema)) query: SubjectSearchInput,
  ): Promise<Paginated<SubjectDto>> {
    return this.catalog.searchSubjects(query);
  }
}
