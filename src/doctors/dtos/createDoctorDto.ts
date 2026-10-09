import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateDoctorDto {
  @ApiProperty({ example: 'Cardiology', description: 'Doctor medical specialization' })
  @IsString()
  @IsNotEmpty({ message: 'specialization cannot be empty' })
  specialization: string;

  @ApiProperty({ example: 10, description: 'Years of professional experience' })
  @Type(() => Number)
  @IsNumber({}, { message: 'experience must be a number' })
  @Min(0, { message: 'experience cannot be negative' })
  @IsNotEmpty({ message: 'experience cannot be empty' })
  experience: number;

  @ApiProperty({ example: 250, description: 'Consultation fee amount' })
  @Type(() => Number)
  @IsNumber({}, { message: 'consultationFee must be a number' })
  @Min(0, { message: 'consultationFee cannot be negative' })
  @IsNotEmpty({ message: 'consultationFee cannot be empty' })
  consultationFee: number;

  @ApiPropertyOptional({ example: 'Experienced cardiologist specialising in heart disease.', description: 'Doctor biography' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 'https://cloudinary.com/doctor.jpg', description: 'Doctor profile image URL' })
  @IsOptional()
  @IsString()
  image?: string;
}
