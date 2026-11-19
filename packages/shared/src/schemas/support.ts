import { z } from 'zod';

/** Categorías de un ticket de soporte (enum `TicketCategory` de la base). */
export const TICKET_CATEGORIES = ['PAYMENT', 'CLASS', 'ACCOUNT', 'TEACHER_REPORT', 'OTHER'] as const;
export type TicketCategory = (typeof TICKET_CATEGORIES)[number];

/** Estados de un ticket de soporte (enum `TicketStatus` de la base). */
export const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED'] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

// ───────────── FAQ ─────────────

/** Datos de una pregunta frecuente (POST /admin/faq y PUT /admin/faq/:faqId reciben el objeto completo). */
export const faqSchema = z.object({
  question: z.string().trim().min(5, 'La pregunta es muy corta (mínimo 5 caracteres)').max(300),
  answer: z.string().trim().min(5, 'La respuesta es muy corta (mínimo 5 caracteres)').max(5000),
  /** Orden de aparición: menor primero. */
  position: z.number().int().min(0).max(10_000).default(0),
  /** Solo las publicadas aparecen en GET /faq. */
  published: z.boolean().default(true),
});
export type FaqInput = z.infer<typeof faqSchema>;

// ───────────── Tickets de soporte ─────────────

/** Formulario de contacto (POST /support/tickets). Público: no exige sesión. */
export const createTicketSchema = z.object({
  category: z.enum(TICKET_CATEGORIES),
  subject: z.string().trim().min(3, 'Escribí un asunto (mínimo 3 caracteres)').max(150),
  message: z.string().trim().min(10, 'Contanos un poco más (mínimo 10 caracteres)').max(5000),
  /** Email de contacto para responder. Si hay sesión, el frontend lo puede precompletar. */
  email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()),
});
export type CreateTicketInput = z.infer<typeof createTicketSchema>;

/** Filtros del listado de tickets del admin. Por defecto muestra los abiertos, los más antiguos primero. */
export const adminTicketsQuerySchema = z.object({
  status: z.enum(TICKET_STATUSES).default('OPEN'),
  category: z.enum(TICKET_CATEGORIES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type AdminTicketsQuery = z.infer<typeof adminTicketsQuerySchema>;

/** Cambio de estado de un ticket (PATCH /admin/support/tickets/:ticketId). */
export const updateTicketSchema = z.object({
  status: z.enum(TICKET_STATUSES),
});
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;

// ───────────── Respuestas de la API ─────────────

/** Pregunta frecuente tal como la ve el público. */
export interface FaqDto {
  id: string;
  question: string;
  answer: string;
  position: number;
}

/** Vista del admin: incluye las no publicadas. */
export interface AdminFaqDto extends FaqDto {
  published: boolean;
  updatedAt: string;
}

/** Lo que recibe quien envía el formulario de contacto. */
export interface CreatedTicketDto {
  id: string;
  status: TicketStatus;
  createdAt: string;
}

/** Ticket completo (solo admin). `user` es null si se envió sin sesión. */
export interface SupportTicketDto {
  id: string;
  category: TicketCategory;
  subject: string;
  message: string;
  email: string;
  status: TicketStatus;
  user: { id: string; firstName: string; lastName: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}
