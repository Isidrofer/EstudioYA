import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import { durationToMs } from '../../common/duration';
import { ACCESS_COOKIE, REFRESH_COOKIE } from './auth.types';

/** El refresh token solo viaja a las rutas de /auth, nunca al resto de la API. */
const REFRESH_PATH = '/api/v1/auth';

@Injectable()
export class AuthCookiesService {
  readonly accessTtlMs: number;
  readonly refreshTtlMs: number;
  private readonly secure: boolean;

  constructor(config: ConfigService) {
    this.accessTtlMs = durationToMs(config.get<string>('ACCESS_TOKEN_TTL') ?? '15m');
    this.refreshTtlMs = durationToMs(config.get<string>('REFRESH_TOKEN_TTL') ?? '30d');
    this.secure = config.get<string>('NODE_ENV') === 'production';
  }

  private base(): CookieOptions {
    return { httpOnly: true, sameSite: 'lax', secure: this.secure };
  }

  set(res: Response, tokens: { accessToken: string; refreshToken: string }) {
    res.cookie(ACCESS_COOKIE, tokens.accessToken, {
      ...this.base(),
      path: '/',
      maxAge: this.accessTtlMs,
    });
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      ...this.base(),
      path: REFRESH_PATH,
      maxAge: this.refreshTtlMs,
    });
  }

  clear(res: Response) {
    res.clearCookie(ACCESS_COOKIE, { ...this.base(), path: '/' });
    res.clearCookie(REFRESH_COOKIE, { ...this.base(), path: REFRESH_PATH });
  }
}
