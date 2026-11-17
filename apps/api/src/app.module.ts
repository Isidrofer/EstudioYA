import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller';

/**
 * Módulo raíz. Los módulos de dominio (auth, users, catalog, teachers, availability,
 * bookings, payments, chat, reviews, support, admin) se irán agregando en src/modules/.
 * Ver docs/ARCHITECTURE.md, sección 4.
 */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'] })],
  controllers: [HealthController],
})
export class AppModule {}
