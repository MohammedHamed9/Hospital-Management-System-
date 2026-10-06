import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { User, UserSchema } from 'src/users/user-schema';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwtStrategy';
import {
  VerificationToken,
  VerificationTokenSchema,
} from './schemas/verification-token.schema';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: VerificationToken.name, schema: VerificationTokenSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: 'this is secret',
      signOptions: {
        expiresIn: 3600,
      },
    }),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
