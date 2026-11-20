import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type {
  TeacherCardDto,
  TeacherProfileDto,
  TeacherSearchInput,
  TeacherSearchResponse,
  TeacherSubjectOfferDto,
} from '@estudioya/shared';
import { notFound } from '../../common/api-problem';
import { PrismaService } from '../../prisma/prisma.service';

const BIO_SUMMARY_LENGTH = 160;

const publicSelect = {
  id: true,
  type: true,
  bio: true,
  avatarUrl: true,
  careerName: true,
  graduationYear: true,
  ratingAvg: true,
  ratingCount: true,
  minutesTaught: true,
  cancellationRate: true,
  user: { select: { firstName: true, lastName: true } },
  faculty: { select: { id: true, name: true } },
  subjects: {
    select: {
      subjectId: true,
      individualPriceCents: true,
      groupPriceCents: true,
      subject: { select: { name: true, facultyId: true } },
    },
    orderBy: { subject: { name: 'asc' } },
  },
} satisfies Prisma.TeacherProfileSelect;

type PublicTeacher = Prisma.TeacherProfileGetPayload<{ select: typeof publicSelect }>;

/** Solo profesores aprobados y con cuenta activa (BR-11). */
const visibleTeacher: Prisma.TeacherProfileWhereInput = {
  status: 'APPROVED',
  user: { status: 'ACTIVE' },
};

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: TeacherSearchInput): Promise<TeacherSearchResponse> {
    const offerFilter = this.buildOfferFilter(query);
    const where: Prisma.TeacherProfileWhereInput = {
      ...visibleTeacher,
      ...(offerFilter ? { subjects: { some: offerFilter } } : {}),
      ...(query.minRating !== undefined
        ? { ratingCount: { gt: 0 }, ratingAvg: { gte: query.minRating } }
        : {}),
    };

    // Paso 1: filas livianas (id + claves de orden) de todos los que cumplen los filtros.
    // Ordenar por precio exige mirar las materias, que Prisma no permite en un orderBy;
    // se ordena en memoria y recién después se cargan los datos completos de la página.
    // Si el volumen crece, pasar este paso a SQL (ver docs/ARCHITECTURE.md).
    const candidates = await this.prisma.teacherProfile.findMany({
      where,
      select: {
        id: true,
        rankingScore: true,
        ratingAvg: true,
        ratingCount: true,
        reviewedAt: true,
        createdAt: true,
        subjects: {
          where: offerFilter ?? undefined,
          select: { individualPriceCents: true, groupPriceCents: true },
        },
      },
    });
    type Candidate = (typeof candidates)[number];

    /** Precio más bajo entre las ofertas que cumplen los filtros (para ordenar por precio). */
    const priceOf = (c: Candidate): number => {
      const prices: number[] = [];
      for (const s of c.subjects) {
        if (query.classType !== 'GROUP' && s.individualPriceCents !== null) {
          prices.push(s.individualPriceCents);
        }
        if (query.classType !== 'INDIVIDUAL' && s.groupPriceCents !== null) {
          prices.push(s.groupPriceCents);
        }
      }
      const inRange = prices.filter(
        (p) =>
          (query.minPrice === undefined || p >= query.minPrice) &&
          (query.maxPrice === undefined || p <= query.maxPrice),
      );
      return inRange.length ? Math.min(...inRange) : Number.MAX_SAFE_INTEGER;
    };

    // Desempate estable: más antiguo aprobado primero, luego id.
    const approvedAt = (c: Candidate) => (c.reviewedAt ?? c.createdAt).getTime();
    const byTieBreak = (a: Candidate, b: Candidate) =>
      approvedAt(a) - approvedAt(b) || a.id.localeCompare(b.id);

    const sorted = [...candidates];
    switch (query.sort) {
      case 'price_asc':
        sorted.sort((a, b) => priceOf(a) - priceOf(b) || byTieBreak(a, b));
        break;
      case 'price_desc':
        sorted.sort((a, b) => priceOf(b) - priceOf(a) || byTieBreak(a, b));
        break;
      case 'rating_desc':
        sorted.sort(
          (a, b) =>
            Number(b.ratingAvg) - Number(a.ratingAvg) ||
            b.ratingCount - a.ratingCount ||
            byTieBreak(a, b),
        );
        break;
      default:
        // Recomendado: rankingScore (hoy 0 para todos) y, de desempate, fecha de aprobación.
        sorted.sort((a, b) => b.rankingScore - a.rankingScore || byTieBreak(a, b));
    }

    const total = sorted.length;
    const pageIds = sorted
      .slice((query.page - 1) * query.pageSize, query.page * query.pageSize)
      .map((c) => c.id);

    // Paso 2: datos completos solo de la página pedida, respetando el orden calculado.
    const rows = pageIds.length
      ? await this.prisma.teacherProfile.findMany({
          where: { id: { in: pageIds } },
          select: publicSelect,
        })
      : [];
    const byId = new Map(rows.map((r) => [r.id, r]));
    const data = pageIds.flatMap((id) => {
      const row = byId.get(id);
      return row ? [this.toCard(row)] : [];
    });

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

  async getProfile(teacherId: string): Promise<TeacherProfileDto> {
    const row = await this.prisma.teacherProfile.findFirst({
      where: { id: teacherId, ...visibleTeacher },
      select: publicSelect,
    });
    // Un profesor no aprobado se trata igual que uno inexistente: no filtra su existencia.
    if (!row) throw notFound('El profesor no existe.');

    const { bioSummary: _bioSummary, ...card } = this.toCard(row);
    return {
      ...card,
      bio: row.bio,
      graduationYear: row.graduationYear,
      minutesTaught: row.minutesTaught,
      cancellationRate: Number(row.cancellationRate),
    };
  }

  /** Condición que debe cumplir UNA misma materia del profesor, o null si no hay filtros. */
  private buildOfferFilter(query: TeacherSearchInput): Prisma.TeacherSubjectWhereInput | null {
    const { subjectId, facultyId, classType, minPrice, maxPrice } = query;
    const hasPrice = minPrice !== undefined || maxPrice !== undefined;
    if (!subjectId && !facultyId && !classType && !hasPrice) return null;

    const range: Prisma.IntNullableFilter = {
      ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
    };
    // Con classType el precio se mira en esa columna; sin él, en cualquiera de las dos.
    let priceCondition: Prisma.TeacherSubjectWhereInput | null = null;
    if (classType === 'INDIVIDUAL') {
      priceCondition = { individualPriceCents: hasPrice ? range : { not: null } };
    } else if (classType === 'GROUP') {
      priceCondition = { groupPriceCents: hasPrice ? range : { not: null } };
    } else if (hasPrice) {
      priceCondition = { OR: [{ individualPriceCents: range }, { groupPriceCents: range }] };
    }

    return {
      ...(subjectId ? { subjectId } : {}),
      ...(facultyId ? { subject: { facultyId } } : {}),
      ...(priceCondition ? { AND: [priceCondition] } : {}),
    };
  }

  private toCard(row: PublicTeacher): TeacherCardDto {
    const subjects: TeacherSubjectOfferDto[] = row.subjects.map((s) => ({
      subjectId: s.subjectId,
      subjectName: s.subject.name,
      facultyId: s.subject.facultyId,
      individualPriceCents: s.individualPriceCents,
      groupPriceCents: s.groupPriceCents,
    }));
    return {
      id: row.id,
      firstName: row.user.firstName,
      lastName: row.user.lastName,
      avatarUrl: row.avatarUrl,
      type: row.type,
      bioSummary:
        row.bio && row.bio.length > BIO_SUMMARY_LENGTH
          ? `${row.bio.slice(0, BIO_SUMMARY_LENGTH).trimEnd()}…`
          : row.bio,
      faculty: row.faculty,
      careerName: row.careerName,
      ratingAvg: Number(row.ratingAvg),
      ratingCount: row.ratingCount,
      subjects,
    };
  }
}
