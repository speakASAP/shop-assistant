import { IsArray, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class FeedbackDto {
  @IsString()
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  selectedIndices?: number[];

  /** Priority order (10.1): e.g. ["price","quality","location"]. Updates session if provided. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  priorities?: string[];

  /** Account profile id (10.3). Updates session profile reference when provided. */
  @IsOptional()
  @IsString()
  profileId?: string;
}
