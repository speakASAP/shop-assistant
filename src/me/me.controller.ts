import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ShopAssistantEntitlementGuard } from '../auth/shop-assistant-entitlement.guard';
import { CreateSessionDto } from '../sessions/dto/create-session.dto';
import { QueryDto } from '../sessions/dto/query.dto';
import { FeedbackDto } from '../sessions/dto/feedback.dto';
import { MeService } from './me.service';
import { SearchRateLimitService } from '../common/search-rate-limit.service';

@Controller('me')
@UseGuards(JwtAuthGuard, ShopAssistantEntitlementGuard)
export class MeController {
  constructor(
    private readonly me: MeService,
    private readonly rateLimit: SearchRateLimitService,
  ) {}

  @Get()
  async profile(@Req() req: any) {
    return { user: req.user };
  }

  @Get('dashboard')
  async dashboard(@Req() req: any) {
    return this.me.getDashboard(req.user.id as string);
  }

  @Get('sessions')
  async listSessions(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('profileId') profileId?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(String(limit), 10) || 20));
    return this.me.listSessions(req.user.id as string, pageNum, limitNum, { q, profileId, status });
  }

  @Get('choices')
  async listChoices(@Req() req: any, @Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(String(limit), 10) || 10));
    return this.me.listChoices(req.user.id as string, pageNum, limitNum);
  }

  @Post('sessions')
  async createSession(@Req() req: any, @Body() dto: CreateSessionDto) {
    return this.me.createSession(req.user.id as string, dto.priorities, dto.profileId);
  }

  @Get('sessions/:id')
  async getSession(@Req() req: any, @Param('id') id: string) {
    return this.me.getSession(req.user.id as string, id);
  }

  @Post('sessions/:id/query')
  async submitQuery(@Req() req: any, @Param('id') id: string, @Body() dto: QueryDto) {
    this.rateLimit.assertAllowed(`user:${req.user.id}`, { endpoint: 'me-query' });
    return this.me.submitQuery(req.user.id as string, id, dto.text, dto.audioUrl, dto.priorities, dto.profileId);
  }

  @Post('sessions/:id/feedback')
  async submitFeedback(@Req() req: any, @Param('id') id: string, @Body() dto: FeedbackDto) {
    this.rateLimit.assertAllowed(`user:${req.user.id}`, { endpoint: 'me-feedback' });
    return this.me.submitFeedback(req.user.id as string, id, dto.message, dto.selectedIndices, dto.priorities, dto.profileId);
  }

  @Post('privacy/session-data/anonymize')
  async anonymizeSessionData(@Req() req: any) {
    return this.me.anonymizeSessionData(req.user.id as string);
  }

  @Delete('privacy/session-data')
  async deleteSessionData(@Req() req: any) {
    return this.me.deleteSessionData(req.user.id as string);
  }

  @Post('sessions/:id/choice/:productId')
  async chooseProduct(@Req() req: any, @Param('id') id: string, @Param('productId') productId: string) {
    return this.me.chooseProduct(req.user.id as string, id, productId);
  }
}
