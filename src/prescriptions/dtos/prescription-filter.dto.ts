import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PrescriptionStatus } from '../prescription-schema';

export class PrescriptionFilterDto {
  @ApiPropertyOptional({ example: '65f1a2b3c4d5e6f7a8b9c0d1', description: 'Filter by patient ID' })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({ example: '65f1a2b3c4d5e6f7a8b9c0d2', description: 'Filter by doctor ID' })
  @IsOptional()
  @IsString()
  doctorId?: string;

  @ApiPropertyOptional({ enum: PrescriptionStatus, description: 'Filter by prescription status' })
  @IsOptional()
  @IsEnum(PrescriptionStatus)
  status?: PrescriptionStatus;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Filter start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Filter end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 1, default: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
