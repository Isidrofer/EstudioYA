import { Injectable, StreamableFile } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type {
  AdminApplicationDetailDto,
  AdminApplicationsQuery,
  AdminApplicationSummaryDto,
  Paginated,
} from '@estudioya/shared';
import { conflict, notFound } from '../../common/api-problem';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { applicationInclude, toApplicationDto } from '../teachers/teacher-application.mapper';

const applicantSelect = { select: { id: true, firstName: true, lastName: true, email: true } } as const;

@Injectable()
export class AdminApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /** Lista solicitudes por estado, las más antiguas primero. */
  async list(query: AdminApplicationsQuery): Promise<Paginated<AdminApplicationSummaryDto>> {
    const where: Prisma.TeacherProfileWhereInput = { status: query.status };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.teacherProfile.count({ where }),
      this.prisma.teacherProfile.findMany({
        where,
        orderBy: { updatedAt: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: {
          user: applicantSelect,
          faculty: { select: { name: true } },
          _count: { select: { subjects: true, documents: true } },
        },
      }),
    ]);

    return {
      data: rows.map((row) => ({
        id: row.id,
        status: row.status,
        type: row.type,
        applicant: row.user,
        careerName: row.careerName,
        facultyName: row.faculty?.name ?? null,
        subjectsCount: row._count.subjects,
        documentsCount: row._count.documents,
        updatedAt: row.updatedAt.toISOString(),
      })),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }

  async detail(id: string): Promise<AdminApplicationDetailDto> {
    const profile = await this.prisma.teacherProfile.findUnique({
      where: { id },
      include: {
        ...applicationInclude,
        user: applicantSelect,
        faculty: { select: { name: true } },
      },
    });
    if (!profile) throw notFound('La solicitud no existe.');

    const subjects = await this.prisma.subject.findMany({
      where: { id: { in: profile.subjects.map((s) => s.subjectId) } },
      select: { id: true, name: true },
    });

    return {
      ...toApplicationDto(profile),
      applicant: profile.user,
      facultyName: profile.faculty?.name ?? null,
      subjectNames: Object.fromEntries(subjects.map((s) => [s.id, s.name])),
    };
  }

  /** Descarga un documento de una solicitud (solo admin). */
  async downloadDocument(applicationId: string, documentId: string): Promise<StreamableFile> {
    const doc = await this.prisma.verificationDocument.findFirst({
      where: { id: documentId, teacherProfileId: applicationId },
    });
    if (!doc) throw notFound('El documento no existe.');

    const stream = await this.storage.getStream(doc.storageKey);
    return new StreamableFile(stream, {
      type: doc.mimeType,
      length: doc.sizeBytes,
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(doc.originalName)}`,
    });
  }

  /** Aprueba la solicitud: el usuario pasa a ser TEACHER. Solo desde PENDING. */
  async approve(adminId: string, id: string): Promise<AdminApplicationDetailDto> {
    await this.prisma.$transaction(async (tx) => {
      const profile = await tx.teacherProfile.findUnique({ where: { id } });
      if (!profile) throw notFound('La solicitud no existe.');

      // updateMany con la condición de estado: si dos admins aprueban a la vez, solo uno gana.
      const updated = await tx.teacherProfile.updateMany({
        where: { id, status: 'PENDING' },
        data: {
          status: 'APPROVED',
          rejectionReason: null,
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
      });
      if (updated.count !== 1) throw conflict('La solicitud no está pendiente de revisión.');

      await tx.user.update({ where: { id: profile.userId }, data: { role: 'TEACHER' } });
      await tx.outboxEvent.create({
        data: {
          routingKey: 'teacher.approved',
          payload: { teacherProfileId: id, userId: profile.userId },
        },
      });
    });
    return this.detail(id);
  }

  /** Rechaza la solicitud con un motivo. Solo desde PENDING. El profesor puede corregirla y reenviarla. */
  async reject(adminId: string, id: string, reason: string): Promise<AdminApplicationDetailDto> {
    await this.prisma.$transaction(async (tx) => {
      const profile = await tx.teacherProfile.findUnique({ where: { id } });
      if (!profile) throw notFound('La solicitud no existe.');

      const updated = await tx.teacherProfile.updateMany({
        where: { id, status: 'PENDING' },
        data: {
          status: 'REJECTED',
          rejectionReason: reason,
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
      });
      if (updated.count !== 1) throw conflict('La solicitud no está pendiente de revisión.');

      await tx.outboxEvent.create({
        data: {
          routingKey: 'teacher.rejected',
          payload: { teacherProfileId: id, userId: profile.userId },
        },
      });
    });
    return this.detail(id);
  }
}
