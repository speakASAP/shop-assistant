import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggingService } from '../logging/logging.service';
import { SessionsService } from '../sessions/sessions.service';

const MAX_SESSION_SEARCH_LENGTH = 120;
const SESSION_STATUSES = ['selected', 'searched', 'started'] as const;
type SessionStatusFilter = (typeof SESSION_STATUSES)[number];

interface SessionListFilters {
  q?: string;
  profileId?: string;
  status?: string;
}

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

  private normalizeSessionFilters(filters?: SessionListFilters) {
    const q = String(filters?.q || '').replace(/\s+/g, ' ').trim().slice(0, MAX_SESSION_SEARCH_LENGTH);
    const profileId = String(filters?.profileId || '').trim();
    const rawStatus = String(filters?.status || '').trim().toLowerCase();
    const status = SESSION_STATUSES.includes(rawStatus as SessionStatusFilter) ? (rawStatus as SessionStatusFilter) : undefined;
    return {
      q: q || undefined,
      profileId: profileId || undefined,
      status,
    };
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
          usedSavedCriteria: true,
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
        usedSavedCriteriaId: session.usedSavedCriteriaId,
        usedSavedCriteria: session.usedSavedCriteria,
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

  async listSessions(userId: string, page = 1, limit = 20, filters?: SessionListFilters) {
    const safePage = Math.max(1, page || 1);
    const safeLimit = Math.min(50, Math.max(1, limit || 20));
    const normalizedFilters = this.normalizeSessionFilters(filters);
    const where: any = { userId };
    if (normalizedFilters.profileId) {
      where.profileId = normalizedFilters.profileId;
    }
    if (normalizedFilters.status === 'selected') {
      where.choices = { some: {} };
    } else if (normalizedFilters.status === 'searched') {
      where.searchRuns = { some: {} };
      where.choices = { none: {} };
    } else if (normalizedFilters.status === 'started') {
      where.searchRuns = { none: {} };
      where.choices = { none: {} };
    }
    if (normalizedFilters.q) {
      where.OR = [
        { id: { contains: normalizedFilters.q, mode: 'insensitive' } },
        { profile: { is: { name: { contains: normalizedFilters.q, mode: 'insensitive' } } } },
        { usedSavedCriteria: { is: { name: { contains: normalizedFilters.q, mode: 'insensitive' } } } },
        { messages: { some: { content: { contains: normalizedFilters.q, mode: 'insensitive' } } } },
        { searchRuns: { some: { queryText: { contains: normalizedFilters.q, mode: 'insensitive' } } } },
        { choices: { some: { searchResult: { title: { contains: normalizedFilters.q, mode: 'insensitive' } } } } },
      ];
    }
    this.logging.debug('Current-user sessions list request', {
      userId,
      page: safePage,
      limit: safeLimit,
      filters: normalizedFilters,
      context: 'MeService',
    });
    const [items, total] = await Promise.all([
      this.prisma.session.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        include: {
          profile: true,
          usedSavedCriteria: true,
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          searchRuns: { orderBy: { createdAt: 'desc' }, take: 1 },
          choices: { orderBy: { chosenAt: 'desc' }, take: 1, include: { searchResult: true } },
        },
      }),
      this.prisma.session.count({ where }),
    ]);

    return {
      items: items.map((session) => ({
        id: session.id,
        profileId: session.profileId,
        profile: session.profile,
        usedSavedCriteriaId: session.usedSavedCriteriaId,
        usedSavedCriteria: session.usedSavedCriteria,
        priorityOrder: session.priorityOrder,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        latestMessage: session.messages[0] ?? null,
        latestSearch: session.searchRuns[0] ?? null,
        latestChoice: session.choices[0] ?? null,
      })),
      pagination: { page: safePage, limit: safeLimit, total, filters: normalizedFilters },
    };
  }

  async listChoices(userId: string, page = 1, limit = 10) {
    const safePage = Math.max(1, page || 1);
    const safeLimit = Math.min(50, Math.max(1, limit || 10));
    const where = { session: { userId } };
    this.logging.debug('Current-user choices list request', {
      userId,
      page: safePage,
      limit: safeLimit,
      context: 'MeService',
    });
    const [items, total] = await Promise.all([
      this.prisma.choice.findMany({
        where,
        orderBy: { chosenAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        include: {
          searchResult: true,
          session: {
            select: {
              id: true,
              createdAt: true,
              updatedAt: true,
              profileId: true,
              profile: { select: { id: true, name: true, role: true } },
            },
          },
        },
      }),
      this.prisma.choice.count({ where }),
    ]);
    return {
      items,
      pagination: { page: safePage, limit: safeLimit, total },
    };
  }

  async getSession(userId: string, sessionId: string) {
    this.logging.debug('Current-user session detail request', { userId, sessionId, context: 'MeService' });
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
      include: {
        profile: true,
        usedSavedCriteria: true,
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


  async anonymizeSessionData(userId: string) {
    this.logging.info('Current-user session-data anonymization requested', { userId, context: 'MeService' });
    const sessions = await this.prisma.session.findMany({
      where: { userId },
      select: { id: true },
    });
    const sessionIds = sessions.map((session) => session.id);

    if (!sessionIds.length) {
      return { anonymizedSessions: 0, anonymizedMessages: 0, anonymizedSearchRuns: 0, deletedChoices: 0 };
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const deletedChoices = await tx.choice.deleteMany({ where: { sessionId: { in: sessionIds } } });
      await tx.agentCommunication.updateMany({
        where: { sessionId: { in: sessionIds } },
        data: { content: '[anonymized]', metadata: { anonymized: true } },
      });
      const anonymizedMessages = await tx.message.updateMany({
        where: { sessionId: { in: sessionIds } },
        data: { content: '[anonymized]', contentType: 'anonymized' },
      });
      const anonymizedSearchRuns = await tx.searchRun.updateMany({
        where: { sessionId: { in: sessionIds } },
        data: { queryText: '[anonymized]', refinedParams: { anonymized: true }, rawSearchResponse: { anonymized: true } },
      });
      const anonymizedSessions = await tx.session.updateMany({
        where: { id: { in: sessionIds } },
        data: { userId: null, profileId: null, usedSavedCriteriaId: null, priorityOrder: { anonymized: true } },
      });
      await tx.savedSearchCriteria.deleteMany({ where: { userId } });
      await tx.accountProfile.deleteMany({ where: { userId } });

      return {
        anonymizedSessions: anonymizedSessions.count,
        anonymizedMessages: anonymizedMessages.count,
        anonymizedSearchRuns: anonymizedSearchRuns.count,
        deletedChoices: deletedChoices.count,
      };
    });

    this.logging.info('Current-user session-data anonymized', { userId, ...result, context: 'MeService' });
    return result;
  }

  async deleteSessionData(userId: string) {
    this.logging.info('Current-user session-data deletion requested', { userId, context: 'MeService' });
    const result = await this.prisma.$transaction(async (tx) => {
      const deletedSessions = await tx.session.deleteMany({ where: { userId } });
      const deletedSavedCriteria = await tx.savedSearchCriteria.deleteMany({ where: { userId } });
      const deletedProfiles = await tx.accountProfile.deleteMany({ where: { userId } });
      return {
        deletedSessions: deletedSessions.count,
        deletedSavedCriteria: deletedSavedCriteria.count,
        deletedProfiles: deletedProfiles.count,
      };
    });

    this.logging.info('Current-user session-data deleted', { userId, ...result, context: 'MeService' });
    return result;
  }

  async chooseProduct(userId: string, sessionId: string, productId: string) {
    await this.assertSessionBelongsToUser(userId, sessionId);
    return this.sessions.chooseProduct(sessionId, productId);
  }
}
