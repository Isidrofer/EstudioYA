import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthCookiesService } from './auth-cookies.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { RolesGuard } from './roles';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_ACCESS_SECRET');
        if (!secret) throw new Error('Falta JWT_ACCESS_SECRET en el .env');
        if (config.get('NODE_ENV') === 'production' && secret === 'cambiar-en-local') {
          throw new Error('JWT_ACCESS_SECRET no puede ser el valor de ejemplo en producción');
        }
        return { secret };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthCookiesService, AuthGuard, RolesGuard],
  // Otros módulos que usen AuthGuard/RolesGuard importan AuthModule.
  exports: [JwtModule, AuthGuard, RolesGuard],
})
export class AuthModule {}
