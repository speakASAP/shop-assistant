import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { LoggingService } from '../logging/logging.service';
import { PromptsService } from '../admin/prompts.service';
import { AgentType } from '@prisma/client';
import { SessionsService } from './sessions.service';

/**
 * Client for ai-microservice: ASR (speech-to-text) and LLM (query extraction/refinement).
 * Uses AI_SERVICE_URL from .env. When admin prompts exist, uses prompt content and model from admin panel.
 */
@Injectable()
export class AiService {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private sessionsService: SessionsService | null = null;

  constructor(
    private readonly httpService: HttpService,
    private readonly logging: LoggingService,
    private readonly promptsService: PromptsService,
  ) {
    this.baseUrl = process.env.AI_SERVICE_URL || '';
    this.timeout = Number(process.env.AI_SERVICE_TIMEOUT) || 30000;
  }

  setSessionsService(service: SessionsService) {
    this.sessionsService = service;
  }

  /**
   * Transcribe audio URL to text via ai-microservice orchestrator.
   * Uses AI_SERVICE_URL + /api/shop-assistant/transcribe.
   */
  async transcribe(audioUrl: string, sessionId?: string): Promise<{ transcript: string }> {
    if (!this.baseUrl) {
      this.logging.warn('AI_SERVICE_URL not set, cannot transcribe', { audioUrl: audioUrl?.slice(0, 80), context: 'AiService' });
      return { transcript: '' };
    }
    const url = `${this.baseUrl.replace(/\/$/, '')}/api/shop-assistant/transcribe`;
    this.logging.debug('ASR transcribe request', {
      url,
      audioUrlLength: audioUrl?.length,
      context: 'AiService',
    });

    // Log agent communication: COMMUNICATION agent -> ASR agent
    if (sessionId && this.sessionsService) {
      await this.sessionsService.logAgentCommunication(
        sessionId,
        'COMMUNICATION',
        'ASR',
        'request',
        `Transcribe audio: ${audioUrl?.slice(0, 100)}...`,
        { audioUrl: audioUrl?.slice(0, 200), url },
      );
    }

    try {
      const res = await lastValueFrom(
        this.httpService.post(
          url,
          { voice_file_url: audioUrl },
          { timeout: this.timeout },
        ),
      );
      const transcript = res.data?.transcript ?? res.data?.text ?? '';

      // Log agent communication: ASR agent -> COMMUNICATION agent
      if (sessionId && this.sessionsService) {
        await this.sessionsService.logAgentCommunication(
          sessionId,
          'ASR',
          'COMMUNICATION',
          'response',
          `Transcript: ${transcript?.slice(0, 200)}${transcript.length > 200 ? '...' : ''}`,
          { transcriptLength: transcript.length },
        );
      }

      this.logging.info('ASR transcribe success', { transcriptLength: transcript?.length, context: 'AiService' });
      return { transcript };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);

      // Log agent communication error
      if (sessionId && this.sessionsService) {
        await this.sessionsService.logAgentCommunication(
          sessionId,
          'ASR',
          'COMMUNICATION',
          'error',
          `ASR transcribe failed: ${msg}`,
          { error: msg },
        );
      }

      this.logging.error('ASR transcribe failed', { error: msg, audioUrl: audioUrl?.slice(0, 80), context: 'AiService' });
      throw e;
    }
  }

  /**
   * Split user shopping text into N distinct product search intents (10.2 multi-product).
   * Calls LLM with a prompt to return a JSON array of 1..5 search query strings.
   * Returns array of query strings; on failure or single intent returns [singleQuery].
   */
  async splitIntoSearchIntents(
    userText: string,
    singleQueryFallback: string,
    sessionId?: string,
  ): Promise<string[]> {
    if (!this.baseUrl || !userText?.trim()) {
      return [singleQueryFallback.trim() || userText?.trim() || ''];
    }
    const prompt = `The user wants to shop. Their request: "${userText.slice(0, 500)}"
Output 1 to 5 distinct product search queries as a JSON array of strings. Each string is one web search query (e.g. "red silk skirt size 52", "leather handbag"). If the request is clearly for one product type, return one query. Reply with ONLY the JSON array, no other text. Example: ["query1","query2"]`;
    const analyzeUrl = `${this.baseUrl.replace(/\/$/, '')}/api/analyze-text`;
    try {
      const res = await lastValueFrom(
        this.httpService.post(
          analyzeUrl,
          { text_content: prompt, analysis_type: 'content_generation' },
          { timeout: this.timeout },
        ),
      );
      const content = (res.data?.summary ?? res.data?.key_insights?.[0] ?? res.data?.text ?? '') as string;
      const raw = typeof content === 'string' ? content.trim() : String(content).trim();
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) {
        const arr = JSON.parse(match[0]) as unknown;
        if (Array.isArray(arr)) {
          const queries = arr
            .filter((x): x is string => typeof x === 'string')
            .map((s) => s.trim().slice(0, 200))
            .filter(Boolean);
          if (queries.length > 0) {
            this.logging.info('Split into search intents', { count: queries.length, context: 'AiService' });
            if (sessionId && this.sessionsService) {
              await this.sessionsService.logAgentCommunication(
                sessionId,
                'COMMUNICATION',
                'SEARCH',
                'request',
                `Multi-product: ${queries.length} intents`,
                { intents: queries },
              );
            }
            return queries;
          }
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logging.debug('Split intents failed, using single query', { error: msg, context: 'AiService' });
    }
    return [singleQueryFallback.trim() || userText.trim()];
  }

  /**
   * Refine raw user text into a search-friendly query (and optional structured params).
   * Uses COMMUNICATION agent on ai-microservice side:
   *   POST AI_SERVICE_URL `/api/shop-assistant/refine-query`
   * Admin prompt/model (AgentType.COMMUNICATION) are passed as overrides to ai-microservice.
   */
  async refineQuery(
    userText: string,
    previousParams?: Record<string, unknown>,
    role: string = 'default',
    sessionId?: string,
  ): Promise<{ queryText: string; refinedParams: Record<string, unknown> }> {
    const refinedParams: Record<string, unknown> = previousParams ? { ...previousParams } : {};
    if (!this.baseUrl) {
      this.logging.debug('Refine query skipped: AI_SERVICE_URL not set, using raw text', { userTextLength: userText?.length, context: 'AiService' });
      return { queryText: userText.trim(), refinedParams };
    }

    let model: string | undefined;
    const adminPrompt = await this.promptsService.getActivePromptForAgent(AgentType.COMMUNICATION, role);
    if (adminPrompt?.content) {
      if (adminPrompt.model) model = adminPrompt.model;
      this.logging.debug('Using admin prompt for COMMUNICATION', { promptId: adminPrompt.id, model: model ?? 'default', context: 'AiService' });
    }

    const refineUrl = `${this.baseUrl.replace(/\/$/, '')}/api/shop-assistant/refine-query`;
    const body: {
      user_text: string;
      previous_params?: Record<string, unknown>;
      role: string;
      prompt_content?: string;
      model?: string;
    } = {
      user_text: userText,
      role,
    };
    if (previousParams) body.previous_params = previousParams;
    if (adminPrompt?.content) body.prompt_content = adminPrompt.content;
    if (model) body.model = model;

    // Log agent communication: COMMUNICATION agent -> LLM agent
    if (sessionId && this.sessionsService) {
      await this.sessionsService.logAgentCommunication(
        sessionId,
        'COMMUNICATION',
        'LLM',
        'request',
        `Refine query: ${userText?.slice(0, 200)}${userText.length > 200 ? '...' : ''}`,
        { userTextLength: userText.length, hasPreviousParams: !!previousParams, model: model ?? 'default' },
      );
    }

    this.logging.debug('LLM refine query request (ai-microservice)', {
      userTextLength: userText?.length,
      hasPreviousParams: !!previousParams,
      hasModel: !!model,
      context: 'AiService',
    });
    try {
      const res = await lastValueFrom(
        this.httpService.post(refineUrl, body, { timeout: this.timeout }),
      );
      const queryTextRaw = (res.data?.query_text ?? res.data?.queryText ?? '') as string;
      const queryText = (typeof queryTextRaw === 'string' ? queryTextRaw : String(queryTextRaw)).slice(0, 200).trim() || userText.trim();
      const remoteParams = (res.data?.refined_params ?? res.data?.refinedParams ?? refinedParams) as Record<string, unknown>;

      // Log agent communication: LLM agent -> COMMUNICATION agent
      if (sessionId && this.sessionsService) {
        await this.sessionsService.logAgentCommunication(
          sessionId,
          'LLM',
          'COMMUNICATION',
          'response',
          `Refined query: ${queryText}`,
          { queryTextLength: queryText.length },
        );
      }

      this.logging.info('LLM refine query success (ai-microservice)', { queryTextLength: queryText?.length, queryTextPreview: queryText?.slice(0, 80), context: 'AiService' });
      return { queryText, refinedParams: remoteParams ?? refinedParams };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);

      // Log agent communication error
      if (sessionId && this.sessionsService) {
        await this.sessionsService.logAgentCommunication(
          sessionId,
          'LLM',
          'COMMUNICATION',
          'error',
          `LLM refine query failed: ${msg}`,
          { error: msg },
        );
      }

      this.logging.warn('LLM refine query failed, using raw text', { error: msg, userTextLength: userText?.length, context: 'AiService' });
      return { queryText: userText.trim(), refinedParams };
    }
  }

  /**
   * Refine search params based on user feedback (e.g. "cheaper", "only with return").
   */
  async refineFromFeedback(
    feedbackMessage: string,
    selectedIndices: number[],
    currentParams: Record<string, unknown>,
    role: string = 'default',
    sessionId?: string,
  ): Promise<{ queryText: string; refinedParams: Record<string, unknown> }> {
    this.logging.debug('Refine from feedback', { feedbackLength: feedbackMessage?.length, selectedIndicesCount: selectedIndices?.length, context: 'AiService' });
    const userText = `Feedback: ${feedbackMessage}. ${selectedIndices.length ? `User liked results at indices: ${selectedIndices.join(', ')}.` : ''} Tighten search.`;
    return this.refineQuery(userText, currentParams, role, sessionId);
  }

  /**
   * Format search results for user chat via PRESENTATION agent (dialog/tables/photos).
   * Uses PRESENTATION agent on ai-microservice side:
   *   POST AI_SERVICE_URL `/api/shop-assistant/format-presentation`
   * Admin prompt/model (AgentType.PRESENTATION) are passed as overrides to ai-microservice.
   */
  async formatResultsForPresentation(
    results: Array<{ title: string; url?: string; price?: string | null; source?: string | null; snippet?: string | null }>,
    queryText: string,
    role: string = 'default',
    sessionId?: string,
  ): Promise<string> {
    if (sessionId && this.sessionsService) {
      await this.sessionsService.logAgentCommunication(
        sessionId,
        'SEARCH',
        'PRESENTATION',
        'request',
        `Task: format ${results.length} search results for user (dialog/tables/photos). Query: ${queryText?.slice(0, 100)}`,
        { resultCount: results.length, queryText: queryText?.slice(0, 200) },
      );
    }

    let formatted: string;
    const adminPrompt = await this.promptsService.getActivePromptForAgent(AgentType.PRESENTATION, role);
    if (!this.baseUrl) {
      this.logging.debug('PRESENTATION skipped: AI_SERVICE_URL not set, using local fallback', { context: 'AiService' });
      formatted = fallbackPresentation(results, queryText);
    } else {
      const formatUrl = `${this.baseUrl.replace(/\/$/, '')}/api/shop-assistant/format-presentation`;
      const body: {
        results: Array<{ title: string; url?: string; price?: string | null; source?: string | null; snippet?: string | null }>;
        query_text: string;
        role: string;
        prompt_content?: string;
        model?: string;
      } = {
        results,
        query_text: queryText,
        role,
      };
      if (adminPrompt?.content) body.prompt_content = adminPrompt.content;
      if (adminPrompt?.model) body.model = adminPrompt.model;

      this.logging.debug('PRESENTATION format request (ai-microservice)', {
        resultCount: results.length,
        promptId: adminPrompt?.id ?? null,
        context: 'AiService',
      });
      try {
        const res = await lastValueFrom(
          this.httpService.post(formatUrl, body, { timeout: this.timeout }),
        );
        const content = (res.data?.formatted_content ?? res.data?.content ?? res.data?.text ?? '') as string;
        formatted = typeof content === 'string' ? content.trim() : String(content).trim();
        if (!formatted) formatted = fallbackPresentation(results, queryText);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        this.logging.warn('PRESENTATION format failed (ai-microservice), using fallback', { error: msg, context: 'AiService' });
        if (sessionId && this.sessionsService) {
          await this.sessionsService.logAgentCommunication(
            sessionId,
            'PRESENTATION',
            'COMMUNICATION',
            'error',
            `Format failed: ${msg}`,
            { error: msg },
          );
        }
        formatted = fallbackPresentation(results, queryText);
      }
    }

    if (sessionId && this.sessionsService) {
      await this.sessionsService.logAgentCommunication(
        sessionId,
        'PRESENTATION',
        'COMMUNICATION',
        'response',
        `Formatted content ready for user chat. Summary: ${formatted.slice(0, 200)}${formatted.length > 200 ? '…' : ''}`,
        { contentLength: formatted.length },
      );
    }

    this.logging.info('PRESENTATION format success', { contentLength: formatted?.length, context: 'AiService' });
    return formatted;
  }

  /**
   * Use COMPARISON agent to compare prices of search results.
   * Uses admin prompt for AgentType.COMPARISON with {{searchResults}}, {{queryText}}, {{priorityOrder}} (10.1).
   * Logs SEARCH→COMPARISON and COMPARISON→COMMUNICATION. Returns summary or empty string.
   */
  async comparePrices(
    results: Array<{ title: string; url?: string; price?: string | null; source?: string | null; snippet?: string | null }>,
    queryText: string,
    role: string = 'default',
    sessionId?: string,
    priorityOrder?: string[] | null,
  ): Promise<string> {
    if (sessionId && this.sessionsService) {
      await this.sessionsService.logAgentCommunication(
        sessionId,
        'SEARCH',
        'COMPARISON',
        'request',
        `Compare prices for ${results.length} results. Query: ${queryText?.slice(0, 100)}${priorityOrder?.length ? ' Priorities: ' + priorityOrder.join(', ') : ''}`,
        { resultCount: results.length, priorityOrder: priorityOrder ?? undefined },
      );
    }

    const adminPrompt = await this.promptsService.getActivePromptForAgent(AgentType.COMPARISON, role);
    if (!this.baseUrl || !adminPrompt?.content) {
      this.logging.debug('COMPARISON skipped: no prompt or AI_SERVICE_URL', { context: 'AiService' });
      if (sessionId && this.sessionsService) {
        await this.sessionsService.logAgentCommunication(
          sessionId,
          'COMPARISON',
          'COMMUNICATION',
          'response',
          'Compare prices skipped (no COMPARISON prompt configured).',
          {},
        );
      }
      return '';
    }

    const compareUrl = `${this.baseUrl.replace(/\/$/, '')}/api/shop-assistant/compare-prices`;
    const body: {
      results: Array<{ title: string; url?: string; price?: string | null; source?: string | null; snippet?: string | null }>;
      query_text: string;
      role: string;
      prompt_content?: string;
      model?: string;
      priority_order?: string[];
    } = {
      results,
      query_text: queryText,
      role,
    };
    if (adminPrompt.content) body.prompt_content = adminPrompt.content;
    if (adminPrompt.model) body.model = adminPrompt.model;
    if (priorityOrder?.length) body.priority_order = priorityOrder;

    try {
      const res = await lastValueFrom(
        this.httpService.post(compareUrl, body, { timeout: this.timeout }),
      );
      const content = (res.data?.summary ?? res.data?.text ?? '') as string;
      const summary = typeof content === 'string' ? content.trim() : String(content).trim();

      if (sessionId && this.sessionsService) {
        await this.sessionsService.logAgentCommunication(
          sessionId,
          'COMPARISON',
          'COMMUNICATION',
          'response',
          `Price comparison: ${summary.slice(0, 200)}${summary.length > 200 ? '…' : ''}`,
          { contentLength: summary.length },
        );
      }
      this.logging.info('COMPARISON success', { contentLength: summary?.length, context: 'AiService' });
      return summary;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logging.warn('COMPARISON failed', { error: msg, context: 'AiService' });
      if (sessionId && this.sessionsService) {
        await this.sessionsService.logAgentCommunication(
          sessionId,
          'COMPARISON',
          'COMMUNICATION',
          'error',
          `Compare prices failed: ${msg}`,
          { error: msg },
        );
      }
      return '';
    }
  }

  /**
   * Use LOCATION agent to extract or validate delivery region from user input / query.
   * Uses admin prompt for AgentType.LOCATION with {{userInput}}, {{queryText}}, {{priorityOrder}} (10.1).
   * Logs COMMUNICATION→LOCATION and LOCATION→COMMUNICATION.
   * Returns augmented query string to append for search (e.g. "delivery Czech Republic") or empty.
   */
  async extractDeliveryRegion(
    userText: string,
    queryText: string,
    role: string = 'default',
    sessionId?: string,
    priorityOrder?: string[] | null,
  ): Promise<{ region?: string; augmentedQuery?: string }> {
    if (sessionId && this.sessionsService) {
      await this.sessionsService.logAgentCommunication(
        sessionId,
        'COMMUNICATION',
        'LOCATION',
        'request',
        `Extract delivery region. User: ${userText?.slice(0, 150)}… Query: ${queryText?.slice(0, 100)}${priorityOrder?.length ? ' Priorities: ' + priorityOrder.join(', ') : ''}`,
        { userTextLength: userText?.length, queryTextLength: queryText?.length, priorityOrder: priorityOrder ?? undefined },
      );
    }

    const adminPrompt = await this.promptsService.getActivePromptForAgent(AgentType.LOCATION, role);
    if (!this.baseUrl || !adminPrompt?.content) {
      this.logging.debug('LOCATION skipped: no prompt or AI_SERVICE_URL', { context: 'AiService' });
      if (sessionId && this.sessionsService) {
        await this.sessionsService.logAgentCommunication(
          sessionId,
          'LOCATION',
          'COMMUNICATION',
          'response',
          'Delivery region extraction skipped (no LOCATION prompt configured).',
          {},
        );
      }
      return {};
    }

    const locationUrl = `${this.baseUrl.replace(/\/$/, '')}/api/shop-assistant/extract-location`;
    const body: {
      user_text: string;
      query_text: string;
      role: string;
      prompt_content?: string;
      model?: string;
      priority_order?: string[];
    } = {
      user_text: userText,
      query_text: queryText,
      role,
    };
    if (adminPrompt.content) body.prompt_content = adminPrompt.content;
    if (adminPrompt.model) body.model = adminPrompt.model;
    if (priorityOrder?.length) body.priority_order = priorityOrder;

    try {
      const res = await lastValueFrom(
        this.httpService.post(locationUrl, body, { timeout: this.timeout }),
      );
      const region = res.data?.region as string | undefined;
      const augmentedQuery = res.data?.augmented_query as string | undefined;

      if (sessionId && this.sessionsService) {
        await this.sessionsService.logAgentCommunication(
          sessionId,
          'LOCATION',
          'COMMUNICATION',
          'response',
          `Delivery region: ${region ? region.slice(0, 200) : 'n/a'}`,
          { contentLength: region?.length ?? 0 },
        );
      }
      this.logging.info('LOCATION success', { contentLength: region?.length ?? 0, context: 'AiService' });
      return { region, augmentedQuery };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logging.warn('LOCATION failed', { error: msg, context: 'AiService' });
      if (sessionId && this.sessionsService) {
        await this.sessionsService.logAgentCommunication(
          sessionId,
          'LOCATION',
          'COMMUNICATION',
          'error',
          `Extract delivery region failed: ${msg}`,
          { error: msg },
        );
      }
      return {};
    }
  }
}

/** Fallback when no PRESENTATION prompt or AI unavailable. */
function fallbackPresentation(
  results: Array<{ title: string; url?: string; price?: string | null; source?: string | null }>,
  queryText: string,
): string {
  const lines = results.slice(0, 20).map((r, i) => {
    const price = r.price ? ` — ${r.price}` : '';
    const source = r.source ? ` (${r.source})` : '';
    return `${i + 1}. ${r.title}${price}${source}${r.url ? '\n   ' + r.url : ''}`;
  });
  return `Found ${results.length} results for: ${queryText}\n\n${lines.join('\n')}\n\nClick a link to open the product.`;
}
