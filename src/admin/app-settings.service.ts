import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggingService } from '../logging/logging.service';
import { AgentExecutionMode, ExecutionModeService } from './execution-mode.service';

export interface SafeAppSettings {
  agentExecutionMode: AgentExecutionMode;
  maxSearchResults: number;
}

interface UpdateSettingsPayload {
  agentExecutionMode?: AgentExecutionMode;
  maxSearchResults?: number;
}

const DEFAULT_MAX_SEARCH_RESULTS = 20;
const MIN_SEARCH_RESULTS = 5;
const MAX_SEARCH_RESULTS = 30;

@Injectable()
export class AppSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logging: LoggingService,
    private readonly executionMode: ExecutionModeService,
  ) {}

  async getSettings(): Promise<SafeAppSettings> {
    const [agentMode, maxSearchResults] = await Promise.all([
      this.getAgentExecutionMode(),
      this.getMaxSearchResults(),
    ]);
    return { agentExecutionMode: agentMode, maxSearchResults };
  }

  async updateSettings(payload: UpdateSettingsPayload, updatedBy?: string): Promise<SafeAppSettings> {
    if (payload.agentExecutionMode !== undefined) {
      await this.setAgentExecutionMode(payload.agentExecutionMode, updatedBy);
    }
    if (payload.maxSearchResults !== undefined) {
      await this.setMaxSearchResults(payload.maxSearchResults, updatedBy);
    }
    return this.getSettings();
  }

  async getAgentExecutionMode(): Promise<AgentExecutionMode> {
    const stored = await this.prisma.appSetting.findUnique({ where: { key: 'agentExecutionMode' } });
    const value = typeof stored?.value === 'string' ? stored.value : undefined;
    if (value === 'sync' || value === 'queue') return value;
    return this.executionMode.getMode();
  }

  async setAgentExecutionMode(mode: AgentExecutionMode, updatedBy?: string): Promise<AgentExecutionMode> {
    if (mode !== 'sync' && mode !== 'queue') {
      throw new BadRequestException('agentExecutionMode must be "sync" or "queue"');
    }
    await this.prisma.appSetting.upsert({
      where: { key: 'agentExecutionMode' },
      create: {
        key: 'agentExecutionMode',
        value: mode,
        description: 'Controls whether AI/search agent work runs synchronously or through the in-memory queue.',
        updatedBy: updatedBy ?? null,
      },
      update: { value: mode, updatedBy: updatedBy ?? null },
    });
    this.executionMode.setMode(mode);
    this.logging.info('Admin setting applied: agentExecutionMode', { mode, updatedBy, context: 'AppSettingsService' });
    return mode;
  }

  async getMaxSearchResults(): Promise<number> {
    const stored = await this.prisma.appSetting.findUnique({ where: { key: 'maxSearchResults' } });
    const raw = stored?.value;
    const value = typeof raw === 'number' ? raw : Number(raw);
    if (Number.isInteger(value) && value >= MIN_SEARCH_RESULTS && value <= MAX_SEARCH_RESULTS) return value;
    return DEFAULT_MAX_SEARCH_RESULTS;
  }

  async setMaxSearchResults(value: number, updatedBy?: string): Promise<number> {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < MIN_SEARCH_RESULTS || parsed > MAX_SEARCH_RESULTS) {
      throw new BadRequestException(`maxSearchResults must be an integer between ${MIN_SEARCH_RESULTS} and ${MAX_SEARCH_RESULTS}`);
    }
    await this.prisma.appSetting.upsert({
      where: { key: 'maxSearchResults' },
      create: {
        key: 'maxSearchResults',
        value: parsed,
        description: 'Maximum number of search results requested per single product intent.',
        updatedBy: updatedBy ?? null,
      },
      update: { value: parsed, updatedBy: updatedBy ?? null },
    });
    this.logging.info('Admin setting applied: maxSearchResults', { maxSearchResults: parsed, updatedBy, context: 'AppSettingsService' });
    return parsed;
  }
}
