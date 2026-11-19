import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ACCESS_COOKIE, type AuthenticatedRequest, type JwtPayload } from './auth.types';

/**
 * Para rutas públicas que se comportan distinto si hay sesión (ej: POST /support/tickets).
 * Si la cookie `access_token` es válida, completa `req.user`; si no hay o venció, deja pasar
 * igual como anónimo (nunca devuelve 401). Uso: `@UseGuards(OptionalAuthGuard)` y leer `req.user`.
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = (req.cookies as Record<string, string> | undefined)?.[ACCESS_COOKIE];
    if (!token) return true;

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      req.user = { id: payload.sub, role: payload.role };
    } catch {
      // Sesión vencida o inválida: se sigue como anónimo.
    }
    return true;
  }
}
