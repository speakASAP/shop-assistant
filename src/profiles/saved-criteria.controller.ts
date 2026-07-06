import { Body, Controller, Get, Param, Post, Put, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ShopAssistantEntitlementGuard } from '../auth/shop-assistant-entitlement.guard';
import { SavedCriteriaService } from './saved-criteria.service';
import { CreateSavedCriteriaDto, UpdateSavedCriteriaDto } from './dto/saved-criteria.dto';

@Controller('saved-criteria')
@UseGuards(JwtAuthGuard, ShopAssistantEntitlementGuard)
export class SavedCriteriaController {
  constructor(private readonly savedCriteria: SavedCriteriaService) {}

  @Get()
  async list(@Req() req: any, @Query('page') page?: string, @Query('limit') limit?: string) {
    const userId = req.user?.id as string;
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(String(limit), 10) || 20));
    return this.savedCriteria.listCriteria(userId, pageNum, limitNum);
  }

  @Get(':id')
  async get(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id as string;
    return this.savedCriteria.getCriteria(userId, id);
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateSavedCriteriaDto) {
    const userId = req.user?.id as string;
    return this.savedCriteria.createCriteria(userId, {
      name: dto.name,
      priorities: dto.priorities,
      productIntents: dto.productIntents,
      filters: dto.filters,
      profileId: dto.profileId,
    });
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateSavedCriteriaDto) {
    const userId = req.user?.id as string;
    return this.savedCriteria.updateCriteria(userId, id, {
      name: dto.name,
      priorities: dto.priorities,
      productIntents: dto.productIntents,
      filters: dto.filters,
      profileId: dto.profileId,
    });
  }

  @Delete(':id')
  async delete(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id as string;
    return this.savedCriteria.deleteCriteria(userId, id);
  }

  @Post(':id/run')
  async run(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id as string;
    return this.savedCriteria.runCriteria(userId, id);
  }
}
