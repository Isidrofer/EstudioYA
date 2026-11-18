import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import type { ErrorCode, ProblemDetails } from '@estudioya/shared';
import { ApiProblem, problemType } from './api-problem';

const BY_STATUS: Record<number, { code: ErrorCode; title: string }> = {
  400: { code: 'VALIDATION_ERROR', title: 'Solicitud inválida' },
  401: { code: 'UNAUTHENTICATED', title: 'No autenticado' },
  403: { code: 'FORBIDDEN', title: 'No tenés permiso para esta acción' },
  404: { code: 'NOT_FOUND', title: 'Recurso no encontrado' },
  409: { code: 'CONFLICT', title: 'Conflicto con el estado actual' },
  413: { code: 'VALIDATION_ERROR', title: 'El archivo es demasiado grande' },
  429: { code: 'RATE_LIMITED', title: 'Demasiadas solicitudes' },
};

/** Convierte toda excepción al formato único `application/problem+json` (ARCHITECTURE §6, regla 13). */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const res = http.getResponse<Response>();
    const req = http.getRequest<Request>();
    const traceId = randomUUID();

    let problem: ProblemDetails;

    if (exception instanceof ApiProblem) {
      problem = {
        type: problemType(exception.code),
        title: exception.title,
        status: exception.getStatus(),
        code: exception.code,
        detail: exception.detail,
        errors: exception.errors,
        traceId,
      };
    } else if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const known = BY_STATUS[status] ?? { code: 'INTERNAL_ERROR' as ErrorCode, title: 'Error' };
      const body = exception.getResponse();
      const message =
        typeof body === 'string'
          ? body
          : Array.isArray((body as { message?: unknown }).message)
            ? ((body as { message: string[] }).message).join('; ')
            : (body as { message?: string }).message;
      problem = {
        type: problemType(known.code),
        title: known.title,
        status,
        code: known.code,
        detail: status < 500 ? message : undefined,
        traceId,
      };
    } else {
      this.logger.error(
        `[${traceId}] ${req.method} ${req.originalUrl}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
      problem = {
        type: problemType('INTERNAL_ERROR'),
        title: 'Error interno del servidor',
        status: 500,
        code: 'INTERNAL_ERROR',
        traceId,
      };
    }

    res.status(problem.status).type('application/problem+json').json(problem);
  }
}
