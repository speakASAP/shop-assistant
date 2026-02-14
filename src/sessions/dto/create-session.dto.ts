import { IsArray, IsOptional, IsString } from 'class-validator';

/** User priority order (10.1): e.g. ["price","quality","location"]. Stored on session. */
export const PRIORITY_KEYS = ['price', 'quality', 'location'] as const;

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  userId?: string;

  /** Priority order: array of "price"|"quality"|"location". Used by COMPARISON and LOCATION agents. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  priorities?: string[];

  /** Account profile id (10.3 multi-user). Session is linked to this profile when provided. */
  @IsOptional()
  @IsString()
  profileId?: string;
}
