import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { AppSettingsService } from './app-settings.service';

@Controller('admin/overview')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('global:superadmin', 'app:shop-assistant:admin')
export class OverviewController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: AppSettingsService,
  ) {}

  @Get()
  async getOverview() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [
      sessions,
      authenticatedSessions,
      searchRuns,
      searchResults,
      choices,
      leadRequests,
      profiles,
      savedCriteria,
      prompts,
      activePrompts,
      agentCommunications,
      recentSessions,
      recentLeads,
      currentSettings,
    ] = await Promise.all([
      this.prisma.session.count(),
      this.prisma.session.count({ where: { userId: { not: null } } }),
      this.prisma.searchRun.count(),
      this.prisma.searchResult.count(),
      this.prisma.choice.count(),
      this.prisma.leadRequest.count(),
      this.prisma.accountProfile.count(),
      this.prisma.savedSearchCriteria.count(),
      this.prisma.agentPrompt.count(),
      this.prisma.agentPrompt.count({ where: { isActive: true } }),
      this.prisma.agentCommunication.count({ where: { createdAt: { gte: since } } }),
      this.prisma.session.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 8,
        select: { id: true, userId: true, profileId: true, createdAt: true, updatedAt: true },
      }),
      this.prisma.leadRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { id: true, sourceService: true, sourceLabel: true, leadId: true, aiSubmissionId: true, createdAt: true },
      }),
      this.settings.getSettings(),
    ]);

    return {
      summary: {
        sessions,
        authenticatedSessions,
        anonymousSessions: sessions - authenticatedSessions,
        searchRuns,
        searchResults,
        choices,
        leadRequests,
        profiles,
        savedCriteria,
        prompts,
        activePrompts,
        agentCommunicationsLast24h: agentCommunications,
      },
      settings: currentSettings,
      recentSessions,
      recentLeads,
      generatedAt: new Date().toISOString(),
    };
  }
}
