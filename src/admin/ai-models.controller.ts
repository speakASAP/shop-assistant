/**
 * Admin AI Models Controller
 * Returns available AI models from ai-microservice for admin prompt model dropdown.
 */

import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { LoggingService } from '../logging/logging.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Controller('admin/ai-models')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('global:superadmin', 'app:shop-assistant:admin')
export class AiModelsController {
  constructor(
    private readonly httpService: HttpService,
    private readonly logging: LoggingService,
  ) {}

  /**
   * GET /api/admin/ai-models
   * Fetches available AI models from ai-microservice orchestrator /models endpoint.
   * Returns unified list of all models from all AI services (fetched from source APIs).
   *
   * Query Parameters:
   *   - free_only: boolean - Return only free models (default: false)
   *   - context_min: number - Minimum context window size in tokens
   *   - limit: number - Maximum number of models to return per provider
   *   - provider: string - Filter by specific provider (e.g., "openrouter", "gemini")
   */
  @Get()
  async getModels(
    @Query('free_only') freeOnly?: string,
    @Query('context_min') contextMin?: string,
    @Query('limit') limit?: string,
    @Query('provider') provider?: string,
  ) {
    const baseUrl = process.env.AI_SERVICE_URL || '';
    if (!baseUrl) {
      this.logging.warn('AI_SERVICE_URL not set, returning empty models', { context: 'AiModelsController' });
      return { models: {}, providers: {}, modelList: [] };
    }
    const url = `${baseUrl.replace(/\/$/, '')}/models`;
    
    // Build query parameters
    const params: Record<string, string> = {};
    if (freeOnly === 'true' || freeOnly === '1') {
      params.free_only = 'true';
    }
    if (contextMin) {
      const contextMinNum = parseInt(contextMin, 10);
      if (!isNaN(contextMinNum)) {
        params.context_min = contextMin;
      }
    }
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        params.limit = limit;
      }
    }
    if (provider) {
      params.provider = provider;
    }
    
    try {
      const res = await firstValueFrom(
        this.httpService.get(url, { params, timeout: 30000 }),
      );
      const data = res.data || {};
      const models = data.models || {};
      const providers = data.providers || {};
      const modelList: { provider: string; name: string; description?: string; context_length?: number; pricing?: any }[] = [];
      
      // Process models from orchestrator response
      if (typeof models === 'object') {
        for (const [prov, providerModels] of Object.entries(models)) {
          const arr = Array.isArray(providerModels) ? providerModels : [];
          for (const m of arr) {
            if (typeof m === 'object' && m !== null) {
              const modelId = (m as { id?: string; name?: string }).id || (m as { name?: string }).name || '';
              const modelName = (m as { name?: string }).name || modelId;
              const description = (m as { description?: string }).description || '';
              const contextLength = (m as { context_length?: number }).context_length;
              const pricing = (m as { pricing?: any }).pricing;
              if (modelId) {
                modelList.push({
                  provider: prov,
                  name: modelId,
                  description,
                  context_length: contextLength,
                  pricing,
                });
              }
            } else if (typeof m === 'string') {
              modelList.push({ provider: prov, name: m, description: '' });
            }
          }
        }
      }
      
      this.logging.info('AI models fetched successfully', {
        url,
        count: modelList.length,
        filters: params,
        context: 'AiModelsController',
      });
      return { models, providers, modelList };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logging.warn('Failed to fetch AI models', { url, params, error: msg, context: 'AiModelsController' });
      return { models: {}, providers: {}, modelList: [] };
    }
  }
}
