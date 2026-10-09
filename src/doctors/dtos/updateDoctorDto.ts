import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateDoctorDto {
  @ApiPropertyOptional({ example: 'Cardiology', description: 'Doctor medical specialization' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'specialization cannot be empty' })
  specialization?: string;

  @ApiPropertyOptional({ example: 12, description: 'Years of professional experience' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'experience must be a number' })
  @Min(0, { message: 'experience cannot be negative' })
  @IsNotEmpty({ message: 'experience cannot be empty' })
  experience?: number;

  @ApiPropertyOptional({ example: 300, description: 'Consultation fee amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'consultationFee must be a number' })
  @Min(0, { message: 'consultationFee cannot be negative' })
  @IsNotEmpty({ message: 'consultationFee cannot be empty' })
  consultationFee?: number;

  @ApiPropertyOptional({ example: 'Updated biography details.', description: 'Doctor biography' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 'https://cloudinary.com/doctor-new.jpg', description: 'Doctor profile image URL' })
  @IsOptional()
  @IsString()
  image?: string;
}
