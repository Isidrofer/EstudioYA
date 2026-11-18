import { z } from 'zod';
import type { Role } from '../constants';

/**
 * Todo usuario nuevo se registra como STUDENT. Para ser profesor se usa la solicitud
 * de alta (POST /teacher-applications) y, al aprobarse, el rol pasa a TEACHER.
 * Así nadie puede asignarse el rol de profesor (ni de admin) desde el registro.
 */
export const registerSchema = z.object({
  email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()),
  password: z.string().min(10, 'Mínimo 10 caracteres').max(128),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  /** Debe ser true: declara ser mayor de 18 años. */
  isAdultDeclaration: z.literal(true, {
    errorMap: () => ({ message: 'Debés declarar que sos mayor de 18 años' }),
  }),
  /** Debe ser true: acepta términos y condiciones y política de privacidad. */
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Debés aceptar los términos y condiciones' }),
  }),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

/** Usuario que devuelve la API (nunca incluye hashes ni datos internos). */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}
