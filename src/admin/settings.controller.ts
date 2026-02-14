import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExecutionModeService, AgentExecutionMode } from './execution-mode.service';

interface UpdateModeDto {
  mode: AgentExecutionMode;
}

@Controller('admin/settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly executionMode: ExecutionModeService) {}

  @Get('agent-execution-mode')
  getAgentExecutionMode() {
    return { mode: this.executionMode.getMode() };
  }

  @Put('agent-execution-mode')
  updateAgentExecutionMode(@Body() body: UpdateModeDto) {
    const mode = body?.mode;
    if (mode !== 'sync' && mode !== 'queue') {
      throw new Error('mode must be \"sync\" or \"queue\"');
    }
    this.executionMode.setMode(mode);
    return { mode };
  }
}

