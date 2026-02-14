import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggingService } from '../logging/logging.service';
import { AiService } from './ai.service';
import { SearchService } from './search.service';
import { ExecutionModeService } from '../admin/execution-mode.service';
import { AgentQueueService } from './agent-queue.service';
import { PRIORITY_KEYS } from './dto/create-session.dto';

/** Normalize priorities to allowed keys only (10.1). */
function normalizePriorityOrder(priorities?: string[]): string[] | null {
  if (!priorities?.length) return null;
  const set = new Set(PRIORITY_KEYS);
  const out = priorities.filter((p) => typeof p === 'string' && set.has(p as (typeof PRIORITY_KEYS)[number]));
  return out.length ? out : null;
}

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logging: LoggingService,
    private readonly ai: AiService,
    private readonly search: SearchService,
    private readonly executionMode: ExecutionModeService,
    private readonly agentQueue: AgentQueueService,
  ) {}

  async createSession(userId?: string, priorities?: string[], profileId?: string) {
    const priorityOrder = normalizePriorityOrder(priorities);
    this.logging.debug('Session create request', { userId: userId ?? null, priorityOrder, profileId: profileId ?? null, context: 'SessionsService' });
    const session = await this.prisma.session.create({
      data: {
        userId: userId || null,
        priorityOrder: priorityOrder ? (priorityOrder as object) : undefined,
        profileId: profileId && profileId.trim() ? profileId.trim() : undefined,
      },
    });
    this.logging.info('Session created', { sessionId: session.id, userId: userId ?? null, profileId: session.profileId ?? null, context: 'SessionsService' });
    return { sessionId: session.id };
  }

  async getSession(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { messages: true, searchRuns: true, choices: true },
    });
    if (!session) {
      this.logging.warn('Session not found', { sessionId, context: 'SessionsService' });
      throw new NotFoundException('Session not found');
    }
    return session;
  }

  /** Update session profileId if provided (10.3). */
  private async updateSessionProfile(sessionId: string, profileId?: string): Promise<void> {
    if (profileId === undefined) return;
    const value = profileId && profileId.trim() ? profileId.trim() : null;
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { profileId: value },
    });
    this.logging.debug('Session profile updated', { sessionId, profileId: value, context: 'SessionsService' });
  }

  /** Update session priority order if priorities provided; return effective priority order for agents (10.1). */
  private async updateSessionPriorities(
    sessionId: string,
    session: { priorityOrder?: unknown },
    priorities?: string[],
  ): Promise<string[] | null> {
    const normalized = normalizePriorityOrder(priorities);
    const current = Array.isArray(session.priorityOrder) ? (session.priorityOrder as string[]) : null;
    const effective = normalized ?? current ?? null;
    if (normalized && JSON.stringify(normalized) !== JSON.stringify(current)) {
      await this.prisma.session.update({
        where: { id: sessionId },
        data: { priorityOrder: normalized as object },
      });
      this.logging.debug('Session priorities updated', { sessionId, priorityOrder: normalized, context: 'SessionsService' });
    }
    return effective;
  }

  async submitQuery(sessionId: string, text?: string, audioUrl?: string, priorities?: string[], profileId?: string) {
    this.logging.info('Query submit request', { sessionId, hasText: !!text?.trim(), hasAudioUrl: !!audioUrl, context: 'SessionsService' });
    let session = await this.getSession(sessionId);
    await this.updateSessionProfile(sessionId, profileId);
    const priorityOrder = await this.updateSessionPriorities(sessionId, session, priorities);
    let userText = text?.trim() || '';
    if (audioUrl && !userText) {
      this.logging.debug('Transcribing audio for query', { sessionId, audioUrlLength: audioUrl?.length, context: 'SessionsService' });
      this.ai.setSessionsService(this);
      const { transcript } = await this.ai.transcribe(audioUrl, sessionId);
      userText = transcript.trim();
    }
    if (!userText) {
      this.logging.warn('Query rejected: no text or audio content', { sessionId, context: 'SessionsService' });
      return { results: [], message: 'No text or audio provided' };
    }
    await this.prisma.message.create({
      data: { sessionId, role: 'user', contentType: audioUrl ? 'audio_url' : 'text', content: userText },
    });
    this.ai.setSessionsService(this);
    let { queryText, refinedParams } = await this.ai.refineQuery(userText, undefined, 'default', sessionId);
    // 5.2: LOCATION agent for delivery/region — augment query if LOCATION prompt returns region (10.1: pass priorityOrder)
    const locationResult = await this.ai.extractDeliveryRegion(userText, queryText, 'default', sessionId, priorityOrder ?? undefined);
    if (locationResult.augmentedQuery?.trim()) {
      queryText = `${queryText.trim()} ${locationResult.augmentedQuery.trim()}`.trim();
      this.logging.debug('Query augmented with delivery region', { augmentedQuery: locationResult.augmentedQuery, context: 'SessionsService' });
    }
    const searchLimit = 20;
    const mode = this.executionMode.getMode();
    // 10.2: Multi-product — split into N intents; if multiple, run parallel searches and group results
    const intents = await this.ai.splitIntoSearchIntents(userText, queryText, sessionId);
    const limitPerIntent = intents.length > 1 ? Math.max(5, Math.floor(20 / intents.length)) : searchLimit;

    if (intents.length > 1) {
      const searchLimitPerIntent = Math.min(limitPerIntent, 30);
      await this.logAgentCommunication(
        sessionId,
        'COMMUNICATION',
        'SEARCH',
        'task',
        `Multi-product: find up to ${searchLimitPerIntent} results each for ${intents.length} intents`,
        { task: 'search_products', intents, limitPerIntent: searchLimitPerIntent },
      );
      const runGroups = await Promise.all(
        intents.map(async (intentQuery) => {
          const items = await this.agentQueue.run(
            () => this.search.search(intentQuery, searchLimitPerIntent),
            mode,
          );
          await this.logAgentCommunication(
            sessionId,
            'SEARCH',
            'COMMUNICATION',
            'response',
            `Found ${items.length} for: ${intentQuery.slice(0, 60)}…`,
            { resultCount: items.length, queryText: intentQuery },
          );
          const run = await this.prisma.searchRun.create({
            data: {
              sessionId,
              queryText: intentQuery,
              refinedParams: refinedParams as object,
              rawSearchResponse: { items: items.length },
            },
          });
          const created = await Promise.all(
            items.map((item, i) =>
              this.prisma.searchResult.create({
                data: {
                  searchRunId: run.id,
                  title: item.title,
                  url: item.url,
                  price: item.price ?? null,
                  source: item.source ?? null,
                  position: item.position,
                  snippet: item.snippet ?? null,
                },
              }),
            ),
          );
          return { queryText: intentQuery, run, created };
        }),
      );
      const allCreated = runGroups.flatMap((g) => g.created);
      const resultsForFormat = allCreated.map((r) => ({
        title: r.title,
        url: r.url,
        price: r.price,
        source: r.source,
        snippet: r.snippet,
      }));
      const combinedQueryText = intents.join('; ');
      let formattedContent = await this.ai.formatResultsForPresentation(
        resultsForFormat,
        combinedQueryText,
        'default',
        sessionId,
      );
      const comparisonSummary = await this.ai.comparePrices(resultsForFormat, combinedQueryText, 'default', sessionId, priorityOrder ?? undefined);
      if (comparisonSummary) {
        formattedContent = `${formattedContent}\n\n---\n**Price comparison:** ${comparisonSummary}`;
      }
      await this.prisma.message.create({
        data: { sessionId, role: 'assistant', contentType: 'text', content: formattedContent },
      });
      // Rich content (3.3–3.5): emit table content for chat UI
      const tableForMulti = {
        headers: ['Title', 'Price', 'Source', 'URL'],
        rows: resultsForFormat.map((r) => ({
          Title: r.title,
          Price: r.price ?? '',
          Source: r.source ?? '',
          URL: r.url ?? '',
        })),
      };
      await this.prisma.message.create({
        data: {
          sessionId,
          role: 'assistant',
          contentType: 'table',
          content: JSON.stringify(tableForMulti),
        },
      });
      this.logging.info('Multi-product query processed', {
        sessionId,
        intentCount: intents.length,
        resultCount: allCreated.length,
        context: 'SessionsService',
      });
      return {
        results: allCreated.map((r) => ({
          id: r.id,
          title: r.title,
          url: r.url,
          price: r.price,
          source: r.source,
          position: r.position,
          snippet: r.snippet,
        })),
        queryText: combinedQueryText,
        groups: runGroups.map((g) => ({
          queryText: g.queryText,
          results: g.created.map((r) => ({
            id: r.id,
            title: r.title,
            url: r.url,
            price: r.price,
            source: r.source,
            position: r.position,
            snippet: r.snippet,
          })),
        })),
      };
    }

    // Single intent (existing flow)
    await this.logAgentCommunication(
      sessionId,
      'COMMUNICATION',
      'SEARCH',
      'task',
      `Find up to ${searchLimit} product photos for: ${queryText}`,
      { task: 'search_products', queryText, limit: searchLimit },
    );
    await this.logAgentCommunication(
      sessionId,
      'COMMUNICATION',
      'SEARCH',
      'request',
      `Search query: ${queryText}`,
      { queryText },
    );
    const items = await this.agentQueue.run(
      () => this.search.search(queryText, searchLimit),
      mode,
    );
    await this.logAgentCommunication(
      sessionId,
      'SEARCH',
      'COMMUNICATION',
      'response',
      `Found ${items.length} search results`,
      { resultCount: items.length },
    );
    const run = await this.prisma.searchRun.create({
      data: {
        sessionId,
        queryText,
        refinedParams: refinedParams as object,
        rawSearchResponse: { items: items.length },
      },
    });
    const created = await Promise.all(
      items.map((item) =>
        this.prisma.searchResult.create({
          data: {
            searchRunId: run.id,
            title: item.title,
            url: item.url,
            price: item.price ?? null,
            source: item.source ?? null,
            position: item.position,
            snippet: item.snippet ?? null,
          },
        }),
      ),
    );
    const resultsForFormat = created.map((r, index) => ({
      title: r.title,
      url: r.url,
      price: r.price,
      source: r.source,
      snippet: r.snippet,
      // Prefer imageUrl from AI search response when available
      imageUrl: items[index]?.imageUrl,
    }));
    let formattedContent = await this.ai.formatResultsForPresentation(
      resultsForFormat,
      queryText,
      'default',
      sessionId,
    );
    const comparisonSummary = await this.ai.comparePrices(resultsForFormat, queryText, 'default', sessionId, priorityOrder ?? undefined);
    if (comparisonSummary) {
      formattedContent = `${formattedContent}\n\n---\n**Price comparison:** ${comparisonSummary}`;
    }
    await this.prisma.message.create({
      data: { sessionId, role: 'assistant', contentType: 'text', content: formattedContent },
    });
    // Rich content (3.3–3.5): emit structured table for chat (including image URLs when present)
    const tableForSingle = {
      headers: ['Title', 'Price', 'Source', 'URL', 'Image'],
      rows: resultsForFormat.map((r) => ({
        Title: r.title,
        Price: r.price ?? '',
        Source: r.source ?? '',
        URL: r.url ?? '',
        Image: (r as any).imageUrl ?? '',
      })),
    };
    await this.prisma.message.create({
      data: {
        sessionId,
        role: 'assistant',
        contentType: 'table',
        content: JSON.stringify(tableForSingle),
      },
    });
    this.logging.info('Query processed', { sessionId, searchRunId: run.id, resultCount: created.length, queryText: queryText?.slice(0, 100), context: 'SessionsService' });
    return {
      results: created.map((r, index) => ({
        id: r.id,
        title: r.title,
        url: r.url,
        price: r.price,
        source: r.source,
        position: r.position,
        snippet: r.snippet,
        imageUrl: items[index]?.imageUrl,
      })),
      queryText,
    };
  }

  async submitFeedback(sessionId: string, message: string, selectedIndices?: number[], priorities?: string[], profileId?: string) {
    this.logging.info('Feedback submit request', { sessionId, messageLength: message?.length, selectedIndicesCount: selectedIndices?.length ?? 0, context: 'SessionsService' });
    let session = await this.getSession(sessionId);
    await this.updateSessionProfile(sessionId, profileId);
    const priorityOrder = await this.updateSessionPriorities(sessionId, session, priorities);
    const lastRun = await this.prisma.searchRun.findFirst({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      include: { searchResults: true },
    });
    if (!lastRun) {
      this.logging.warn('Feedback rejected: no previous search to refine', { sessionId, context: 'SessionsService' });
      return { results: [], message: 'No previous search to refine' };
    }
    await this.prisma.message.create({
      data: { sessionId, role: 'user', contentType: 'text', content: message },
    });
    const currentParams = (lastRun.refinedParams as Record<string, unknown>) || {};
    this.ai.setSessionsService(this);
    let { queryText, refinedParams } = await this.ai.refineFromFeedback(message, selectedIndices || [], currentParams, 'default', sessionId);
    // 5.2: LOCATION agent for delivery/region on feedback (10.1: pass priorityOrder)
    const locationResult = await this.ai.extractDeliveryRegion(message, queryText, 'default', sessionId, priorityOrder ?? undefined);
    if (locationResult.augmentedQuery?.trim()) {
      queryText = `${queryText.trim()} ${locationResult.augmentedQuery.trim()}`.trim();
      this.logging.debug('Refined query augmented with delivery region', { augmentedQuery: locationResult.augmentedQuery, context: 'SessionsService' });
    }
    const searchLimit = 20;
    // 4.4: User reply in chat → Communication agent assigns task to Search agent; cycle continues
    await this.logAgentCommunication(
      sessionId,
      'COMMUNICATION',
      'SEARCH',
      'task',
      `Task: refine search based on user feedback. Find up to ${searchLimit} products for: ${queryText}`,
      { task: 'search_products', queryText, limit: searchLimit },
    );
    await this.logAgentCommunication(
      sessionId,
      'COMMUNICATION',
      'SEARCH',
      'request',
      `Refined search query: ${queryText}`,
      { queryText },
    );
    const items = await this.search.search(queryText, searchLimit);
    // Log agent communication: SEARCH agent -> COMMUNICATION agent
    await this.logAgentCommunication(
      sessionId,
      'SEARCH',
      'COMMUNICATION',
      'response',
      `Found ${items.length} refined search results`,
      { resultCount: items.length },
    );
    const run = await this.prisma.searchRun.create({
      data: {
        sessionId,
        queryText,
        refinedParams: refinedParams as object,
        rawSearchResponse: { items: items.length },
      },
    });
    const created = await Promise.all(
      items.map((item) =>
        this.prisma.searchResult.create({
          data: {
            searchRunId: run.id,
            title: item.title,
            url: item.url,
            price: item.price ?? null,
            source: item.source ?? null,
            position: item.position,
            snippet: item.snippet ?? null,
          },
        }),
      ),
    );
    const resultsForFormat = created.map((r, index) => ({
      title: r.title,
      url: r.url,
      price: r.price,
      source: r.source,
      snippet: r.snippet,
      imageUrl: items[index]?.imageUrl,
    }));
    let formattedContent = await this.ai.formatResultsForPresentation(
      resultsForFormat,
      queryText,
      'default',
      sessionId,
    );
    // 5.1: COMPARISON agent on feedback flow (10.1: priorityOrder)
    const comparisonSummary = await this.ai.comparePrices(resultsForFormat, queryText, 'default', sessionId, priorityOrder ?? undefined);
    if (comparisonSummary) {
      formattedContent = `${formattedContent}\n\n---\n**Price comparison:** ${comparisonSummary}`;
    }
    await this.prisma.message.create({
      data: {
        sessionId,
        role: 'assistant',
        contentType: 'text',
        content: formattedContent,
      },
    });
    // Rich content (3.3–3.5): emit structured table for chat (including image URLs when present)
    const tableForFeedback = {
      headers: ['Title', 'Price', 'Source', 'URL', 'Image'],
      rows: resultsForFormat.map((r) => ({
        Title: r.title,
        Price: r.price ?? '',
        Source: r.source ?? '',
        URL: r.url ?? '',
        Image: (r as any).imageUrl ?? '',
      })),
    };
    await this.prisma.message.create({
      data: {
        sessionId,
        role: 'assistant',
        contentType: 'table',
        content: JSON.stringify(tableForFeedback),
      },
    });
    this.logging.info('Feedback processed', { sessionId, searchRunId: run.id, resultCount: created.length, queryText: queryText?.slice(0, 100), context: 'SessionsService' });
    return {
      results: created.map((r) => ({ id: r.id, title: r.title, url: r.url, price: r.price, source: r.source, position: r.position, snippet: r.snippet })),
      queryText,
    };
  }

  async getResults(sessionId: string, page = 1, limit = 20) {
    this.logging.debug('Results list request', { sessionId, page, limit, context: 'SessionsService' });
    await this.getSession(sessionId);
    const runs = await this.prisma.searchRun.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      include: { searchResults: { orderBy: { position: 'asc' } } },
      skip: (page - 1) * limit,
      take: limit,
    });
    const total = await this.prisma.searchRun.count({ where: { sessionId } });
    this.logging.info('Results list returned', { sessionId, page, limit, total, count: runs.length, context: 'SessionsService' });
    return {
      items: runs.map((r) => ({
        id: r.id,
        queryText: r.queryText,
        createdAt: r.createdAt,
        results: r.searchResults,
      })),
      pagination: { page, limit, total },
    };
  }

  async chooseProduct(sessionId: string, productId: string) {
    this.logging.debug('Choice request', { sessionId, productId, context: 'SessionsService' });
    const session = await this.getSession(sessionId);
    const result = await this.prisma.searchResult.findFirst({
      where: { id: productId, searchRun: { sessionId } },
    });
    if (!result) {
      this.logging.warn('Product not found in session', { sessionId, productId, context: 'SessionsService' });
      throw new NotFoundException('Product not found in this session');
    }
    await this.prisma.choice.create({
      data: { sessionId, searchResultId: result.id, productUrl: result.url },
    });
    this.logging.info('Product chosen', { sessionId, productId, productUrl: result.url, context: 'SessionsService' });
    return { productUrl: result.url };
  }

  async getChoiceRedirect(sessionId: string, productId: string): Promise<{ url: string }> {
    const { productUrl } = await this.chooseProduct(sessionId, productId);
    return { url: productUrl };
  }

  async getClientMessages(sessionId: string) {
    this.logging.debug('Client messages request', { sessionId, context: 'SessionsService' });
    await this.getSession(sessionId);
    const messages = await this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
    this.logging.info('Client messages returned', { sessionId, count: messages.length, context: 'SessionsService' });
    return {
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        contentType: m.contentType,
        content: m.content,
        createdAt: m.createdAt,
      })),
    };
  }

  async getAgentCommunications(sessionId: string) {
    this.logging.debug('Agent communications request', { sessionId, context: 'SessionsService' });
    await this.getSession(sessionId);
    const communications = await this.prisma.agentCommunication.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
    this.logging.info('Agent communications returned', { sessionId, count: communications.length, context: 'SessionsService' });
    return {
      communications: communications.map((c) => ({
        id: c.id,
        fromAgent: c.fromAgent,
        toAgent: c.toAgent,
        messageType: c.messageType,
        content: c.content,
        metadata: c.metadata,
        createdAt: c.createdAt,
      })),
    };
  }

  async logAgentCommunication(
    sessionId: string,
    fromAgent: string,
    toAgent: string,
    messageType: string,
    content: string,
    metadata?: Record<string, unknown>,
  ) {
    this.logging.debug('Logging agent communication', {
      sessionId,
      fromAgent,
      toAgent,
      messageType,
      contentLength: content?.length,
      context: 'SessionsService',
    });
    try {
      await this.prisma.agentCommunication.create({
        data: {
          sessionId,
          fromAgent,
          toAgent,
          messageType,
          content,
          metadata: metadata as object,
        },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logging.warn('Failed to log agent communication', { error: msg, sessionId, context: 'SessionsService' });
    }
  }
}
