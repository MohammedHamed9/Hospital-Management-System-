import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { Gender } from '../user-schema';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John Doe', description: 'Full name of user' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '123 Main Street', description: 'Address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '1995-05-15', description: 'Date of birth' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateOfBirth?: Date;

  @ApiPropertyOptional({ enum: Gender, example: Gender.MALE, description: 'Gender' })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
}
