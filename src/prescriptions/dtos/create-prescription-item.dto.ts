import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePrescriptionItemDto {
  @IsString()
  @IsNotEmpty()
  medicineName: string;

  @IsString()
  @IsNotEmpty()
  dosage: string;

  @IsString()
  @IsNotEmpty()
  frequency: string;

  @IsString()
  @IsNotEmpty()
  duration: string;

  @IsOptional()
  @IsString()
  instructions?: string;
}
