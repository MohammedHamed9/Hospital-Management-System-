import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsNotEmpty,
} from 'class-validator';

export class CreateDoctorDto {
  @IsString()
  @IsNotEmpty({ message: 'specialization cannot be empty' })
  specialization: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'experience must be a number' })
  @Min(0, { message: 'experience cannot be negative' })
  @IsNotEmpty({ message: 'experience cannot be empty' })
  experience: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'consultationFee must be a number' })
  @Min(0, { message: 'consultationFee cannot be negative' })
  @IsNotEmpty({ message: 'consultationFee cannot be empty' })
  consultationFee: number;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  image?: string;
}
