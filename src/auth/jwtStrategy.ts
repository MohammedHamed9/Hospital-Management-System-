import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from './../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'this is secret',
    });
  }

  async validate(payload: any) {
    const { email } = payload;
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User does not exist');
    }
    if (user.isActive === false) {
      throw new UnauthorizedException('Account is deactivated or inactive');
    }
    return user;
  }
}
