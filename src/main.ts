import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { LoggingService } from './logging/logging.service';

async function bootstrap() {
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    app.useStaticAssets(join(__dirname, 'public'), {
      index: 'index.html',
      prefix: '/',
      setHeaders: (res, path) => {
        // Disable caching for HTML files in development
        if (path.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      },
    });

    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    const corsOrigin = process.env.CORS_ORIGIN || '*';
    const corsOrigins = corsOrigin.includes(',') ? corsOrigin.split(',').map(o => o.trim()) : corsOrigin;
    app.enableCors({ origin: corsOrigins, credentials: true });
    app.setGlobalPrefix('api', {
      exclude: ['health', 'privacy.html', 'cookies.html', 'terms.html'],
    });

    const port = Number(process.env.PORT) || 4500;
    await app.listen(port);

    try {
      const logging = app.get(LoggingService);
      await logging.info('Application started', {
        port,
        serviceName: process.env.SERVICE_NAME || 'shop-assistant',
        context: 'bootstrap',
      });
    } catch {
      // Logging service may be unavailable (e.g. LOGGING_SERVICE_URL not set)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error('[shop-assistant] Bootstrap failed:', msg, stack);
    process.exit(1);
  }
}

bootstrap();
