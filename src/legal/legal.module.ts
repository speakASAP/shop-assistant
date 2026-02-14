import { Module } from '@nestjs/common';
import { LegalController } from './legal.controller';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [LoggingModule],
  controllers: [LegalController],
})
export class LegalModule {}
