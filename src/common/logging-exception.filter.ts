import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggingService } from '../logging/logging.service';

/**
 * Global exception filter: logs all exceptions to centralized logging-microservice
 * and returns appropriate HTTP response.
 */
@Catch()
export class LoggingExceptionFilter implements ExceptionFilter {
  constructor(private readonly logging: LoggingService) {}

  async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception instanceof Error
          ? exception.message
          : String(exception);

    const stack = exception instanceof Error ? exception.stack : undefined;

    const meta: Record<string, unknown> = {
      context: 'LoggingExceptionFilter',
      path: request?.url,
      method: request?.method,
      statusCode: status,
      message: typeof message === 'object' ? JSON.stringify(message) : message,
    };
    if (stack) meta.stack = stack.slice(0, 500);

    if (status >= 500) {
      this.logging.error('Unhandled exception', meta);
    } else {
      this.logging.warn('Client error (4xx)', meta);
    }

    const body =
      exception instanceof HttpException
        ? exception.getResponse()
        : { statusCode: status, message: 'Internal server error' };

    response.status(status).json(body);
  }
}
