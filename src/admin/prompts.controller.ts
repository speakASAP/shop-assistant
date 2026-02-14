/**
 * Admin Prompts Controller
 * CRUD for AI agent prompts. Protected by JWT (admin section).
 */

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PromptsService } from './prompts.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import { AgentType } from '@prisma/client';
import { LoggingService } from '../logging/logging.service';

@Controller('admin/prompts')
@UseGuards(JwtAuthGuard)
export class PromptsController {
  constructor(
    private readonly prompts: PromptsService,
    private readonly logging: LoggingService,
  ) {}

  /**
   * List all prompts or filter by agentType
   * GET /api/admin/prompts?agentType=SEARCH
   */
  @Get()
  async list(@Query('agentType') agentType?: string, @Req() req?: Request) {
    const userId = (req as Request & { user?: { id?: string } })?.user?.id;
    this.logging.info('Admin prompts list request', { agentType: agentType ?? 'all', userId, context: 'PromptsController' });
    const type = agentType && isValidAgentType(agentType) ? (agentType as AgentType) : undefined;
    return this.prompts.findAll(type);
  }

  /**
   * Get one prompt by id
   */
  @Get(':id')
  async getOne(@Param('id') id: string, @Req() req?: Request) {
    const userId = (req as Request & { user?: { id?: string } })?.user?.id;
    this.logging.debug('Admin prompt get one request', { id, userId, context: 'PromptsController' });
    return this.prompts.findOne(id);
  }

  /**
   * Create a new prompt
   */
  @Post()
  async create(@Body() dto: CreatePromptDto, @Req() req?: Request) {
    const userId = (req as Request & { user?: { id?: string } })?.user?.id;
    this.logging.info('Admin prompt create request', { agentType: dto.agentType, name: dto.name, userId, context: 'PromptsController' });
    return this.prompts.create(dto);
  }

  /**
   * Update a prompt
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePromptDto, @Req() req?: Request) {
    const userId = (req as Request & { user?: { id?: string } })?.user?.id;
    this.logging.info('Admin prompt update request', { id, userId, context: 'PromptsController' });
    return this.prompts.update(id, dto);
  }

  /**
   * Delete a prompt
   */
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req?: Request) {
    const userId = (req as Request & { user?: { id?: string } })?.user?.id;
    this.logging.info('Admin prompt delete request', { id, userId, context: 'PromptsController' });
    return this.prompts.remove(id);
  }
}

function isValidAgentType(value: string): value is AgentType {
  return ['SEARCH', 'COMPARISON', 'LOCATION', 'COMMUNICATION', 'PRESENTATION'].includes(value);
}
