/**
 * Auth Module
 * Provides JWT validation via auth-microservice for admin routes
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: Number(process.env.AUTH_SERVICE_TIMEOUT) || Number(process.env.HTTP_TIMEOUT) || 10000,
      maxRedirects: 5,
    }),
    LoggingModule,
  ],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
