import { SignUpCredentials } from './dtos/signUpCredentials';
import { User } from 'src/users/user-schema';
import { AuthService } from './auth.service';
import { Body, Controller, Post } from '@nestjs/common';
import { LoginCredentails } from './dtos/loginCredentails';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Post('/register')
  async signUp(
    @Body() signUpCredentials: SignUpCredentials,
  ): Promise<{ user: User; accessToken: string }> {
    return await this.authService.signUp(signUpCredentials);
  }
  @Post('/login')
  async login(
    @Body() loginCredentails: LoginCredentails,
  ): Promise<{ user: User; accessToken: string }> {
    return await this.authService.login(loginCredentails);
  }
}
