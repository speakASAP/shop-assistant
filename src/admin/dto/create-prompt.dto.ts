import { IsString, IsBoolean, IsOptional, IsEnum, MaxLength, Min } from 'class-validator';

export const AGENT_TYPES = ['SEARCH', 'COMPARISON', 'LOCATION', 'COMMUNICATION', 'PRESENTATION'] as const;
export type AgentTypeDto = (typeof AGENT_TYPES)[number];

export class CreatePromptDto {
  @IsEnum(AGENT_TYPES, { message: 'agentType must be one of: SEARCH, COMPARISON, LOCATION, COMMUNICATION, PRESENTATION' })
  agentType: AgentTypeDto;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  content: string;

  /** AI model identifier for ai-microservice (e.g. google/gemini-2.0-flash-exp:free). Optional. */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  model?: string;

  /** Role for which this prompt applies (e.g. default, premium). Optional. */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  role?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Min(0)
  sortOrder?: number;
}
