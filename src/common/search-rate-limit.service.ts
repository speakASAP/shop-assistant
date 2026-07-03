import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LoggingService } from '../logging/logging.service';

interface Bucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class SearchRateLimitService {
  private readonly buckets = new Map<string, Bucket>();
  private readonly windowMs = Math.max(1000, Number(process.env.SEARCH_RATE_LIMIT_WINDOW_MS) || 60_000);
  private readonly maxRequests = Math.max(1, Number(process.env.SEARCH_RATE_LIMIT_MAX_REQUESTS) || 20);

  constructor(private readonly logging: LoggingService) {}

  assertAllowed(key: string, meta: Record<string, unknown> = {}): void {
    const now = Date.now();
    const normalizedKey = key || 'unknown';
    const current = this.buckets.get(normalizedKey);

    if (!current || current.resetAt <= now) {
      this.buckets.set(normalizedKey, { count: 1, resetAt: now + this.windowMs });
      return;
    }

    current.count += 1;
    if (current.count <= this.maxRequests) return;

    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    this.logging.warn('Search rate limit exceeded', {
      context: 'SearchRateLimitService',
      keyType: normalizedKey.split(':', 1)[0],
      retryAfterSeconds,
      ...meta,
    });
    throw new HttpException({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      message: 'Too many search requests. Please wait before trying again.',
      retryAfterSeconds,
    }, HttpStatus.TOO_MANY_REQUESTS);
  }
}
