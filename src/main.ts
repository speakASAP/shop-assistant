import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { LoggingService } from './logging/logging.service';

async function bootstrap() {
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Extensive request logging for /api to trace fail points (path stripping, wrong route)
    app.use((req: Request, _res: Response, next: NextFunction) => {
      const url = req.url ?? '';
      const path = req.path ?? '';
      if (url.startsWith('/api') || path.startsWith('/api')) {
        const norm = (url.split('?')[0] || path || '').replace(/\/$/, '') || '/';
        const isUnhandledRoot = (req.method === 'POST' && norm === '/api');
        console.log(`[shop-assistant] INCOMING ${req.method} url=${url} path=${path} normalized=${norm}${isUnhandledRoot ? ' FAIL_POINT: path is /api or /api/ - no route will match' : ''}`);
      }
      next();
    });

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
