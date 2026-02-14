import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { LoggingService } from '../logging/logging.service';

export interface SearchResultItem {
  title: string;
  url: string;
  price?: string;
  source?: string;
  position: number;
  snippet?: string;
  imageUrl?: string;
}

/**
 * SEARCH agent client for ai-microservice.
 * Delegates search to ai-microservice `/api/shop-assistant/search`,
 * so all external search (Serper, etc.) is performed on ai-microservice side.
 */
@Injectable()
export class SearchService {
  private readonly aiBaseUrl: string;
  private readonly timeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly logging: LoggingService,
  ) {
    this.aiBaseUrl = process.env.AI_SERVICE_URL || '';
    this.timeout = Number(process.env.HTTP_TIMEOUT) || 15000;
  }

  async search(queryText: string, limit = 20): Promise<SearchResultItem[]> {
    if (!this.aiBaseUrl) {
      this.logging.warn('AI_SERVICE_URL not set, returning empty results', {
        queryText: queryText?.slice(0, 80),
        context: 'SearchService',
      });
      return [];
    }
    const url = `${this.aiBaseUrl.replace(/\/$/, '')}/api/shop-assistant/search`;
    this.logging.debug('Search request (ai-microservice)', {
      url: url.replace(/\/[^/]*$/, '/api/shop-assistant/search'),
      queryText: queryText?.slice(0, 80),
      limit,
      context: 'SearchService',
    });
    try {
      const res = await lastValueFrom(
        this.httpService.post(
          url,
          { query_text: queryText, limit },
          { timeout: this.timeout },
        ),
      );
      const items = (res.data?.items ?? []) as SearchResultItem[];
      this.logging.info('Search completed (ai-microservice)', {
        queryText: queryText?.slice(0, 80),
        count: items.length,
        context: 'SearchService',
      });
      return items;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logging.error('ai-microservice search failed', {
        error: msg,
        queryText: queryText?.slice(0, 80),
        context: 'SearchService',
      });
      return [];
    }
  }
}
