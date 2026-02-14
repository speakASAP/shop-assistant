import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LoggingModule } from '../logging/logging.module';
import { AdminModule } from '../admin/admin.module';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { SearchService } from './search.service';
import { AiService } from './ai.service';
import { AgentQueueService } from './agent-queue.service';

@Module({
  imports: [HttpModule, LoggingModule, AdminModule],
  controllers: [SessionsController],
  providers: [SessionsService, SearchService, AiService, AgentQueueService],
  exports: [SessionsService],
})
export class SessionsModule {}
