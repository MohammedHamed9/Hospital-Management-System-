import { LoginCredentails } from './dtos/loginCredentails';
import { UsersService } from './../users/users.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { SignUpCredentials } from './dtos/signUpCredentials';
import { User } from 'src/users/user-schema';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}
  async signUp(
    signUpCredentials: SignUpCredentials,
  ): Promise<{ user: User; accessToken: string }> {
    let { name, email, password, address, dateOfBirth, phone, gender } =
      signUpCredentials;
    password = await bcrypt.hash(password, 10);
    const user = await this.usersService.create({
      name,
      email,
      password,
      address,
      dateOfBirth,
      phone,
      gender,
    });
    const payload = { name: user.name, role: user.role };
    const token = await this.jwtService.signAsync(payload);
    return { user: user, accessToken: token };
  }
  async login(
    loginCredentails: LoginCredentails,
  ): Promise<{ user: User; accessToken: string }> {
    const { email, password } = loginCredentails;
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { email: user.email };
    const token = await this.jwtService.signAsync(payload);
    return { user: user, accessToken: token };
  }
}
