import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSavedCriteriaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  // JSON fields are kept loose; validation is minimal to avoid over-constraining payloads.
  @IsOptional()
  priorities?: unknown;

  @IsOptional()
  productIntents?: unknown;

  @IsOptional()
  filters?: unknown;

  @IsString()
  @IsOptional()
  profileId?: string;
}

export class UpdateSavedCriteriaDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  priorities?: unknown;

  @IsOptional()
  productIntents?: unknown;

  @IsOptional()
  filters?: unknown;

  @IsOptional()
  @IsString()
  profileId?: string | null;
}

