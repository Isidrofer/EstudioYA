import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email().max(254).transform((v) => v.toLowerCase()),
  password: z.string().min(10).max(128),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  role: z.enum(['STUDENT', 'TEACHER']),
  /** Debe ser true: declara ser mayor de 18 años. */
  isAdultDeclaration: z.literal(true),
  /** Debe ser true: acepta términos y condiciones y política de privacidad. */
  acceptTerms: z.literal(true),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase()),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;
