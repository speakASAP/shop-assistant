import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoggingService } from '../logging/logging.service';
import { AgentExecutionMode, ExecutionModeService } from './execution-mode.service';

export interface SafeAppSettings {
  agentExecutionMode: AgentExecutionMode;
  maxSearchResults: number;
  publicLanding: PublicLandingSettings;
  meta: SafeAppSettingsMeta;
}

export interface SafeAppSettingsMeta {
  agentExecutionMode: AppSettingMeta;
  maxSearchResults: AppSettingMeta;
  publicLanding: AppSettingMeta;
}

export interface AppSettingMeta {
  key: string;
  editable: boolean;
  source: 'persisted' | 'default';
  description: string;
  appliesTo: string;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface PublicLandingSettings {
  headline: string;
  subheadline: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  contactHeadline: string;
  contactSubheadline: string;
  leadSubmitLabel: string;
  footerTagline: string;
}

interface UpdateSettingsPayload {
  agentExecutionMode?: AgentExecutionMode;
  maxSearchResults?: number;
  publicLanding?: Partial<PublicLandingSettings>;
}

const DEFAULT_MAX_SEARCH_RESULTS = 20;
const MIN_SEARCH_RESULTS = 5;
const MAX_SEARCH_RESULTS = 30;
const DEFAULT_PUBLIC_LANDING: PublicLandingSettings = {
  headline: 'Shop Assistant',
  subheadline: 'AI finds products, compares offers, and keeps every customer request in one secure workspace.',
  primaryCtaLabel: 'Start a search',
  secondaryCtaLabel: 'View dashboard',
  contactHeadline: 'Bring this buying assistant into your customer flow.',
  contactSubheadline: 'Send a request for a commercial setup, integration, or managed search workflow. Text, voice, and documents are supported.',
  leadSubmitLabel: 'Send request',
  footerTagline: 'Shop Assistant - AI product search, customer dashboards, and admin controls.',
};
const PUBLIC_LANDING_LIMITS: Record<keyof PublicLandingSettings, number> = {
  headline: 80,
  subheadline: 220,
  primaryCtaLabel: 40,
  secondaryCtaLabel: 40,
  contactHeadline: 120,
  contactSubheadline: 260,
  leadSubmitLabel: 40,
  footerTagline: 160,
};
const SAFE_SETTING_META: Record<keyof SafeAppSettingsMeta, Pick<AppSettingMeta, 'key' | 'editable' | 'description' | 'appliesTo'>> = {
  agentExecutionMode: {
    key: 'agentExecutionMode',
    editable: true,
    description: 'Controls whether AI/search agent work runs synchronously or through the in-memory queue.',
    appliesTo: 'Agent handoff execution path',
  },
  maxSearchResults: {
    key: 'maxSearchResults',
    editable: true,
    description: 'Maximum number of search results requested per single product intent.',
    appliesTo: 'New query and feedback search runs',
  },
  publicLanding: {
    key: 'publicLanding',
    editable: true,
    description: 'Public non-secret marketing copy applied by the landing page.',
    appliesTo: 'Landing page copy and lead CTA labels',
  },
};

@Injectable()
export class AppSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logging: LoggingService,
    private readonly executionMode: ExecutionModeService,
  ) {}

  async getSettings(): Promise<SafeAppSettings> {
    const [agentMode, maxSearchResults, publicLanding, meta] = await Promise.all([
      this.getAgentExecutionMode(),
      this.getMaxSearchResults(),
      this.getPublicLandingSettings(),
      this.getSettingsMeta(),
    ]);
    return { agentExecutionMode: agentMode, maxSearchResults, publicLanding, meta };
  }

  async updateSettings(payload: UpdateSettingsPayload, updatedBy?: string): Promise<SafeAppSettings> {
    if (payload.agentExecutionMode !== undefined) {
      await this.setAgentExecutionMode(payload.agentExecutionMode, updatedBy);
    }
    if (payload.maxSearchResults !== undefined) {
      await this.setMaxSearchResults(payload.maxSearchResults, updatedBy);
    }
    if (payload.publicLanding !== undefined) {
      await this.setPublicLandingSettings(payload.publicLanding, updatedBy);
    }
    return this.getSettings();
  }

  async getAgentExecutionMode(): Promise<AgentExecutionMode> {
    const stored = await this.prisma.appSetting.findUnique({ where: { key: 'agentExecutionMode' } });
    const value = typeof stored?.value === 'string' ? stored.value : undefined;
    if (value === 'sync' || value === 'queue') return value;
    return this.executionMode.getMode();
  }

  async setAgentExecutionMode(mode: AgentExecutionMode, updatedBy?: string): Promise<AgentExecutionMode> {
    if (mode !== 'sync' && mode !== 'queue') {
      throw new BadRequestException('agentExecutionMode must be "sync" or "queue"');
    }
    await this.prisma.appSetting.upsert({
      where: { key: 'agentExecutionMode' },
      create: {
        key: 'agentExecutionMode',
        value: mode,
        description: 'Controls whether AI/search agent work runs synchronously or through the in-memory queue.',
        updatedBy: updatedBy ?? null,
      },
      update: { value: mode, updatedBy: updatedBy ?? null },
    });
    this.executionMode.setMode(mode);
    this.logging.info('Admin setting applied: agentExecutionMode', { mode, updatedBy, context: 'AppSettingsService' });
    return mode;
  }

  async getMaxSearchResults(): Promise<number> {
    const stored = await this.prisma.appSetting.findUnique({ where: { key: 'maxSearchResults' } });
    const raw = stored?.value;
    const value = typeof raw === 'number' ? raw : Number(raw);
    if (Number.isInteger(value) && value >= MIN_SEARCH_RESULTS && value <= MAX_SEARCH_RESULTS) return value;
    return DEFAULT_MAX_SEARCH_RESULTS;
  }

  async setMaxSearchResults(value: number, updatedBy?: string): Promise<number> {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < MIN_SEARCH_RESULTS || parsed > MAX_SEARCH_RESULTS) {
      throw new BadRequestException(`maxSearchResults must be an integer between ${MIN_SEARCH_RESULTS} and ${MAX_SEARCH_RESULTS}`);
    }
    await this.prisma.appSetting.upsert({
      where: { key: 'maxSearchResults' },
      create: {
        key: 'maxSearchResults',
        value: parsed,
        description: 'Maximum number of search results requested per single product intent.',
        updatedBy: updatedBy ?? null,
      },
      update: { value: parsed, updatedBy: updatedBy ?? null },
    });
    this.logging.info('Admin setting applied: maxSearchResults', { maxSearchResults: parsed, updatedBy, context: 'AppSettingsService' });
    return parsed;
  }

  async getPublicLandingSettings(): Promise<PublicLandingSettings> {
    const stored = await this.prisma.appSetting.findUnique({ where: { key: 'publicLanding' } });
    const raw = stored?.value;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ...DEFAULT_PUBLIC_LANDING };
    return this.normalizePublicLanding(raw as Partial<PublicLandingSettings>, false);
  }

  async setPublicLandingSettings(payload: Partial<PublicLandingSettings>, updatedBy?: string): Promise<PublicLandingSettings> {
    const current = await this.getPublicLandingSettings();
    const next = this.normalizePublicLanding({ ...current, ...payload }, true);
    const value = next as unknown as Prisma.InputJsonObject;
    await this.prisma.appSetting.upsert({
      where: { key: 'publicLanding' },
      create: {
        key: 'publicLanding',
        value,
        description: 'Public non-secret marketing copy applied by the landing page.',
        updatedBy: updatedBy ?? null,
      },
      update: { value, updatedBy: updatedBy ?? null },
    });
    this.logging.info('Admin setting applied: publicLanding', { updatedBy, context: 'AppSettingsService' });
    return next;
  }

  async getSettingsMeta(): Promise<SafeAppSettingsMeta> {
    const keys = Object.values(SAFE_SETTING_META).map((item) => item.key);
    const records = await this.prisma.appSetting.findMany({
      where: { key: { in: keys } },
      select: { key: true, description: true, updatedBy: true, updatedAt: true },
    });
    const byKey = new Map(records.map((record) => [record.key, record]));

    const build = (id: keyof SafeAppSettingsMeta): AppSettingMeta => {
      const definition = SAFE_SETTING_META[id];
      const record = byKey.get(definition.key);
      return {
        ...definition,
        source: record ? 'persisted' : 'default',
        description: record?.description || definition.description,
        updatedBy: record?.updatedBy || null,
        updatedAt: record?.updatedAt ? record.updatedAt.toISOString() : null,
      };
    };

    return {
      agentExecutionMode: build('agentExecutionMode'),
      maxSearchResults: build('maxSearchResults'),
      publicLanding: build('publicLanding'),
    };
  }

  private normalizePublicLanding(payload: Partial<PublicLandingSettings>, strict: boolean): PublicLandingSettings {
    const normalized = { ...DEFAULT_PUBLIC_LANDING };
    (Object.keys(DEFAULT_PUBLIC_LANDING) as Array<keyof PublicLandingSettings>).forEach((key) => {
      const raw = payload[key];
      if (raw === undefined || raw === null) return;
      const value = String(raw).replace(/\s+/g, ' ').trim();
      if (!value) {
        if (strict) throw new BadRequestException(`${key} cannot be empty`);
        return;
      }
      const limit = PUBLIC_LANDING_LIMITS[key];
      if (value.length > limit) {
        if (strict) throw new BadRequestException(`${key} must be ${limit} characters or fewer`);
        normalized[key] = value.slice(0, limit);
        return;
      }
      normalized[key] = value;
    });
    return normalized;
  }
}
