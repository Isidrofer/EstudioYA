import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, type User } from '@prisma/client';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import {
  CURRENT_TERMS_VERSION,
  type AuthUser,
  type LoginInput,
  type RegisterInput,
} from '@estudioya/shared';
import { conflict, notFound, unauthenticated } from '../../common/api-problem';
import { durationToMs } from '../../common/duration';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from './auth.types';

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

export const toAuthUser = (user: User): AuthUser => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role,
});

@Injectable()
export class AuthService {
  /** Hash falso para que el login tarde lo mismo exista o no el email (evita enumerar usuarios). */
  private dummyHash?: Promise<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(input: RegisterInput): Promise<{ user: AuthUser; tokens: SessionTokens }> {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw conflict('Ya existe una cuenta con ese email.');

    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    const now = new Date();

    let user: User;
    try {
      user = await this.prisma.user.create({
        data: {
          email: input.email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          role: 'STUDENT',
          adultDeclaredAt: now,
          termsAcceptedAt: now,
          termsVersion: CURRENT_TERMS_VERSION,
        },
      });
    } catch (error) {
      // Dos registros simultáneos con el mismo email: gana uno, el otro cae acá.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw conflict('Ya existe una cuenta con ese email.');
      }
      throw error;
    }

    return { user: toAuthUser(user), tokens: await this.issueSession(user) };
  }

  async login(input: LoginInput): Promise<{ user: AuthUser; tokens: SessionTokens }> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });

    const dummy = (this.dummyHash ??= argon2.hash('contraseña-falsa-para-igualar-tiempos', {
      type: argon2.argon2id,
    }));
    const hashToCheck = user?.passwordHash ?? (await dummy);
    const passwordOk = await argon2.verify(hashToCheck, input.password);

    if (!user || !user.passwordHash || !passwordOk || user.status !== 'ACTIVE') {
      throw unauthenticated('Email o contraseña incorrectos.');
    }

    return { user: toAuthUser(user), tokens: await this.issueSession(user) };
  }

  /**
   * Rota el refresh token. Si llega uno ya usado (posible robo), se revocan todas las
   * sesiones del usuario y se exige volver a iniciar sesión.
   */
  async refresh(rawRefreshToken: string | undefined): Promise<SessionTokens> {
    if (!rawRefreshToken) throw unauthenticated('Sesión no iniciada.');

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: sha256(rawRefreshToken) },
      include: { user: true },
    });
    if (!stored) throw unauthenticated('Sesión inválida.');

    if (stored.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw unauthenticated('Sesión inválida.');
    }
    if (stored.expiresAt <= new Date() || stored.user.status !== 'ACTIVE') {
      throw unauthenticated('Sesión vencida.');
    }

    // Solo una request puede "gastar" este token: la que logra revocarlo.
    const spent = await this.prisma.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (spent.count !== 1) throw unauthenticated('Sesión inválida.');

    return this.issueSession(stored.user);
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) return;
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(rawRefreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== 'ACTIVE') throw notFound();
    return toAuthUser(user);
  }

  private async issueSession(user: User): Promise<SessionTokens> {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    const accessTtlSeconds = Math.floor(
      durationToMs(this.config.get<string>('ACCESS_TOKEN_TTL') ?? '15m') / 1000,
    );
    const accessToken = await this.jwt.signAsync(payload, { expiresIn: accessTtlSeconds });

    const refreshToken = randomBytes(32).toString('base64url');
    const refreshTtlMs = durationToMs(this.config.get<string>('REFRESH_TOKEN_TTL') ?? '30d');
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(refreshToken),
        expiresAt: new Date(Date.now() + refreshTtlMs),
      },
    });

    return { accessToken, refreshToken };
  }
}
