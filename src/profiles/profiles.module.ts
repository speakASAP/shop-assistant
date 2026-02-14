import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LoggingModule } from '../logging/logging.module';
import { AuthModule } from '../auth/auth.module';
import { SessionsModule } from '../sessions/sessions.module';
import { ProfilesController } from './profiles.controller';
import { SavedCriteriaController } from './saved-criteria.controller';
import { ProfilesService } from './profiles.service';
import { SavedCriteriaService } from './saved-criteria.service';

@Module({
  imports: [PrismaModule, LoggingModule, AuthModule, SessionsModule],
  controllers: [ProfilesController, SavedCriteriaController],
  providers: [ProfilesService, SavedCriteriaService],
})
export class ProfilesModule {}

