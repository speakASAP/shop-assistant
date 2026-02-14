import { Controller, Get } from '@nestjs/common';
import { LoggingService } from '../logging/logging.service';

@Controller('health')
export class HealthController {
  constructor(private readonly logging: LoggingService) {}

  @Get()
  getHealth() {
    this.logging.debug('Health check', { context: 'HealthController' });
    return { status: 'ok' };
  }
}
