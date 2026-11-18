import { z } from 'zod';
import {
  DOCUMENT_KINDS,
  TEACHER_STATUSES,
  TEACHER_TYPES,
  type DocumentKind,
  type TeacherStatus,
  type TeacherType,
} from '../teacher-rules';

const currentYear = new Date().getFullYear();

/** Materia que ofrece el profesor y a qué precio por hora (centavos de ARS). */
export const subjectOfferSchema = z
  .object({
    subjectId: z.string().uuid(),
    /** Precio por hora de clase individual. Omitir si no ofrece individuales. */
    individualPriceCents: z.number().int().positive().optional(),
    /** Precio por hora POR ALUMNO de clase grupal. Omitir si no ofrece grupales. */
    groupPriceCents: z.number().int().positive().optional(),
  })
  .refine((v) => v.individualPriceCents !== undefined || v.groupPriceCents !== undefined, {
    message: 'Indicá al menos un precio (individual o grupal)',
    path: ['individualPriceCents'],
  });

/** Datos de la solicitud para ser profesor. Se envía completa cada vez (PUT /teacher-applications/me). */
export const teacherApplicationSchema = z
  .object({
    type: z.enum(TEACHER_TYPES),
    facultyId: z.string().uuid(),
    careerName: z.string().trim().min(2).max(120),
    /** Obligatorio para graduados. */
    graduationYear: z.number().int().min(1950).max(currentYear).optional(),
    bio: z.string().trim().min(30, 'Contanos un poco más (mínimo 30 caracteres)').max(1000),
    subjects: z.array(subjectOfferSchema).min(1, 'Elegí al menos una materia').max(30),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'GRADUATE' && value.graduationYear === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['graduationYear'],
        message: 'Indicá el año de egreso',
      });
    }
    const seen = new Set<string>();
    value.subjects.forEach((subject, index) => {
      if (seen.has(subject.subjectId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['subjects', index, 'subjectId'],
          message: 'La materia está repetida',
        });
      }
      seen.add(subject.subjectId);
    });
  });
export type TeacherApplicationInput = z.infer<typeof teacherApplicationSchema>;

export const uploadDocumentSchema = z.object({ kind: z.enum(DOCUMENT_KINDS) });
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;

export const adminApplicationsQuerySchema = z.object({
  status: z.enum(TEACHER_STATUSES).default('PENDING'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type AdminApplicationsQuery = z.infer<typeof adminApplicationsQuerySchema>;

export const rejectApplicationSchema = z.object({
  reason: z.string().trim().min(10, 'Explicá el motivo (mínimo 10 caracteres)').max(500),
});
export type RejectApplicationInput = z.infer<typeof rejectApplicationSchema>;

// ───────────── Respuestas de la API ─────────────

export interface VerificationDocumentDto {
  id: string;
  kind: DocumentKind;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface TeacherApplicationDto {
  id: string;
  status: TeacherStatus;
  type: TeacherType;
  facultyId: string | null;
  careerName: string | null;
  graduationYear: number | null;
  bio: string | null;
  /** Motivo del rechazo, si la solicitud fue rechazada. */
  rejectionReason: string | null;
  subjects: {
    subjectId: string;
    individualPriceCents: number | null;
    groupPriceCents: number | null;
  }[];
  documents: VerificationDocumentDto[];
  /** Documentos obligatorios que faltan subir para poder enviar la solicitud. */
  missingDocuments: DocumentKind[];
  updatedAt: string;
}

export interface AdminApplicationSummaryDto {
  id: string;
  status: TeacherStatus;
  type: TeacherType;
  applicant: { id: string; firstName: string; lastName: string; email: string };
  careerName: string | null;
  facultyName: string | null;
  subjectsCount: number;
  documentsCount: number;
  updatedAt: string;
}

export interface AdminApplicationDetailDto extends TeacherApplicationDto {
  applicant: { id: string; firstName: string; lastName: string; email: string };
  facultyName: string | null;
  /** subjectId → nombre de la materia, para mostrar el detalle. */
  subjectNames: Record<string, string>;
}
