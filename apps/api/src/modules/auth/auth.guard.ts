import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { unauthenticated } from '../../common/api-problem';
import { ACCESS_COOKIE, type AuthenticatedRequest, type JwtPayload } from './auth.types';

/** Exige sesión válida (cookie `access_token`). Uso: `@UseGuards(AuthGuard)`. */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = (req.cookies as Record<string, string> | undefined)?.[ACCESS_COOKIE];
    if (!token) throw unauthenticated('Iniciá sesión para continuar.');

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      req.user = { id: payload.sub, role: payload.role };
      return true;
    } catch {
      throw unauthenticated('La sesión venció. Volvé a iniciar sesión.');
    }
  }
}
