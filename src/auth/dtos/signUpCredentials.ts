import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Gender } from 'src/users/user-schema';

export class SignUpCredentials {
  @ApiProperty({
    example: 'Ahmed Mohamed',
    description: 'Full name of the user',
  })
  @IsNotEmpty({ message: 'please provide a name' })
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  name: string;

  @ApiProperty({ example: 'ahmed@example.com', description: 'Email address' })
  @IsNotEmpty({ message: 'please provide an email address' })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'P@ssw0rd123', description: 'Account password' })
  @IsNotEmpty({ message: 'please provide a password' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiPropertyOptional({
    example: '123 Cairo Street',
    description: 'Physical address',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    example: '1995-05-15',
    description: 'Date of birth (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsNotEmpty({ message: 'please provide your date of birth' })
  dateOfBirth: string;

  @ApiProperty({
    example: '+201012345678',
    description: 'Phone number in E.164 format',
  })
  @IsString()
  @IsNotEmpty({ message: 'please provide your phone number' })
  @IsPhoneNumber('EG')
  phone: string;

  @ApiProperty({
    enum: Gender,
    example: Gender.MALE,
    description: 'User gender',
  })
  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;
}
