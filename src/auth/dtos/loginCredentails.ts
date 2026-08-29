import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginCredentails {
  @IsNotEmpty({ message: 'please proive the email address' })
  @IsEmail()
  email: string;
  @IsNotEmpty({ message: 'please proive the password' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}
