import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from './health/health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { PrismaModule } from './prisma/prisma.module';

/**
 * Módulo raíz. Los módulos de dominio viven en src/modules/.
 * Pendientes: users, teachers, availability, bookings, payments, chat, reviews, support, admin.
 * Ver docs/ARCHITECTURE.md, sección 4.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'] }),
    // Límite general: 120 solicitudes por minuto (ARCHITECTURE §6, regla 22).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    CatalogModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
