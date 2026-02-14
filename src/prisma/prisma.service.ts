import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoggingService } from '../logging/logging.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly logging: LoggingService) {
    super();
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logging.info('Prisma connected to database', { context: 'PrismaService' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logging.error('Prisma connection failed', {
        context: 'PrismaService',
        error: msg,
      });
      throw err;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logging.info('Prisma disconnected from database', { context: 'PrismaService' });
  }
}
