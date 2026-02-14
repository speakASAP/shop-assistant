import { Controller, Post, Get, Param, Body, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { QueryDto } from './dto/query.dto';
import { FeedbackDto } from './dto/feedback.dto';
import { LoggingService } from '../logging/logging.service';

@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessions: SessionsService,
    private readonly logging: LoggingService,
  ) {}

  @Post()
  async create(@Body() dto: CreateSessionDto) {
    this.logging.info('POST /api/sessions create', { userId: dto.userId ?? null, prioritiesCount: dto.priorities?.length ?? 0, profileId: dto.profileId ?? null, context: 'SessionsController' });
    return this.sessions.createSession(dto.userId, dto.priorities, dto.profileId);
  }

  @Post(':id/query')
  async query(@Param('id') id: string, @Body() dto: QueryDto) {
    this.logging.info('POST /api/sessions/:id/query', { sessionId: id, hasText: !!dto.text, hasAudioUrl: !!dto.audioUrl, context: 'SessionsController' });
    return this.sessions.submitQuery(id, dto.text, dto.audioUrl, dto.priorities, dto.profileId);
  }

  @Post(':id/feedback')
  async feedback(@Param('id') id: string, @Body() dto: FeedbackDto) {
    this.logging.info('POST /api/sessions/:id/feedback', { sessionId: id, messageLength: dto.message?.length, selectedCount: dto.selectedIndices?.length ?? 0, context: 'SessionsController' });
    return this.sessions.submitFeedback(id, dto.message, dto.selectedIndices, dto.priorities, dto.profileId);
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
    return this.sessions.getResults(id, pageNum, limitNum);
  }

  @Get(':id/choice/:productId')
  async choice(@Param('id') id: string, @Param('productId') productId: string) {
    this.logging.info('GET /api/sessions/:id/choice/:productId', { sessionId: id, productId, context: 'SessionsController' });
    return this.sessions.getChoiceRedirect(id, productId);
  }

  @Get(':id/choice/:productId/redirect')
  async choiceRedirect(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Res() res: Response,
  ) {
    this.logging.info('GET /api/sessions/:id/choice/:productId/redirect', { sessionId: id, productId, context: 'SessionsController' });
    const { url } = await this.sessions.getChoiceRedirect(id, productId);
    res.redirect(302, url);
  }

  @Get(':id/messages')
  async getClientMessages(@Param('id') id: string) {
    this.logging.debug('GET /api/sessions/:id/messages', { sessionId: id, context: 'SessionsController' });
    return this.sessions.getClientMessages(id);
  }

  @Get(':id/agent-communications')
  async getAgentCommunications(@Param('id') id: string) {
    this.logging.debug('GET /api/sessions/:id/agent-communications', { sessionId: id, context: 'SessionsController' });
    return this.sessions.getAgentCommunications(id);
  }
}
