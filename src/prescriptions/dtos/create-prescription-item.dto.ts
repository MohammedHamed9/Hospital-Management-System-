import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePrescriptionItemDto {
  @ApiProperty({ example: 'Amoxicillin 500mg', description: 'Name of medicine' })
  @IsString()
  @IsNotEmpty()
  medicineName: string;

  @ApiProperty({ example: '1 capsule', description: 'Dosage amount' })
  @IsString()
  @IsNotEmpty()
  dosage: string;

  @ApiProperty({ example: '3 times daily after meals', description: 'Frequency of intake' })
  @IsString()
  @IsNotEmpty()
  frequency: string;

  @ApiProperty({ example: '7 days', description: 'Treatment duration' })
  @IsString()
  @IsNotEmpty()
  duration: string;

  @ApiPropertyOptional({ example: 'Drink plenty of water', description: 'Special instructions' })
  @IsOptional()
  @IsString()
  instructions?: string;
}
