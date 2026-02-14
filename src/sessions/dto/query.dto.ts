import { IsArray, IsOptional, IsString, IsUrl } from 'class-validator';

export class QueryDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsUrl()
  audioUrl?: string;

  /** Priority order for this request (10.1): e.g. ["price","quality","location"]. Updates session if provided. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  priorities?: string[];

  /** Account profile id (10.3). Updates session profile reference when provided. */
  @IsOptional()
  @IsString()
  profileId?: string;
}
