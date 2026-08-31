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
import { Gender, UserRole } from 'src/users/user-schema';

export class CreateUserDto {
  @IsNotEmpty({ message: 'please provide a name' })
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  name: string;

  @IsNotEmpty({ message: 'please provide an email address' })
  @IsString()
  @IsEmail()
  email: string;

  @IsNotEmpty({ message: 'please provide a password' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsDateString()
  @IsNotEmpty({ message: 'please provide your date of birth' })
  dateOfBirth: string;

  @IsString()
  @IsNotEmpty({ message: 'please provide your phone number' })
  @IsPhoneNumber('EG')
  phone: string;

  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}
