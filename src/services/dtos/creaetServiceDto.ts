import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { ServiceCategory } from '../service-schema';

export class CreateServiceDto {
  @IsNotEmpty({ message: 'please provide service name' })
  @IsString({ message: 'service name must be a string' })
  @MinLength(3, { message: 'service name must be at least 3 characters long' })
  name: string;

  @IsNotEmpty({ message: 'please provide service price' })
  @IsNumber({ allowNaN: false }, { message: 'service price must be a number' })
  @Min(0, { message: 'service price must be a positive number' })
  price: number;
  @IsNotEmpty({ message: 'please provide service description' })
  @IsString({ message: 'service description must be a string' })
  @MinLength(10, {
    message: 'service description must be at least 10 characters long',
  })
  description: string;

  @IsEnum(ServiceCategory, {
    message: 'service category must be a valid enum value',
  })
  @IsNotEmpty({ message: 'please provide service category' })
  category: ServiceCategory;
}
