import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginCredentails {
  @ApiProperty({
    example: 'ahmed@example.com',
    description: 'User email address',
  })
  @IsNotEmpty({ message: 'please proive the email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'P@ssw0rd123', description: 'User password' })
  @IsNotEmpty({ message: 'please proive the password' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}
