import { Controller, Get } from '@nestjs/common';
import { AppSettingsService } from './app-settings.service';

@Controller('public/settings')
export class PublicSettingsController {
  constructor(private readonly settings: AppSettingsService) {}

  @Get('landing')
  async getLandingSettings() {
    return { publicLanding: await this.settings.getPublicLandingSettings() };
  }
}
