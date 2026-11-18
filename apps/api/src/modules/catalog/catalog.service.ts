import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { FacultyDto, Paginated, SubjectDto, SubjectSearchInput } from '@estudioya/shared';
import { notFound } from '../../common/api-problem';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  listFaculties(): Promise<FacultyDto[]> {
    return this.prisma.faculty.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    });
  }

  async listSubjectsByFaculty(facultyId: string): Promise<SubjectDto[]> {
    const faculty = await this.prisma.faculty.findUnique({
      where: { id: facultyId },
      select: { id: true },
    });
    if (!faculty) throw notFound('La facultad no existe.');

    return this.prisma.subject.findMany({
      where: { facultyId },
      select: { id: true, name: true, slug: true, facultyId: true },
      orderBy: { name: 'asc' },
    });
  }

  async searchSubjects(query: SubjectSearchInput): Promise<Paginated<SubjectDto>> {
    const where: Prisma.SubjectWhereInput = {
      ...(query.facultyId ? { facultyId: query.facultyId } : {}),
      ...(query.q ? { name: { contains: query.q, mode: 'insensitive' } } : {}),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.subject.count({ where }),
      this.prisma.subject.findMany({
        where,
        select: { id: true, name: true, slug: true, facultyId: true },
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return {
      data,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }
}
