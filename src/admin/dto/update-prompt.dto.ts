import { IsString, IsBoolean, IsOptional, IsEnum, MaxLength, Min } from 'class-validator';
import { AGENT_TYPES, AgentTypeDto } from './create-prompt.dto';

export class UpdatePromptDto {
  @IsOptional()
  @IsEnum(AGENT_TYPES, { message: 'agentType must be one of: SEARCH, COMPARISON, LOCATION, COMMUNICATION, PRESENTATION' })
  agentType?: AgentTypeDto;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  model?: string;

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
