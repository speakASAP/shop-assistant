import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { createHash } from 'crypto';
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

const MAX_RECOVERY_QUERIES = 3;

export function normalizeQueryText(queryText: string): string {
  return String(queryText || '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

export function isUsableProductUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const QUERY_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'around', 'below', 'best', 'can', 'could', 'find', 'for', 'from',
  'good', 'have', 'help', 'i', 'in', 'is', 'me', 'need', 'online', 'or', 'please', 'show',
  'that', 'the', 'to', 'want', 'with', 'you', 'your', 'купить', 'можно', 'найди', 'нужен',
  'нужна', 'пожалуйста', 'покажи', 'хочу', 'koupit', 'najdi', 'potrebuji', 'prosím',
]);

function queryFingerprint(queryText: string): string {
  return createHash('sha256').update(normalizeQueryText(queryText).toLowerCase()).digest('hex').slice(0, 16);
}

function compactProductTerms(queryText: string): string {
  const words = normalizeQueryText(queryText)
    .toLowerCase()
    .replace(/[^\p{L}\p{N} .,+-]+/gu, ' ')
    .split(/\s+/)
    .map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
    .filter((word) => word && (word.length >= 3 || /\d/.test(word)) && !QUERY_STOP_WORDS.has(word));

  return words.slice(0, 10).join(' ');
}

export function buildRecoveryQueries(queryText: string): string[] {
  const normalized = normalizeQueryText(queryText);
  if (!normalized) return [];

  const withoutQuestionWords = normalized
    .replace(/\b(i want|i need|find me|show me|please|can you|could you|looking for|хочу|найди|покажи|пожалуйста|najdi|potrebuji|prosím)\b/gi, ' ')
    .replace(/[?!]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const compactTerms = compactProductTerms(normalized);

  const candidates = [
    withoutQuestionWords,
    compactTerms,
    `${compactTerms || withoutQuestionWords || normalized} buy online`,
    `${compactTerms || withoutQuestionWords || normalized} price`,
  ]
    .map(normalizeQueryText)
    .filter((candidate) => candidate && candidate.toLowerCase() !== normalized.toLowerCase());

  return Array.from(new Set(candidates)).slice(0, MAX_RECOVERY_QUERIES);
}

export function normalizeResults(items: SearchResultItem[], limit: number): SearchResultItem[] {
  const seenUrls = new Set<string>();
  const validItems: SearchResultItem[] = [];

  for (const item of items) {
    const title = typeof item?.title === 'string' ? item.title.trim() : '';
    const url = typeof item?.url === 'string' ? item.url.trim() : '';
    if (!title || !isUsableProductUrl(url)) continue;

    const dedupeKey = url.replace(/#.*$/, '').replace(/\/$/, '').toLowerCase();
    if (seenUrls.has(dedupeKey)) continue;
    seenUrls.add(dedupeKey);

    validItems.push({
      ...item,
      title,
      url,
      position: validItems.length + 1,
    });

    if (validItems.length >= limit) break;
  }

  return validItems;
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

    const token = process.env.AI_SERVICE_TOKEN;
    if (token) {
      this.httpService.axiosRef.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }

  async search(queryText: string, limit = 20): Promise<SearchResultItem[]> {
    const normalizedQuery = normalizeQueryText(queryText);
    if (!this.aiBaseUrl) {
      this.logging.warn('AI_SERVICE_URL not set, returning empty results', {
        queryFingerprint: queryFingerprint(normalizedQuery),
        queryLength: normalizedQuery.length,
        context: 'SearchService',
      });
      return [];
    }
    if (!normalizedQuery) {
      this.logging.warn('Search skipped: empty query after normalization', {
        context: 'SearchService',
      });
      return [];
    }

    const firstAttempt = await this.runSearch(normalizedQuery, limit);
    if (firstAttempt.length > 0) return firstAttempt;

    const recoveryQueries = buildRecoveryQueries(normalizedQuery);
    for (const [recoveryIndex, recoveryQuery] of recoveryQueries.entries()) {
      this.logging.warn('Search returned no usable results, trying recovery query', {
        originalQueryFingerprint: queryFingerprint(normalizedQuery),
        recoveryQueryFingerprint: queryFingerprint(recoveryQuery),
        recoveryRank: recoveryIndex + 1,
        originalQueryLength: normalizedQuery.length,
        recoveryQueryLength: recoveryQuery.length,
        context: 'SearchService',
      });
      const recovered = await this.runSearch(recoveryQuery, limit);
      if (recovered.length > 0) return recovered;
    }

    return [];
  }

  private async runSearch(queryText: string, limit: number): Promise<SearchResultItem[]> {
    const url = `${this.aiBaseUrl.replace(/\/$/, '')}/api/shop-assistant/search`;
    this.logging.debug('Search request (ai-microservice)', {
      url: url.replace(/\/[^/]*$/, '/api/shop-assistant/search'),
      queryFingerprint: queryFingerprint(queryText),
      queryLength: normalizeQueryText(queryText).length,
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
      const normalizedItems = normalizeResults(items, limit);
      this.logging.info('Search completed (ai-microservice)', {
        queryFingerprint: queryFingerprint(queryText),
        queryLength: normalizeQueryText(queryText).length,
        count: normalizedItems.length,
        droppedCount: Math.max(0, items.length - normalizedItems.length),
        context: 'SearchService',
      });
      return normalizedItems;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logging.error('ai-microservice search failed', {
        error: msg,
        queryFingerprint: queryFingerprint(queryText),
        queryLength: normalizeQueryText(queryText).length,
        context: 'SearchService',
      });
      return [];
    }
  }
}
