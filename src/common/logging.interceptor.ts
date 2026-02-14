import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { LoggingService } from '../logging/logging.service';

/**
 * Logs incoming HTTP requests (method, path, status) to centralized logging-microservice.
 * Skips health checks to avoid log spam.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logging: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const { method, url, path, ip } = req;
    const start = Date.now();

    if (path === '/health' || path === '/api/health') {
      return next.handle();
    }

    this.logging.debug('Request received', {
      context: 'LoggingInterceptor',
      method,
      path: path || url,
      ip: ip || req.socket?.remoteAddress,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          const res = ctx.getResponse();
          const status = res?.statusCode;
          this.logging.debug('Request completed', {
            context: 'LoggingInterceptor',
            method,
            path: path || url,
            statusCode: status,
            durationMs: duration,
          });
        },
        error: (err) => {
          const duration = Date.now() - start;
          this.logging.warn('Request failed', {
            context: 'LoggingInterceptor',
            method,
            path: path || url,
            error: err?.message || String(err),
            durationMs: duration,
          });
        },
      }),
    );
  }
}
