/**
 * Admin Module
 * Admin section: AI agent prompts CRUD, AI models list (auth required)
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';
import { LoggingModule } from '../logging/logging.module';
import { PromptsController } from './prompts.controller';
import { PromptsService } from './prompts.service';
import { AiModelsController } from './ai-models.controller';
import { ExecutionModeService } from './execution-mode.service';
import { SettingsController } from './settings.controller';

@Module({
  imports: [
    HttpModule.register({ timeout: 10000, maxRedirects: 5 }),
    AuthModule,
    LoggingModule,
  ],
  controllers: [PromptsController, AiModelsController, SettingsController],
  providers: [PromptsService, ExecutionModeService],
  exports: [PromptsService, ExecutionModeService],
})
export class AdminModule {}
