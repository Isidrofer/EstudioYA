import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { csrfHeaderMiddleware } from './common/csrf-header.middleware';
import { ProblemDetailsFilter } from './common/problem-details.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  // CORS va antes del chequeo CSRF para que los errores 403 también lleguen al navegador.
  app.enableCors({
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
    credentials: true,
    allowedHeaders: ['Content-Type', 'X-Requested-With', 'Idempotency-Key'],
  });
  app.use(cookieParser());
  app.use(csrfHeaderMiddleware);
  app.useGlobalFilters(new ProblemDetailsFilter());

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API escuchando en http://localhost:${port}/api/v1`);
}

bootstrap();
