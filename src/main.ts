import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from 'node_modules/@nestjs/swagger/dist/swagger-module';
import { DocumentBuilder } from '@nestjs/swagger';
import { HttpLoggingInterceptor } from './common/interceptors/http-logging.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  // ── Global logging ──────────────────────────────────────────────────────────
  app.useGlobalInterceptors(new HttpLoggingInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // ── Validation ──────────────────────────────────────────────────────────────
  app.useGlobalPipes(new ValidationPipe());

  // ── Swagger ─────────────────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('API Documentation for Hospital Management System')
    .setDescription('Documentation for the API endpoints')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`🏥 Hospital Management API is running on port ${port}`);
  logger.log(`📄 Swagger docs available at http://localhost:${port}/api/docs`);
}
bootstrap();

