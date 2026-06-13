import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggingService } from '../logging/logging.service';
import { SessionsService } from '../sessions/sessions.service';

@Injectable()
export class MeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logging: LoggingService,
    private readonly sessions: SessionsService,
  ) {}

  private async assertProfileBelongsToUser(userId: string, profileId?: string): Promise<void> {
    if (!profileId?.trim()) return;
    const profile = await this.prisma.accountProfile.findFirst({
      where: { id: profileId.trim(), userId },
      select: { id: true },
    });
    if (!profile) {
      this.logging.warn('Profile ownership check failed', { userId, profileId, context: 'MeService' });
      throw new NotFoundException('Profile not found');
    }
  }

  private async assertSessionBelongsToUser(userId: string, sessionId: string): Promise<void> {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
      select: { id: true },
    });
    if (!session) {
      this.logging.warn('Session ownership check failed', { userId, sessionId, context: 'MeService' });
      throw new NotFoundException('Session not found');
    }
  }

  async getDashboard(userId: string) {
    this.logging.debug('Current-user dashboard request', { userId, context: 'MeService' });
    const [sessionsCount, searchRunsCount, choicesCount, profilesCount, savedCriteriaCount, recentSessions, recentChoices] = await Promise.all([
      this.prisma.session.count({ where: { userId } }),
      this.prisma.searchRun.count({ where: { session: { userId } } }),
      this.prisma.choice.count({ where: { session: { userId } } }),
      this.prisma.accountProfile.count({ where: { userId } }),
      this.prisma.savedSearchCriteria.count({ where: { userId } }),
      this.prisma.session.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: {
          profile: true,
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          searchRuns: { orderBy: { createdAt: 'desc' }, take: 1 },
          choices: { orderBy: { chosenAt: 'desc' }, take: 1, include: { searchResult: true } },
        },
      }),
      this.prisma.choice.findMany({
        where: { session: { userId } },
        orderBy: { chosenAt: 'desc' },
        take: 10,
        include: { searchResult: true, session: { select: { id: true, createdAt: true, profileId: true } } },
      }),
    ]);

    return {
      summary: {
        sessions: sessionsCount,
        searchRuns: searchRunsCount,
        choices: choicesCount,
        profiles: profilesCount,
        savedCriteria: savedCriteriaCount,
      },
      recentSessions: recentSessions.map((session) => ({
        id: session.id,
        profileId: session.profileId,
        profile: session.profile,
        priorityOrder: session.priorityOrder,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        latestMessage: session.messages[0] ?? null,
        latestSearch: session.searchRuns[0] ?? null,
        latestChoice: session.choices[0] ?? null,
      })),
      recentChoices,
    };
  }

  async listSessions(userId: string, page = 1, limit = 20) {
    const safePage = Math.max(1, page || 1);
    const safeLimit = Math.min(50, Math.max(1, limit || 20));
    this.logging.debug('Current-user sessions list request', { userId, page: safePage, limit: safeLimit, context: 'MeService' });
    const [items, total] = await Promise.all([
      this.prisma.session.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        include: {
          profile: true,
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          searchRuns: { orderBy: { createdAt: 'desc' }, take: 1 },
          choices: { orderBy: { chosenAt: 'desc' }, take: 1, include: { searchResult: true } },
        },
      }),
      this.prisma.session.count({ where: { userId } }),
    ]);

    return {
      items: items.map((session) => ({
        id: session.id,
        profileId: session.profileId,
        profile: session.profile,
        priorityOrder: session.priorityOrder,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        latestMessage: session.messages[0] ?? null,
        latestSearch: session.searchRuns[0] ?? null,
        latestChoice: session.choices[0] ?? null,
      })),
      pagination: { page: safePage, limit: safeLimit, total },
    };
  }

  async getSession(userId: string, sessionId: string) {
    this.logging.debug('Current-user session detail request', { userId, sessionId, context: 'MeService' });
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
      include: {
        profile: true,
        messages: { orderBy: { createdAt: 'asc' } },
        searchRuns: {
          orderBy: { createdAt: 'desc' },
          include: { searchResults: { orderBy: { position: 'asc' } } },
        },
        choices: { orderBy: { chosenAt: 'desc' }, include: { searchResult: true } },
      },
    });
    if (!session) {
      this.logging.warn('Current-user session not found', { userId, sessionId, context: 'MeService' });
      throw new NotFoundException('Session not found');
    }
    return { session };
  }

  async createSession(userId: string, priorities?: string[], profileId?: string) {
    await this.assertProfileBelongsToUser(userId, profileId);
    return this.sessions.createSession(userId, priorities, profileId);
  }

  async submitQuery(userId: string, sessionId: string, text?: string, audioUrl?: string, priorities?: string[], profileId?: string) {
    await this.assertSessionBelongsToUser(userId, sessionId);
    await this.assertProfileBelongsToUser(userId, profileId);
    return this.sessions.submitQuery(sessionId, text, audioUrl, priorities, profileId);
  }

  async submitFeedback(userId: string, sessionId: string, message: string, selectedIndices?: number[], priorities?: string[], profileId?: string) {
    await this.assertSessionBelongsToUser(userId, sessionId);
    await this.assertProfileBelongsToUser(userId, profileId);
    return this.sessions.submitFeedback(sessionId, message, selectedIndices, priorities, profileId);
  }
}
