/**
 * Auth Module
 * Provides JWT validation via auth-microservice for admin routes,
 * and proxy endpoints for register/login so frontend can obtain JWT.
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: Number(process.env.AUTH_SERVICE_TIMEOUT) || Number(process.env.HTTP_TIMEOUT) || 10000,
      maxRedirects: 5,
    }),
    LoggingModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RolesGuard],
  exports: [AuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
