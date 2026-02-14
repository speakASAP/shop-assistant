import { Injectable } from '@nestjs/common';
import { LoggingService } from '../logging/logging.service';

export type AgentExecutionMode = 'sync' | 'queue';

@Injectable()
export class ExecutionModeService {
  private mode: AgentExecutionMode;

  constructor(private readonly logging: LoggingService) {
    const envMode = (process.env.AGENT_EXECUTION_MODE || '').toLowerCase();
    this.mode = envMode === 'queue' ? 'queue' : 'sync';
    this.logging.info('Agent execution mode initialised', {
      mode: this.mode,
      source: 'env.AGENT_EXECUTION_MODE',
      context: 'ExecutionModeService',
    });
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

