import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LoggingService } from './logging.service';

@Module({
  imports: [HttpModule],
  providers: [LoggingService],
  exports: [LoggingService],
})
export class LoggingModule {}
