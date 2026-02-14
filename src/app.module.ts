import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health/health.controller';
import { SessionsModule } from './sessions/sessions.module';
import { PrismaModule } from './prisma/prisma.module';
import { LoggingModule } from './logging/logging.module';
import { LegalModule } from './legal/legal.module';
import { LeadsModule } from './leads/leads.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { ProfilesModule } from './profiles/profiles.module';
import { LoggingExceptionFilter } from './common/logging-exception.filter';
import { LoggingInterceptor } from './common/logging.interceptor';
import { LoggingService } from './logging/logging.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule.register({
      timeout: Number(process.env.HTTP_TIMEOUT) || 10000,
      maxRedirects: 5,
    }),
    PrismaModule,
    LoggingModule,
    AuthModule,
    AdminModule,
    SessionsModule,
    LegalModule,
    LeadsModule,
    ProfilesModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: LoggingExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
