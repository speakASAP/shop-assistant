import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

/** Log levels accepted by logging-microservice (POST /api/logs) */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const VALID_LEVELS: LogLevel[] = ['error', 'warn', 'info', 'debug'];

@Injectable()
export class LoggingService {
  private readonly serviceName: string;
  private readonly baseUrl: string;
  private readonly apiPath: string;
  private readonly timeout: number;

  constructor(private readonly httpService: HttpService) {
    this.serviceName = process.env.SERVICE_NAME || 'shop-assistant';
    this.baseUrl = process.env.LOGGING_SERVICE_URL || '';
    this.apiPath = process.env.LOGGING_SERVICE_API_PATH || '/api/logs';
    this.timeout = Math.min(Number(process.env.LOGGING_SERVICE_TIMEOUT) || 2000, 5000);
  }

  /**
   * Send log entry to centralized logging microservice.
   * Payload matches LogEntryDto: level, message, service, timestamp?, metadata?
   * Non-blocking: failures are ignored (optional console fallback) to keep API responsive.
   */
  async log(level: string, message: string, metadata: Record<string, unknown> = {}): Promise<void> {
    const normalizedLevel = VALID_LEVELS.includes(level as LogLevel) ? level : 'info';
    const payload = {
      level: normalizedLevel,
      message,
      service: this.serviceName,
      timestamp: new Date().toISOString(),
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
    };

    if (!this.baseUrl) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${normalizedLevel}] [${this.serviceName}] ${message}`, metadata);
      }
      return;
    }

    const url = `${this.baseUrl.replace(/\/$/, '')}${this.apiPath}`;
    try {
      await lastValueFrom(
        this.httpService.post(url, payload, { timeout: this.timeout }),
      );
    } catch (err) {
      // Do not throw: avoid breaking callers. Optional local fallback.
      if (process.env.NODE_ENV === 'development') {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[${this.serviceName}] Logging service failed: ${msg}`, { level: normalizedLevel, message });
      }
    }
  }

  async error(message: string, metadata: Record<string, unknown> = {}): Promise<void> {
    return this.log('error', message, metadata);
  }

  async warn(message: string, metadata: Record<string, unknown> = {}): Promise<void> {
    return this.log('warn', message, metadata);
  }

  async info(message: string, metadata: Record<string, unknown> = {}): Promise<void> {
    return this.log('info', message, metadata);
  }

  async debug(message: string, metadata: Record<string, unknown> = {}): Promise<void> {
    return this.log('debug', message, metadata);
  }
}
