/**
 * Admin Prompts Service
 * CRUD for AI agent prompts (search, comparison, location, communication, presentation)
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggingService } from '../logging/logging.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import { AgentType } from '@prisma/client';

@Injectable()
export class PromptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logging: LoggingService,
  ) {}

  /**
   * List prompts, optionally filtered by agentType
   */
  async findAll(agentType?: AgentType) {
    const where = agentType ? { agentType } : {};
    this.logging.debug('Admin prompts findAll', { agentType: agentType ?? 'all', context: 'PromptsService' });
    const items = await this.prisma.agentPrompt.findMany({
      where,
      orderBy: [{ agentType: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    this.logging.info('Admin prompts list', { count: items.length, agentType: agentType ?? 'all', context: 'PromptsService' });
    return { items };
  }

  /**
   * Get one prompt by id
   */
  async findOne(id: string) {
    const prompt = await this.prisma.agentPrompt.findUnique({
      where: { id },
    });
    if (!prompt) {
      this.logging.warn('Admin prompt not found', { id, context: 'PromptsService' });
      throw new NotFoundException('Prompt not found');
    }
    this.logging.debug('Admin prompt get one', { id, agentType: prompt.agentType, context: 'PromptsService' });
    return prompt;
  }

  /**
   * Get the active prompt for an agent type and optional role (used by AI requests).
   * Returns first active prompt by sortOrder. Role "default" matches role = 'default' or role = null.
   */
  async getActivePromptForAgent(agentType: AgentType, role: string = 'default') {
    const r = role || 'default';
    const prompt = await this.prisma.agentPrompt.findFirst({
      where: {
        agentType,
        isActive: true,
        OR: r === 'default' ? [{ role: 'default' }, { role: null }] : [{ role: r }],
      },
      orderBy: { sortOrder: 'asc' },
    });
    if (!prompt && r !== 'default') {
      return this.getActivePromptForAgent(agentType, 'default');
    }
    return prompt ?? null;
  }

  /**
   * Create a new prompt
   */
  async create(dto: CreatePromptDto) {
    this.logging.info('Admin prompt create request', { agentType: dto.agentType, name: dto.name, model: dto.model, role: dto.role, context: 'PromptsService' });
    // Normalize role: empty string or null becomes 'default', undefined stays undefined (will default to 'default')
    const role = dto.role && dto.role.trim() ? dto.role.trim() : 'default';
    const prompt = await this.prisma.agentPrompt.create({
      data: {
        agentType: dto.agentType as AgentType,
        name: dto.name,
        content: dto.content,
        model: dto.model && dto.model.trim() ? dto.model.trim() : null,
        role: role,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    this.logging.info('Admin prompt created', { id: prompt.id, agentType: prompt.agentType, name: prompt.name, model: prompt.model, role: prompt.role, context: 'PromptsService' });
    return prompt;
  }

  /**
   * Update a prompt
   */
  async update(id: string, dto: UpdatePromptDto) {
    await this.findOne(id);
    this.logging.debug('Admin prompt update request', { id, fields: Object.keys(dto), model: dto.model, role: dto.role, context: 'PromptsService' });
    // Normalize role: empty string becomes 'default', null stays null (will be set to 'default')
    const updateData: any = {};
    if (dto.agentType != null) updateData.agentType = dto.agentType as AgentType;
    if (dto.name != null) updateData.name = dto.name;
    if (dto.content != null) updateData.content = dto.content;
    if (dto.model !== undefined) {
      updateData.model = dto.model && dto.model.trim() ? dto.model.trim() : null;
    }
    if (dto.role !== undefined) {
      updateData.role = dto.role && dto.role.trim() ? dto.role.trim() : 'default';
    }
    if (dto.isActive != null) updateData.isActive = dto.isActive;
    if (dto.sortOrder != null) updateData.sortOrder = dto.sortOrder;
    
    const prompt = await this.prisma.agentPrompt.update({
      where: { id },
      data: updateData,
    });
    this.logging.info('Admin prompt updated', { id: prompt.id, agentType: prompt.agentType, model: prompt.model, role: prompt.role, context: 'PromptsService' });
    return prompt;
  }

  /**
   * Delete a prompt
   */
  async remove(id: string) {
    const prompt = await this.findOne(id);
    await this.prisma.agentPrompt.delete({ where: { id } });
    this.logging.info('Admin prompt deleted', { id, agentType: prompt.agentType, name: prompt.name, context: 'PromptsService' });
    return { deleted: true };
  }
}
