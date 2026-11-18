import type { Request } from 'express';
import type { Role } from '@estudioya/shared';

export interface JwtPayload {
  sub: string;
  role: Role;
}

export interface SessionUser {
  id: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user?: SessionUser;
}

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';
