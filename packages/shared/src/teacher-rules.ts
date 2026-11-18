import type { ClassType } from './constants';

/**
 * RANGO DE PRECIOS PROVISORIO (en centavos de ARS, por hora; el grupal es POR ALUMNO).
 * Valores de ejemplo hardcodeados para desarrollo. Antes de salir a producción hay que
 * definirlos con el equipo y moverlos a la tabla `platform_settings` (editable por el admin).
 * Ver docs/ARCHITECTURE.md, decisión D-01.
 */
export const PRICE_RANGE_CENTS = {
  INDIVIDUAL: { min: 800_000, max: 2_500_000 }, // $8.000 a $25.000 por hora
  GROUP: { min: 400_000, max: 1_500_000 }, // $4.000 a $15.000 por hora, por alumno
} as const satisfies Record<ClassType, { min: number; max: number }>;

export const isPriceInRange = (classType: ClassType, cents: number): boolean => {
  const range = PRICE_RANGE_CENTS[classType];
  return Number.isInteger(cents) && cents >= range.min && cents <= range.max;
};

/** Formatea centavos como pesos argentinos sin decimales (ej: 800000 → "$ 8.000"). */
export const formatArs = (cents: number): string =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(cents / 100);

export const TEACHER_TYPES = ['ADVANCED_STUDENT', 'GRADUATE'] as const;
export type TeacherType = (typeof TEACHER_TYPES)[number];

export const TEACHER_STATUSES = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as const;
export type TeacherStatus = (typeof TEACHER_STATUSES)[number];

export const DOCUMENT_KINDS = [
  'STUDENT_CERTIFICATE',
  'APPROVED_SUBJECTS_CERTIFICATE',
  'DEGREE',
] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export const DOCUMENT_LABELS: Record<DocumentKind, string> = {
  STUDENT_CERTIFICATE: 'Certificado de alumno regular',
  APPROVED_SUBJECTS_CERTIFICATE: 'Certificado de materias aprobadas',
  DEGREE: 'Título',
};

export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_DOCUMENTS_PER_APPLICATION = 6;
export const ALLOWED_DOCUMENT_FORMATS_LABEL = 'PDF, JPG o PNG';

/**
 * Documentación obligatoria según el tipo de profesor:
 *  - Estudiante avanzado: certificado de alumno regular + certificado de materias aprobadas.
 *  - Graduado: título.
 */
const REQUIRED_DOCUMENTS: Record<TeacherType, readonly DocumentKind[]> = {
  ADVANCED_STUDENT: ['STUDENT_CERTIFICATE', 'APPROVED_SUBJECTS_CERTIFICATE'],
  GRADUATE: ['DEGREE'],
};

/** Devuelve los documentos obligatorios que todavía no se subieron. */
export const missingDocuments = (
  type: TeacherType,
  uploaded: readonly DocumentKind[],
): DocumentKind[] => REQUIRED_DOCUMENTS[type].filter((kind) => !uploaded.includes(kind));
