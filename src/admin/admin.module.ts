/**
 * Admin Module
 * Admin section: AI agent prompts CRUD, AI models list (auth required)
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';
import { LoggingModule } from '../logging/logging.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PromptsController } from './prompts.controller';
import { PromptsService } from './prompts.service';
import { AiModelsController } from './ai-models.controller';
import { ExecutionModeService } from './execution-mode.service';
import { SettingsController } from './settings.controller';
import { OverviewController } from './overview.controller';
import { AppSettingsService } from './app-settings.service';

@Module({
  imports: [
    HttpModule.register({ timeout: 10000, maxRedirects: 5 }),
    AuthModule,
    LoggingModule,
    PrismaModule,
  ],
  controllers: [PromptsController, AiModelsController, SettingsController, OverviewController],
  providers: [PromptsService, ExecutionModeService, AppSettingsService],
  exports: [PromptsService, ExecutionModeService, AppSettingsService],
})
export class AdminModule {}
