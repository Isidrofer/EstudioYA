import type { NextFunction, Request, Response } from 'express';
import { problemType } from './api-problem';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
/** Webhooks de terceros: no pueden enviar el header (se validan por firma). */
const EXEMPT_PREFIXES = ['/api/v1/payments/webhooks/'];

/**
 * Defensa CSRF básica (ARCHITECTURE §6, regla 10): toda ruta que modifica datos debe enviar
 * `X-Requested-With: estudioya`. Un formulario de otro sitio no puede agregar ese header.
 */
export function csrfHeaderMiddleware(req: Request, res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (EXEMPT_PREFIXES.some((p) => req.originalUrl.startsWith(p))) return next();
  if (req.header('x-requested-with') === 'estudioya') return next();

  res
    .status(403)
    .type('application/problem+json')
    .json({
      type: problemType('FORBIDDEN'),
      title: 'No tenés permiso para esta acción',
      status: 403,
      code: 'FORBIDDEN',
      detail: 'Falta el header X-Requested-With.',
    });
}
