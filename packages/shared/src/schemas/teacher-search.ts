import { z } from 'zod';
import { CLASS_TYPES } from '../constants';
import type { Paginated } from './catalog';

export const TEACHER_SORTS = ['recommended', 'price_asc', 'price_desc', 'rating_desc'] as const;
export type TeacherSort = (typeof TEACHER_SORTS)[number];

/**
 * Filtros de `GET /teachers`. Los precios van en centavos de ARS (por hora).
 * Todos los filtros de materia/precio se aplican sobre la MISMA materia del profesor:
 * "materia X entre $8.000 y $12.000" exige que X cumpla ambas cosas a la vez.
 */
export const teacherSearchSchema = z
  .object({
    /** Facultad a la que pertenece la materia que dicta (no la facultad de origen del profesor). */
    facultyId: z.string().uuid().optional(),
    subjectId: z.string().uuid().optional(),
    classType: z.enum(CLASS_TYPES).optional(),
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().min(0).optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    sort: z.enum(TEACHER_SORTS).default('recommended'),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
  })
  .refine((v) => v.minPrice === undefined || v.maxPrice === undefined || v.minPrice <= v.maxPrice, {
    path: ['minPrice'],
    message: 'minPrice no puede ser mayor que maxPrice.',
  });
export type TeacherSearchInput = z.infer<typeof teacherSearchSchema>;

export interface TeacherSubjectOfferDto {
  subjectId: string;
  subjectName: string;
  facultyId: string;
  /** null = no ofrece clases individuales. */
  individualPriceCents: number | null;
  /** Por alumno. null = no ofrece clases grupales. */
  groupPriceCents: number | null;
}

export interface TeacherCardDto {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  type: 'ADVANCED_STUDENT' | 'GRADUATE';
  /** Primeros caracteres de la bio. */
  bioSummary: string | null;
  faculty: { id: string; name: string } | null;
  careerName: string | null;
  ratingAvg: number;
  ratingCount: number;
  subjects: TeacherSubjectOfferDto[];
}

export interface TeacherProfileDto extends Omit<TeacherCardDto, 'bioSummary'> {
  bio: string | null;
  graduationYear: number | null;
  minutesTaught: number;
  /** Proporción 0..1 de clases canceladas por el profesor. */
  cancellationRate: number;
}

export type TeacherSearchResponse = Paginated<TeacherCardDto>;
