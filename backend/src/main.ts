import { existsSync } from 'fs';
import { join, resolve } from 'path';
import type { NextFunction, Request, Response } from 'express';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { appConfig } from './config/app.config';
import { globalValidationPipe } from './dto/validation';
import { AllExceptionsFilter } from './exception/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(globalValidationPipe);
  app.useGlobalFilters(new AllExceptionsFilter());
  app.setGlobalPrefix('api');

  if (process.env.SERVE_FRONTEND === 'true') {
    const frontendDirectory = resolve(__dirname, '../../frontend/dist');
    const indexFile = join(frontendDirectory, 'index.html');
    if (!existsSync(indexFile)) {
      throw new Error(`Frontend build was not found at ${frontendDirectory}`);
    }

    app.useStaticAssets(frontendDirectory);
    app.use((request: Request, response: Response, next: NextFunction) => {
      if (
        request.method !== 'GET' ||
        request.path === '/api' ||
        request.path.startsWith('/api/') ||
        /\.[^/]+$/.test(request.path)
      ) {
        next();
        return;
      }
      response.sendFile(indexFile);
    });
  }

  await app.listen(appConfig.port, '127.0.0.1');
  Logger.log(`Application is running on: ${await app.getUrl()}`, 'Bootstrap');
}

bootstrap();
