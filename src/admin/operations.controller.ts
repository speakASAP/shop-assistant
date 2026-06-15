import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Put, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { PRIORITY_KEYS } from '../sessions/dto/create-session.dto';

const MAX_LIMIT = 50;
const PRIORITY_KEY_SET = new Set<string>(PRIORITY_KEYS);
const MAX_SEARCH_LENGTH = 120;
const LEAD_TRIAGE_STATUSES = ['new', 'contacted', 'qualified', 'won', 'lost', 'spam'] as const;
const LEAD_TRIAGE_STATUS_SET = new Set<string>(LEAD_TRIAGE_STATUSES);
const MAX_ASSIGNEE_LENGTH = 120;
const MAX_ADMIN_NOTES_LENGTH = 2000;

interface UpdateSessionOperationsDto {
  priorityOrder?: string[] | null;
  profileId?: string | null;
}

interface UpdateLeadOperationsDto {
  triageStatus?: string;
  assignedTo?: string | null;
  adminNotes?: string | null;
}

interface UpdateAccountProfileOperationsDto {
  name?: string;
  role?: string | null;
}

interface UpdateSavedCriteriaOperationsDto {
  name?: string;
  priorities?: unknown;
  productIntents?: unknown;
  filters?: unknown;
  profileId?: string | null;
}

function toPositiveInt(value: string | undefined, fallback: number, max = MAX_LIMIT): number {
  const parsed = Number.parseInt(value || '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function normalizeSearch(value: string | undefined): string | undefined {
  const search = String(value || '').replace(/\s+/g, ' ').trim();
  return search ? search.slice(0, MAX_SEARCH_LENGTH) : undefined;
}

function normalizePriorityOrder(value: string[] | null | undefined): string[] | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!Array.isArray(value)) throw new BadRequestException('priorityOrder must be an array or null');
  const seen = new Set<string>();
  const normalized: string[] = [];
  value.forEach((item) => {
    if (typeof item !== 'string' || !PRIORITY_KEY_SET.has(item)) {
      throw new BadRequestException(`priorityOrder can contain only: ${PRIORITY_KEYS.join(', ')}`);
    }
    if (!seen.has(item)) {
      seen.add(item);
      normalized.push(item);
    }
  });
  return normalized.length ? normalized : null;
}

function normalizeLeadTriageStatus(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (!LEAD_TRIAGE_STATUS_SET.has(normalized)) {
    throw new BadRequestException(`triageStatus must be one of: ${LEAD_TRIAGE_STATUSES.join(', ')}`);
  }
  return normalized;
}

function normalizeOptionalText(value: string | null | undefined, field: string, maxLength: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const normalized = String(value).replace(/\s+/g, ' ').trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) {
    throw new BadRequestException(`${field} must be ${maxLength} characters or fewer`);
  }
  return normalized;
}

function normalizeRequiredText(value: string | undefined, field: string, maxLength: number): string | undefined {
  if (value === undefined) return undefined;
  const normalized = String(value).replace(/\s+/g, ' ').trim();
  if (!normalized) throw new BadRequestException(`${field} is required`);
  if (normalized.length > maxLength) {
    throw new BadRequestException(`${field} must be ${maxLength} characters or fewer`);
  }
  return normalized;
}

function requestUserId(req: Request): string | null {
  return (req as Request & { user?: { id?: string; email?: string } }).user?.id ?? null;
}

