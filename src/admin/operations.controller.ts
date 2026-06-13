import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';

const MAX_LIMIT = 50;

function toPositiveInt(value: string | undefined, fallback: number, max = MAX_LIMIT): number {
  const parsed = Number.parseInt(value || '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

@Controller('admin/operations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('global:superadmin', 'app:shop-assistant:admin')
export class OperationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('sessions')
  async listSessions(@Query('page') pageValue?: string, @Query('limit') limitValue?: string) {
    const page = toPositiveInt(pageValue, 1, 1000);
    const limit = toPositiveInt(limitValue, 20);
    const where = {};
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

    return { items, pagination: { page, limit, total } };
  }

  @Get('sessions/:id')
  async getSession(@Param('id') id: string) {
    const session = await this.prisma.session.findUnique({
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

    return { session };
  }

  @Get('leads')
  async listLeads(@Query('page') pageValue?: string, @Query('limit') limitValue?: string) {
    const page = toPositiveInt(pageValue, 1, 1000);
    const limit = toPositiveInt(limitValue, 20);
    const [items, total] = await Promise.all([
      this.prisma.leadRequest.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          sourceService: true,
          sourceLabel: true,
          leadId: true,
          aiSubmissionId: true,
          message: true,
          contactMethods: true,
          metadata: true,
          createdAt: true,
        },
      }),
      this.prisma.leadRequest.count(),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        messagePreview: item.message.length > 220 ? `${item.message.slice(0, 220)}...` : item.message,
      })),
      pagination: { page, limit, total },
    };
  }

  @Get('leads/:id')
  async getLead(@Param('id') id: string) {
    const lead = await this.prisma.leadRequest.findUnique({ where: { id } });
    return { lead };
  }
}
