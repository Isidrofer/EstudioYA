import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@estudioya/shared';
import { forbidden } from '../../common/api-problem';
import type { AuthenticatedRequest, SessionUser } from './auth.types';

const ROLES_KEY = 'roles';

/** Restringe una ruta a ciertos roles. Va junto con AuthGuard: `@UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN')`. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
    if (!user || !required.includes(user.role)) throw forbidden();
    return true;
  }
}

/** Inyecta el usuario de la sesión (`{ id, role }`) en el handler. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): SessionUser =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user as SessionUser,
);
