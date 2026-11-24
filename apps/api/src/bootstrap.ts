import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { ApiEnv } from '@kmsdc/config/env';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

/** HTTP pipeline shared by main.ts and integration tests so both behave identically. */
export function configureApp(app: NestExpressApplication, env: ApiEnv): INestApplication {
  app.disable('x-powered-by');
  if (env.TRUST_PROXY) app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cookieParser());
  app.useBodyParser('json', { limit: '1mb' });

  // Rate limiting: 100 requests per 15 minutes per IP
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: env.WEB_ORIGIN, credentials: true });
  app.enableShutdownHooks();

  if (env.ENABLE_SWAGGER) {
    const config = new DocumentBuilder()
      .setTitle('Kottakal Clinic API')
      .setDescription('REST API for the Kottakal Multispeciality Dental Clinic platform')
      .setVersion('v1')
      .addCookieAuth('__Host-kmsdc_session')
      .build();
    SwaggerModule.setup('api/docs', app, () => SwaggerModule.createDocument(app, config), {
      jsonDocumentUrl: 'api/docs-json',
    });
  }
  return app;
}
