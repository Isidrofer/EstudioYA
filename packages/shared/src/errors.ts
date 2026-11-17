/** Formato único de error de la API (RFC 7807, application/problem+json). */
export interface ProblemDetails {
  type: string; // URL o URN estable, ej: "urn:estudioya:error:slot-unavailable"
  title: string;
  status: number;
  detail?: string;
  code: ErrorCode;
  /** Errores de validación por campo. */
  errors?: { field: string; message: string }[];
  traceId?: string;
}

export const ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'SLOT_UNAVAILABLE',
  'BOOKING_OVERLAP',
  'PRICE_OUT_OF_RANGE',
  'PAYMENT_FAILED',
  'MESSAGE_BLOCKED',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];
