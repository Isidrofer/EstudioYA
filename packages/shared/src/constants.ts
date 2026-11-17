/** Reglas de negocio compartidas entre API y web. Ver docs/ARCHITECTURE.md, sección 5. */

/** Comisión de la plataforma en puntos básicos (3500 = 35 %). */
export const PLATFORM_COMMISSION_BPS = 3500;

export const CURRENCY = 'ARS' as const;

/** Edad mínima para usar la plataforma. */
export const MIN_AGE = 18;

/** Minutos que se retiene un cupo mientras el alumno paga. */
export const BOOKING_HOLD_MINUTES = 10;

export const ROLES = ['STUDENT', 'TEACHER', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export const CLASS_TYPES = ['INDIVIDUAL', 'GROUP'] as const;
export type ClassType = (typeof CLASS_TYPES)[number];

/**
 * Calcula la comisión y lo que recibe el profesor.
 * Todos los montos son enteros en centavos. Redondeo half-up; el profesor recibe el resto.
 */
export function splitAmount(
  amountCents: number,
  commissionBps: number = PLATFORM_COMMISSION_BPS,
): { commissionCents: number; teacherNetCents: number } {
  const commissionCents = Math.round((amountCents * commissionBps) / 10_000);
  return { commissionCents, teacherNetCents: amountCents - commissionCents };
}
