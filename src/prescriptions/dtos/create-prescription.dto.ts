import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreatePrescriptionItemDto } from './create-prescription-item.dto';

export class CreatePrescriptionDto {
  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d1', description: 'Patient ID' })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d2', description: 'Appointment ID' })
  @IsString()
  @IsNotEmpty()
  appointmentId: string;

  @ApiPropertyOptional({ example: 'Take all medicines as prescribed.', description: 'General prescription notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreatePrescriptionItemDto], description: 'List of prescribed medicines' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePrescriptionItemDto)
  items: CreatePrescriptionItemDto[];
}
