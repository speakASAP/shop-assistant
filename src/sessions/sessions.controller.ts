import { Body, Controller, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { QueryDto } from './dto/query.dto';
import { FeedbackDto } from './dto/feedback.dto';
import { LoggingService } from '../logging/logging.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SearchRateLimitService } from '../common/search-rate-limit.service';

@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessions: SessionsService,
    private readonly logging: LoggingService,
    private readonly rateLimit: SearchRateLimitService,
  ) {}

  private requestIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    const firstForwarded = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return String(firstForwarded || req.ip || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  }

  @Post()
  async create(@Body() dto: CreateSessionDto) {
    this.logging.info('POST /api/sessions create', { hasIgnoredUserId: !!dto.userId, prioritiesCount: dto.priorities?.length ?? 0, hasIgnoredProfileId: !!dto.profileId, context: 'SessionsController' });
    return this.sessions.createSession(undefined, dto.priorities, undefined);
  }

  @Post(':id/query')
  async query(@Param('id') id: string, @Body() dto: QueryDto, @Req() req: Request) {
    this.rateLimit.assertAllowed(`anon:${this.requestIp(req)}`, { endpoint: 'public-query' });
    this.logging.info('POST /api/sessions/:id/query', { sessionId: id, hasText: !!dto.text, hasAudioUrl: !!dto.audioUrl, context: 'SessionsController' });
    return this.sessions.submitPublicQuery(id, dto.text, dto.audioUrl, dto.priorities);
  }

  @Post(':id/feedback')
  async feedback(@Param('id') id: string, @Body() dto: FeedbackDto, @Req() req: Request) {
    this.rateLimit.assertAllowed(`anon:${this.requestIp(req)}`, { endpoint: 'public-feedback' });
    this.logging.info('POST /api/sessions/:id/feedback', { sessionId: id, messageLength: dto.message?.length, selectedCount: dto.selectedIndices?.length ?? 0, context: 'SessionsController' });
    return this.sessions.submitPublicFeedback(id, dto.message, dto.selectedIndices, dto.priorities);
  }

  @Get(':id/results')
  async results(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(30, Math.max(1, parseInt(String(limit), 10) || 20));
    this.logging.debug('GET /api/sessions/:id/results', { sessionId: id, page: pageNum, limit: limitNum, context: 'SessionsController' });
    return this.sessions.getPublicResults(id, pageNum, limitNum);
  }

  @Get(':id/choice/:productId')
  async choice(@Param('id') id: string, @Param('productId') productId: string) {
    this.logging.info('GET /api/sessions/:id/choice/:productId', { sessionId: id, productId, context: 'SessionsController' });
    return this.sessions.getPublicChoiceRedirect(id, productId);
  }

  @Get(':id/choice/:productId/redirect')
  async choiceRedirect(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Res() res: Response,
  ) {
    this.logging.info('GET /api/sessions/:id/choice/:productId/redirect', { sessionId: id, productId, context: 'SessionsController' });
    const { url } = await this.sessions.getPublicChoiceRedirect(id, productId);
    res.redirect(302, url);
  }

  @Get(':id/messages')
  async getClientMessages(@Param('id') id: string) {
    this.logging.debug('GET /api/sessions/:id/messages', { sessionId: id, context: 'SessionsController' });
    return this.sessions.getPublicClientMessages(id);
  }

  @Get(':id/agent-communications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('global:superadmin', 'app:shop-assistant:admin')
  async getAgentCommunications(@Param('id') id: string) {
    this.logging.debug('GET /api/sessions/:id/agent-communications', { sessionId: id, context: 'SessionsController' });
    return this.sessions.getAgentCommunications(id);
  }
}
