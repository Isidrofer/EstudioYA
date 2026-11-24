import { z } from 'zod';
import type { Role } from '../constants';

/**
 * Todo usuario nuevo se registra como STUDENT. Para ser profesor se usa la solicitud
 * de alta (PUT /teacher-applications/me) y, al aprobarse, el rol pasa a TEACHER.
 * Así nadie puede asignarse el rol de profesor (ni de admin) desde el registro.
 *
 * Los mensajes están en español porque los muestran tanto la web (validación del formulario)
 * como la API (`errors[]` de un 400).
 */
export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Ingresá un email válido')
    .max(254, 'El email es demasiado largo')
    .transform((v) => v.toLowerCase()),
  password: z.string().min(10, 'Mínimo 10 caracteres').max(128, 'Máximo 128 caracteres'),
  firstName: z.string().trim().min(1, 'Ingresá tu nombre').max(80, 'Máximo 80 caracteres'),
  lastName: z.string().trim().min(1, 'Ingresá tu apellido').max(80, 'Máximo 80 caracteres'),
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
  email: z
    .string()
    .trim()
    .email('Ingresá un email válido')
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1, 'Ingresá tu contraseña').max(128, 'Máximo 128 caracteres'),
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
