import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AgentExecutionMode } from './execution-mode.service';
import { AppSettingsService } from './app-settings.service';

interface UpdateModeDto {
  mode: AgentExecutionMode;
}

interface UpdateSettingsDto {
  agentExecutionMode?: AgentExecutionMode;
  maxSearchResults?: number;
}

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('global:superadmin', 'app:shop-assistant:admin')
export class SettingsController {
  constructor(private readonly settings: AppSettingsService) {}

  @Get()
  getSettings() {
    return this.settings.getSettings();
  }

  @Put()
  updateSettings(@Body() body: UpdateSettingsDto, @Req() req: Request) {
    const userId = (req as Request & { user?: { id?: string; email?: string } }).user?.id;
    return this.settings.updateSettings(body, userId);
  }

  @Get('agent-execution-mode')
  async getAgentExecutionMode() {
    const settings = await this.settings.getSettings();
    return { mode: settings.agentExecutionMode };
  }

  @Put('agent-execution-mode')
  async updateAgentExecutionMode(@Body() body: UpdateModeDto, @Req() req: Request) {
    const userId = (req as Request & { user?: { id?: string; email?: string } }).user?.id;
    const mode = await this.settings.setAgentExecutionMode(body?.mode, userId);
    return { mode };
  }
}
