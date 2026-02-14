import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggingService } from '../logging/logging.service';
import { SessionsService } from '../sessions/sessions.service';

@Injectable()
export class SavedCriteriaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logging: LoggingService,
    private readonly sessions: SessionsService,
  ) {}

  async listCriteria(userId: string) {
    this.logging.debug('List saved criteria request', { userId, context: 'SavedCriteriaService' });
    const items = await this.prisma.savedSearchCriteria.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    this.logging.info('Saved criteria listed', { userId, count: items.length, context: 'SavedCriteriaService' });
    return { items };
  }

  async getCriteria(userId: string, id: string) {
    const item = await this.prisma.savedSearchCriteria.findFirst({
      where: { id, userId },
    });
    if (!item) {
      this.logging.warn('Saved criteria not found', { userId, id, context: 'SavedCriteriaService' });
      throw new NotFoundException('Saved criteria not found');
    }
    return item;
  }

  async createCriteria(
    userId: string,
    payload: {
      name: string;
      priorities?: unknown;
      productIntents?: unknown;
      filters?: unknown;
      profileId?: string;
    },
  ) {
    this.logging.debug('Create saved criteria request', { userId, hasProfile: !!payload.profileId, context: 'SavedCriteriaService' });
    const item = await this.prisma.savedSearchCriteria.create({
      data: {
        userId,
        name: payload.name,
        priorities: payload.priorities as object | undefined,
        productIntents: payload.productIntents as object | undefined,
        filters: payload.filters as object | undefined,
        profileId: payload.profileId || null,
      },
    });
    this.logging.info('Saved criteria created', { userId, id: item.id, context: 'SavedCriteriaService' });
    return item;
  }

  async updateCriteria(
    userId: string,
    id: string,
    payload: {
      name?: string;
      priorities?: unknown;
      productIntents?: unknown;
      filters?: unknown;
      profileId?: string | null;
    },
  ) {
    this.logging.debug('Update saved criteria request', { userId, id, context: 'SavedCriteriaService' });
    const existing = await this.prisma.savedSearchCriteria.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      this.logging.warn('Saved criteria not found for update', { userId, id, context: 'SavedCriteriaService' });
      throw new NotFoundException('Saved criteria not found');
    }
    const item = await this.prisma.savedSearchCriteria.update({
      where: { id },
      data: {
        name: typeof payload.name === 'undefined' ? existing.name : payload.name,
        priorities:
          typeof payload.priorities === 'undefined'
            ? (existing.priorities as object | undefined)
            : (payload.priorities as object | undefined),
        productIntents:
          typeof payload.productIntents === 'undefined'
            ? (existing.productIntents as object | undefined)
            : (payload.productIntents as object | undefined),
        filters:
          typeof payload.filters === 'undefined'
            ? (existing.filters as object | undefined)
            : (payload.filters as object | undefined),
        profileId:
          typeof payload.profileId === 'undefined'
            ? existing.profileId
            : payload.profileId || null,
      },
    });
    this.logging.info('Saved criteria updated', { userId, id, context: 'SavedCriteriaService' });
    return item;
  }

  async deleteCriteria(userId: string, id: string) {
    this.logging.debug('Delete saved criteria request', { userId, id, context: 'SavedCriteriaService' });
    const existing = await this.prisma.savedSearchCriteria.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      this.logging.warn('Saved criteria not found for delete', { userId, id, context: 'SavedCriteriaService' });
      throw new NotFoundException('Saved criteria not found');
    }
    await this.prisma.savedSearchCriteria.delete({ where: { id } });
    this.logging.info('Saved criteria deleted', { userId, id, context: 'SavedCriteriaService' });
    return { success: true };
  }

  /**
   * Run saved criteria: create session (with priorities + optional profile) and submit a query.
   * For product intents we join them into a single free-text request that the AI splits as needed.
   */
  async runCriteria(userId: string, id: string) {
    this.logging.debug('Run saved criteria request', { userId, id, context: 'SavedCriteriaService' });
    const criteria = await this.prisma.savedSearchCriteria.findFirst({
      where: { id, userId },
    });
    if (!criteria) {
      this.logging.warn('Saved criteria not found for run', { userId, id, context: 'SavedCriteriaService' });
      throw new NotFoundException('Saved criteria not found');
    }

    // Extract priorities as string[] if possible
    let priorities: string[] | undefined;
    if (Array.isArray(criteria.priorities)) {
      priorities = (criteria.priorities as unknown[]).filter((p): p is string => typeof p === 'string');
    }

    // Build free-text request from productIntents and filters for AI refinement
    let text = '';
    if (Array.isArray(criteria.productIntents)) {
      const intents = (criteria.productIntents as unknown[]).filter((p): p is string => typeof p === 'string');
      if (intents.length) {
        text = intents.join('\n');
      }
    }
    if (!text) {
      text = `Run saved search "${criteria.name}".`;
    }

    const profileId = typeof criteria.profileId === 'string' && criteria.profileId.trim() ? criteria.profileId.trim() : undefined;
    const session = await this.sessions.createSession(userId, priorities, profileId);
    const sessionId = session.sessionId;

    // Submit query with priorities; multi-product split and agents are handled in SessionsService/AiService.
    const result = await this.sessions.submitQuery(sessionId, text, undefined, priorities);

    this.logging.info('Saved criteria run completed', {
      userId,
      criteriaId: id,
      sessionId,
      resultCount: result.results?.length ?? 0,
      context: 'SavedCriteriaService',
    });

    return {
      sessionId,
      results: result.results,
      queryText: result.queryText,
      groups: (result as any).groups,
    };
  }
}