function wantsSensitiveDetail(value: string | undefined): boolean {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

function textSummary(value: string | null | undefined, previewLength = 140) {
  const text = String(value || '');
  return {
    redacted: true,
    length: text.length,
    preview: text ? `${text.slice(0, previewLength)}${text.length > previewLength ? '...' : ''}` : '',
  };
}

function jsonSummary(value: unknown) {
  if (value == null) return { redacted: true, type: 'empty', count: 0 };
  if (Array.isArray(value)) return { redacted: true, type: 'array', count: value.length };
  if (typeof value === 'object') return { redacted: true, type: 'object', keys: Object.keys(value as Record<string, unknown>).slice(0, 12) };
  return { redacted: true, type: typeof value };
}

function redactMessage(message: { content?: string | null; [key: string]: unknown }) {
  const { content, ...rest } = message;
  return { ...rest, content: textSummary(content) };
}

function redactSearchRun(run: { queryText?: string | null; rawSearchResponse?: unknown; searchResults?: unknown; [key: string]: unknown }) {
  const { queryText, rawSearchResponse, searchResults, ...rest } = run;
  return { ...rest, queryText: textSummary(queryText), rawSearchResponse: jsonSummary(rawSearchResponse), searchResults };
}

function redactAgentCommunication(item: { content?: string | null; metadata?: unknown; [key: string]: unknown }) {
  const { content, metadata, ...rest } = item;
  return { ...rest, content: textSummary(content), metadata: jsonSummary(metadata) };
}

function redactLead(lead: { message?: string | null; contactMethods?: unknown; metadata?: unknown; [key: string]: unknown }) {
  const { message, contactMethods, metadata, ...rest } = lead;
  const messageSummary = textSummary(message, 220);
  return { ...rest, message: messageSummary, messagePreview: messageSummary.preview, contactMethods: jsonSummary(contactMethods), contactSummary: jsonSummary(contactMethods), metadata: jsonSummary(metadata) };
}

function maybeRedactSessionDetail(session: any, includeSensitive: boolean) {
  if (!session || includeSensitive) return session;
  return {
    ...session,
    sensitiveDetailRedacted: true,
    messages: (session.messages || []).map(redactMessage),
    searchRuns: (session.searchRuns || []).map(redactSearchRun),
    agentCommunications: (session.agentCommunications || []).map(redactAgentCommunication),
  };
}

function maybeRedactLead(lead: any, includeSensitive: boolean) {
  if (!lead || includeSensitive) return lead;
  return { ...redactLead(lead), sensitiveDetailRedacted: true };
}

@Controller('admin/operations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('global:superadmin', 'app:shop-assistant:admin')
export class OperationsController {
  constructor(private readonly prisma: PrismaService) {}

  private getSessionDetail(id: string) {
    return this.prisma.session.findUnique({
      where: { id },
      include: {
        profile: { select: { id: true, name: true, role: true, userId: true } },
        messages: { orderBy: { createdAt: 'asc' } },
        searchRuns: {
          orderBy: { createdAt: 'desc' },
          include: {
            searchResults: { orderBy: { position: 'asc' }, take: 20 },
          },
        },
        choices: {
          orderBy: { chosenAt: 'desc' },
          include: {
            searchResult: {
              select: { id: true, title: true, url: true, price: true, source: true, position: true },
            },
          },
        },
        agentCommunications: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
  }

  @Get('sessions')
  async listSessions(@Query('page') pageValue?: string, @Query('limit') limitValue?: string, @Query('q') q?: string) {
    const page = toPositiveInt(pageValue, 1, 1000);
    const limit = toPositiveInt(limitValue, 20);
    const search = normalizeSearch(q);
    const where = search
      ? {
          OR: [
            { id: { contains: search, mode: 'insensitive' as const } },
            { userId: { contains: search, mode: 'insensitive' as const } },
            { profileId: { contains: search, mode: 'insensitive' as const } },
            { profile: { is: { name: { contains: search, mode: 'insensitive' as const } } } },
            { messages: { some: { content: { contains: search, mode: 'insensitive' as const } } } },
            { searchRuns: { some: { queryText: { contains: search, mode: 'insensitive' as const } } } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.session.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          userId: true,
          profileId: true,
          priorityOrder: true,
          createdAt: true,
          updatedAt: true,
          profile: { select: { id: true, name: true, role: true } },
          _count: {
            select: {
              messages: true,
              searchRuns: true,
              choices: true,
              agentCommunications: true,
            },
          },
        },
      }),
      this.prisma.session.count({ where }),
    ]);

    return { items, pagination: { page, limit, total, q: search ?? null } };
  }

  @Get('sessions/:id')
  async getSession(@Param('id') id: string, @Query('includeSensitive') includeSensitive?: string) {
    const session = await this.getSessionDetail(id);

    return { session: maybeRedactSessionDetail(session, wantsSensitiveDetail(includeSensitive)) };
  }

  @Put('sessions/:id')
  async updateSession(@Param('id') id: string, @Body() body: UpdateSessionOperationsDto) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
    if (!session) throw new NotFoundException('Session not found');

    const data: { priorityOrder?: object | null; profileId?: string | null } = {};
    const priorityOrder = normalizePriorityOrder(body?.priorityOrder);
    if (priorityOrder !== undefined) data.priorityOrder = priorityOrder ? (priorityOrder as object) : null;

    if (body?.profileId !== undefined) {
      const profileId = typeof body.profileId === 'string' ? body.profileId.trim() : null;
      if (!profileId) {
        data.profileId = null;
      } else {
        if (!session.userId) {
          throw new BadRequestException('Anonymous sessions can only clear profileId');
        }
        const profile = await this.prisma.accountProfile.findUnique({
          where: { id: profileId },
          select: { id: true, userId: true },
        });
        if (!profile) throw new BadRequestException('profileId does not exist');
        if (profile.userId !== session.userId) {
          throw new BadRequestException('profileId must belong to the session user');
        }
        data.profileId = profile.id;
      }
    }

    if (Object.keys(data).length) {
      await this.prisma.session.update({ where: { id }, data });
    }
    return { session: await this.getSessionDetail(id) };
  }

  @Get('profiles')
  async listProfiles(@Query('page') pageValue?: string, @Query('limit') limitValue?: string, @Query('q') q?: string) {
    const page = toPositiveInt(pageValue, 1, 1000);
    const limit = toPositiveInt(limitValue, 20);
    const search = normalizeSearch(q);
    const where = search
      ? {
          OR: [
            { id: { contains: search, mode: 'insensitive' as const } },
            { userId: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
            { role: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.accountProfile.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          userId: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { sessions: true, savedCriteria: true } },
        },
      }),
      this.prisma.accountProfile.count({ where }),
    ]);

    return { items, pagination: { page, limit, total, q: search ?? null } };
  }

  @Put('profiles/:id')
  async updateProfile(@Param('id') id: string, @Body() body: UpdateAccountProfileOperationsDto) {
    const existing = await this.prisma.accountProfile.findUnique({
      where: { id },
      select: { id: true, name: true, role: true },
    });
    if (!existing) throw new NotFoundException('Profile not found');

    const name = normalizeRequiredText(body?.name, 'name', 120);
    const role = normalizeOptionalText(body?.role, 'role', 120);
    const data: { name?: string; role?: string | null } = {};
    if (name !== undefined) data.name = name;
    if (role !== undefined) data.role = role;
    if (!Object.keys(data).length) return { profile: existing };

    const profile = await this.prisma.accountProfile.update({ where: { id }, data });
    return { profile };
  }

  @Get('saved-criteria')
  async listSavedCriteria(@Query('page') pageValue?: string, @Query('limit') limitValue?: string, @Query('q') q?: string) {
    const page = toPositiveInt(pageValue, 1, 1000);
    const limit = toPositiveInt(limitValue, 20);
    const search = normalizeSearch(q);
    const where = search
      ? {
          OR: [
            { id: { contains: search, mode: 'insensitive' as const } },
            { userId: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
            { profileId: { contains: search, mode: 'insensitive' as const } },
            { profile: { is: { name: { contains: search, mode: 'insensitive' as const } } } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.savedSearchCriteria.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          userId: true,
          name: true,
          priorities: true,
          productIntents: true,
          filters: true,
          profileId: true,
          createdAt: true,
          updatedAt: true,
          profile: { select: { id: true, name: true, role: true } },
          _count: { select: { sessions: true } },
        },
      }),
      this.prisma.savedSearchCriteria.count({ where }),
    ]);

    return { items, pagination: { page, limit, total, q: search ?? null } };
  }

  @Put('saved-criteria/:id')
  async updateSavedCriteria(@Param('id') id: string, @Body() body: UpdateSavedCriteriaOperationsDto) {
    const existing = await this.prisma.savedSearchCriteria.findUnique({
      where: { id },
      select: { id: true, userId: true, name: true, priorities: true, productIntents: true, filters: true, profileId: true },
    });
    if (!existing) throw new NotFoundException('Saved criteria not found');

    const name = normalizeRequiredText(body?.name, 'name', 255);
    const data: {
      name?: string;
      priorities?: object | null;
      productIntents?: object | null;
      filters?: object | null;
      profileId?: string | null;
    } = {};
    if (name !== undefined) data.name = name;
    if (body?.priorities !== undefined) data.priorities = body.priorities === null ? null : (body.priorities as object);
    if (body?.productIntents !== undefined) data.productIntents = body.productIntents === null ? null : (body.productIntents as object);
    if (body?.filters !== undefined) data.filters = body.filters === null ? null : (body.filters as object);
    if (body?.profileId !== undefined) {
      const profileId = typeof body.profileId === 'string' ? body.profileId.trim() : null;
      if (!profileId) {
        data.profileId = null;
      } else {
        const profile = await this.prisma.accountProfile.findUnique({
          where: { id: profileId },
          select: { id: true, userId: true },
        });
        if (!profile) throw new BadRequestException('profileId does not exist');
        if (profile.userId !== existing.userId) {
          throw new BadRequestException('profileId must belong to the saved criteria user');
        }
        data.profileId = profile.id;
      }
    }

    if (!Object.keys(data).length) return { savedCriteria: existing };
    const savedCriteria = await this.prisma.savedSearchCriteria.update({
      where: { id },
      data,
      include: { profile: { select: { id: true, name: true, role: true } } },
    });
    return { savedCriteria };
  }

  @Get('leads')
  async listLeads(@Query('page') pageValue?: string, @Query('limit') limitValue?: string, @Query('q') q?: string) {
    const page = toPositiveInt(pageValue, 1, 1000);
    const limit = toPositiveInt(limitValue, 20);
    const search = normalizeSearch(q);
    const where = search
      ? {
          OR: [
            { id: { contains: search, mode: 'insensitive' as const } },
            { sourceService: { contains: search, mode: 'insensitive' as const } },
            { sourceLabel: { contains: search, mode: 'insensitive' as const } },
            { message: { contains: search, mode: 'insensitive' as const } },
            { leadId: { contains: search, mode: 'insensitive' as const } },
            { aiSubmissionId: { contains: search, mode: 'insensitive' as const } },
            { leadForwardingStatus: { contains: search, mode: 'insensitive' as const } },
            { aiAnalysisStatus: { contains: search, mode: 'insensitive' as const } },
            { triageStatus: { contains: search, mode: 'insensitive' as const } },
            { assignedTo: { contains: search, mode: 'insensitive' as const } },
            { adminNotes: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.leadRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          sourceService: true,
          sourceLabel: true,
          leadId: true,
          aiSubmissionId: true,
          leadForwardingStatus: true,
          leadForwardingError: true,
          leadForwardedAt: true,
          aiAnalysisStatus: true,
          aiAnalysisError: true,
          aiAnalyzedAt: true,
          triageStatus: true,
          assignedTo: true,
          adminNotes: true,
          triagedAt: true,
          triagedBy: true,
          message: true,
          contactMethods: true,
          metadata: true,
          createdAt: true,
        },
      }),
      this.prisma.leadRequest.count({ where }),
    ]);

    return {
      items: items.map((item) => redactLead(item)),
      pagination: { page, limit, total, q: search ?? null },
    };
  }

  @Get('leads/:id')
  async getLead(@Param('id') id: string, @Query('includeSensitive') includeSensitive?: string) {
    const lead = await this.prisma.leadRequest.findUnique({ where: { id } });
    return { lead: maybeRedactLead(lead, wantsSensitiveDetail(includeSensitive)) };
  }

  @Put('leads/:id')
  async updateLead(@Param('id') id: string, @Body() body: UpdateLeadOperationsDto, @Req() req: Request) {
    const lead = await this.prisma.leadRequest.findUnique({ where: { id }, select: { id: true } });
    if (!lead) throw new NotFoundException('Lead not found');

    const data: {
      triageStatus?: string;
      assignedTo?: string | null;
      adminNotes?: string | null;
      triagedAt?: Date;
      triagedBy?: string | null;
    } = {};
    const triageStatus = normalizeLeadTriageStatus(body?.triageStatus);
    if (triageStatus !== undefined) data.triageStatus = triageStatus;
    const assignedTo = normalizeOptionalText(body?.assignedTo, 'assignedTo', MAX_ASSIGNEE_LENGTH);
    if (assignedTo !== undefined) data.assignedTo = assignedTo;
    const adminNotes = normalizeOptionalText(body?.adminNotes, 'adminNotes', MAX_ADMIN_NOTES_LENGTH);
    if (adminNotes !== undefined) data.adminNotes = adminNotes;
    if (!Object.keys(data).length) {
      const unchanged = await this.prisma.leadRequest.findUnique({ where: { id } });
      return { lead: maybeRedactLead(unchanged, false) };
    }

    data.triagedAt = new Date();
    data.triagedBy = requestUserId(req);
    const updated = await this.prisma.leadRequest.update({ where: { id }, data });
    return { lead: maybeRedactLead(updated, false) };
  }
}
