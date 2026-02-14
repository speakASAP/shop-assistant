/**
 * Auth Service
 * Validates JWT via auth-microservice POST /auth/validate
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AuthUser, ValidateTokenResponse } from './auth.interface';
import { LoggingService } from '../logging/logging.service';

@Injectable()
export class AuthService {
  private readonly authServiceUrl: string;
  private readonly timeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly logging: LoggingService,
  ) {
    this.authServiceUrl = process.env.AUTH_SERVICE_URL || '';
    this.timeout = Number(process.env.AUTH_SERVICE_TIMEOUT) || Number(process.env.HTTP_TIMEOUT) || 10000;
  }

  /**
   * Validate JWT token via auth-microservice
   */
  async validateToken(token: string): Promise<AuthUser> {
    if (!this.authServiceUrl) {
      this.logging.warn('AUTH_SERVICE_URL not set, cannot validate token', { context: 'AuthService.validateToken' });
      throw new UnauthorizedException('Authentication service not configured');
    }
    const url = `${this.authServiceUrl.replace(/\/$/, '')}/auth/validate`;
    this.logging.debug('Validating token with auth-microservice', { url: url.replace(/\/[^/]*$/, '/auth/validate'), tokenLength: token?.length });
    try {
      const res = await firstValueFrom(
        this.httpService.post<ValidateTokenResponse>(
          url,
          { token },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: this.timeout,
          },
        ),
      );
      const data = res.data;
      if (!data?.valid || !data?.user) {
        this.logging.warn('Auth validate returned invalid or no user', { valid: data?.valid, context: 'AuthService.validateToken' });
        throw new UnauthorizedException('Invalid or expired token');
      }
      this.logging.info('Token validated successfully', { userId: data.user.id, email: data.user.email, context: 'AuthService.validateToken' });
      return data.user;
    } catch (e: unknown) {
      if (e instanceof UnauthorizedException) throw e;
      const msg = e instanceof Error ? e.message : String(e);
      const status = e && typeof e === 'object' && 'response' in e && (e as { response?: { status?: number } }).response?.status;
      this.logging.error('Auth validate failed', { error: msg, status, context: 'AuthService.validateToken' });
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
