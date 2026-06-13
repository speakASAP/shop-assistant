import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggingService } from '../logging/logging.service';

export type AgentExecutionMode = 'sync' | 'queue';

@Injectable()
export class ExecutionModeService implements OnModuleInit {
  private mode: AgentExecutionMode;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logging: LoggingService,
  ) {
    const envMode = (process.env.AGENT_EXECUTION_MODE || '').toLowerCase();
    this.mode = envMode === 'queue' ? 'queue' : 'sync';
  }

  async onModuleInit() {
    try {
      const stored = await this.prisma.appSetting.findUnique({ where: { key: 'agentExecutionMode' } });
      const value = typeof stored?.value === 'string' ? stored.value : undefined;
      if (value === 'sync' || value === 'queue') {
        this.mode = value;
      }
      this.logging.info('Agent execution mode initialised', {
        mode: this.mode,
        source: value ? 'db.AppSetting.agentExecutionMode' : 'env.AGENT_EXECUTION_MODE',
        context: 'ExecutionModeService',
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logging.warn('Could not load persisted agent execution mode; using current runtime mode', {
        mode: this.mode,
        error: msg,
        context: 'ExecutionModeService',
      });
    }
  }

  getMode(): AgentExecutionMode {
    return this.mode;
  }

  setMode(mode: AgentExecutionMode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.logging.info('Agent execution mode changed', {
      mode,
      context: 'ExecutionModeService',
    });
  }
}
