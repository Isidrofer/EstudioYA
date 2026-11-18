import { HttpException } from '@nestjs/common';
import type { ErrorCode } from '@estudioya/shared';

/**
 * Error de negocio con el formato de contrato de la API (RFC 7807).
 * Lo convierte en respuesta `application/problem+json` el ProblemDetailsFilter.
 */
export class ApiProblem extends HttpException {
  constructor(
    status: number,
    public readonly code: ErrorCode,
    public readonly title: string,
    public readonly detail?: string,
    public readonly errors?: { field: string; message: string }[],
  ) {
    super(title, status);
  }
}

export const unauthenticated = (detail?: string) =>
  new ApiProblem(401, 'UNAUTHENTICATED', 'No autenticado', detail);

export const forbidden = (detail?: string) =>
  new ApiProblem(403, 'FORBIDDEN', 'No tenés permiso para esta acción', detail);

export const notFound = (detail?: string) =>
  new ApiProblem(404, 'NOT_FOUND', 'Recurso no encontrado', detail);

export const conflict = (detail?: string) =>
  new ApiProblem(409, 'CONFLICT', 'Conflicto con el estado actual', detail);

export const problemType = (code: ErrorCode) =>
  `urn:estudioya:error:${code.toLowerCase().replace(/_/g, '-')}`;
