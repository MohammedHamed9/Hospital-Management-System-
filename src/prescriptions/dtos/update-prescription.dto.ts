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
  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsOptional()
  @IsEnum(PrescriptionStatus)
  status?: PrescriptionStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePrescriptionItemDto)
  items?: CreatePrescriptionItemDto[];
}
