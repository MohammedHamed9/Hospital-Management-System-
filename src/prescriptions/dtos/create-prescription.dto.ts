import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PrescriptionStatus } from '../prescription-schema';
import { CreatePrescriptionItemDto } from './create-prescription-item.dto';

export class CreatePrescriptionDto {
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsNotEmpty()
  appointmentId: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePrescriptionItemDto)
  items: CreatePrescriptionItemDto[];
}
