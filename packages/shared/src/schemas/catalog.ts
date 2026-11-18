import { z } from 'zod';

export interface FacultyDto {
  id: string;
  name: string;
  slug: string;
}

export interface SubjectDto {
  id: string;
  name: string;
  slug: string;
  facultyId: string;
}

/** Respuesta paginada estándar (ARCHITECTURE §6, regla 16). */
export interface Paginated<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export const subjectSearchSchema = z.object({
  q: z.string().trim().min(1).max(80).optional(),
  facultyId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type SubjectSearchInput = z.infer<typeof subjectSearchSchema>;
