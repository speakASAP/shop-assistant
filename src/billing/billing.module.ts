import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';
import { LoggingModule } from '../logging/logging.module';
import { PrismaModule } from '../prisma/prisma.module';
import { BillingAdminController, BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PaymentsClientService } from './payments-client.service';
@Module({ imports: [HttpModule.register({ timeout: Number(process.env.PAYMENTS_SERVICE_TIMEOUT || process.env.HTTP_TIMEOUT) || 10000, maxRedirects: 5 }), AuthModule, LoggingModule, PrismaModule], controllers: [BillingController, BillingAdminController], providers: [BillingService, PaymentsClientService], exports: [BillingService] })
export class BillingModule {}
