import { Injectable } from '@nestjs/common';
import { LoggingService } from '../logging/logging.service';
import { AgentExecutionMode } from '../admin/execution-mode.service';

type JobFn<T> = () => Promise<T>;

@Injectable()
export class AgentQueueService {
  private queue: Array<() => Promise<void>> = [];
  private running = 0;
  private readonly concurrency: number;

  constructor(private readonly logging: LoggingService) {
    const fromEnv = Number(process.env.AGENT_QUEUE_CONCURRENCY || '3');
    this.concurrency = Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : 3;
    this.logging.info('Agent queue initialised', {
      concurrency: this.concurrency,
      context: 'AgentQueueService',
    });
  }

  /**
   * Run a job either synchronously or via in-memory queue (Option A/B).
   */
  run<T>(job: JobFn<T>, mode: AgentExecutionMode): Promise<T> {
    if (mode !== 'queue') {
      return job();
    }
    return this.enqueue(job);
  }

  private enqueue<T>(job: JobFn<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const wrapped = async () => {
        try {
          const result = await job();
          resolve(result);
        } catch (e) {
          reject(e);
        }
      };
      this.queue.push(wrapped);
      this.schedule();
    });
  }

  private schedule() {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const next = this.queue.shift();
      if (!next) return;
      this.running += 1;
      next()
        .catch((e: unknown) => {
          const msg = e instanceof Error ? e.message : String(e);
          this.logging.warn('Agent queue job failed', { error: msg, context: 'AgentQueueService' });
        })
        .finally(() => {
          this.running -= 1;
          this.schedule();
        });
    }
  }
}

