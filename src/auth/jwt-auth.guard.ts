/**
 * JWT Auth Guard
 * Validates JWT via AuthService (auth-microservice) and attaches user to request
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoggingService } from '../logging/logging.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly logging: LoggingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const path = request.url || request.path;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logging.warn('JWT auth rejected: missing or invalid Authorization header', {
        path,
        hasHeader: !!authHeader,
        context: 'JwtAuthGuard',
      });
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    this.logging.debug('JWT auth attempt', { path, tokenLength: token?.length, context: 'JwtAuthGuard' });

    try {
      const user = await this.authService.validateToken(token);
      request.user = user;
      this.logging.info('JWT auth success', { userId: user.id, path, context: 'JwtAuthGuard' });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logging.warn('JWT auth failed', { path, error: msg, context: 'JwtAuthGuard' });
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
