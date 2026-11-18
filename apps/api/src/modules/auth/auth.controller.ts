import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import {
  loginSchema,
  registerSchema,
  type AuthUser,
  type LoginInput,
  type RegisterInput,
} from '@estudioya/shared';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { AuthCookiesService } from './auth-cookies.service';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { REFRESH_COOKIE, type AuthenticatedRequest, type SessionUser } from './auth.types';
import { CurrentUser } from './roles';

/** Intentos de login/registro: 10 por minuto (ARCHITECTURE §6, regla 22). */
const STRICT_LIMIT = { default: { limit: 10, ttl: 60_000 } };

const refreshCookieOf = (req: AuthenticatedRequest) =>
  (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: AuthCookiesService,
  ) {}

  @Post('register')
  @Throttle(STRICT_LIMIT)
  @HttpCode(201)
  async register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterInput,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthUser> {
    const { user, tokens } = await this.auth.register(body);
    this.cookies.set(res, tokens);
    res.setHeader('Location', '/api/v1/auth/me');
    return user;
  }

  @Post('login')
  @Throttle(STRICT_LIMIT)
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthUser> {
    const { user, tokens } = await this.auth.login(body);
    this.cookies.set(res, tokens);
    return user;
  }

  /** Renueva la sesión con el refresh token (rotativo). */
  @Post('refresh')
  @HttpCode(204)
  async refresh(@Req() req: AuthenticatedRequest, @Res({ passthrough: true }) res: Response) {
    try {
      const tokens = await this.auth.refresh(refreshCookieOf(req));
      this.cookies.set(res, tokens);
    } catch (error) {
      this.cookies.clear(res);
      throw error;
    }
  }

  /** Funciona aunque la sesión haya vencido: revoca el refresh token y limpia las cookies. */
  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: AuthenticatedRequest, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(refreshCookieOf(req));
    this.cookies.clear(res);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() session: SessionUser): Promise<AuthUser> {
    return this.auth.me(session.id);
  }
}
