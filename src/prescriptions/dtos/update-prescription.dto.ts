import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PrescriptionStatus } from '../prescription-schema';
import { CreatePrescriptionItemDto } from './create-prescription-item.dto';

export class UpdatePrescriptionDto {
  @ApiPropertyOptional({ example: '65f1a2b3c4d5e6f7a8b9c0d1', description: 'Patient ID' })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({ example: '65f1a2b3c4d5e6f7a8b9c0d2', description: 'Appointment ID' })
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @ApiPropertyOptional({ enum: PrescriptionStatus, example: PrescriptionStatus.FINAL, description: 'Prescription status' })
  @IsOptional()
  @IsEnum(PrescriptionStatus)
  status?: PrescriptionStatus;

  @ApiPropertyOptional({ example: 'Updated doctor notes', description: 'General prescription notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [CreatePrescriptionItemDto], description: 'List of prescribed medicines' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePrescriptionItemDto)
  items?: CreatePrescriptionItemDto[];
}
