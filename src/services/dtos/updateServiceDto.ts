// src/services/dto/update-service.dto.ts
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { ServiceCategory } from '../service-schema';

export class UpdateServiceDto {
  @IsOptional()
  @IsString({ message: 'service name must be a string' })
  @MinLength(3, { message: 'service name must be at least 3 characters long' })
  name?: string;

  @IsOptional()
  @IsNumber({}, { message: 'service price must be a number' })
  @Min(0, { message: 'service price must be a positive number' })
  price?: number;

  @IsOptional()
  @IsString({ message: 'service description must be a string' })
  @MinLength(10, {
    message: 'service description must be at least 10 characters long',
  })
  description?: string;

  @IsOptional()
  @IsEnum(ServiceCategory, {
    message: 'service category must be a valid enum value',
  })
  category?: ServiceCategory;
}
