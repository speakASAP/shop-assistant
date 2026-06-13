import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LoggingModule } from '../logging/logging.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SessionsModule } from '../sessions/sessions.module';
import { MeController } from './me.controller';
import { MeService } from './me.service';

@Module({
  imports: [AuthModule, LoggingModule, PrismaModule, SessionsModule],
  controllers: [MeController],
  providers: [MeService],
})
export class MeModule {}
