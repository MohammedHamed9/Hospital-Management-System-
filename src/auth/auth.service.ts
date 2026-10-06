import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/users/user-schema';
import { UsersService } from './../users/users.service';
import { ChangePasswordDto } from './dtos/changePasswordDto';
import { ForgotPasswordDto } from './dtos/forgotPasswordDto';
import { LoginCredentails } from './dtos/loginCredentails';
import { ResendVerificationDto } from './dtos/resend-verification.dto';
import { ResetPasswordDto } from './dtos/resetPasswordDto';
import { SignUpCredentials } from './dtos/signUpCredentials';
import { VerifyEmailDto } from './dtos/verify-email.dto';
import {
  VerificationToken,
  VerificationTokenDocument,
} from './schemas/verification-token.schema';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(VerificationToken.name)
    private readonly verificationTokenModel: Model<VerificationTokenDocument>,
  ) {}

  async signUp(
    signUpCredentials: SignUpCredentials,
  ): Promise<{ user: User; accessToken: string }> {
    const { name, email, password, address, dateOfBirth, phone, gender } =
      signUpCredentials;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.usersService.create({
      name,
      email,
      password: hashedPassword,
      address,
      dateOfBirth,
      phone,
      gender,
    });
    const payload = { email: user.email, sub: (user as any)._id || user.name };
    const token = await this.jwtService.signAsync(payload);
    return { user, accessToken: token };
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
    const payload = { email: user.email, sub: (user as any)._id };
    const token = await this.jwtService.signAsync(payload);
    return { user, accessToken: token };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const genericResponse = {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };

    const user = await this.usersService.findOneByEmail(
      forgotPasswordDto.email,
    );
    if (!user) {
      this.logger.warn(
        `Forgot password requested for non-existent email: ${forgotPasswordDto.email}`,
      );
      return genericResponse;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    await this.mailService.sendPasswordResetEmail(user.email, resetToken);

    return genericResponse;
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.usersService.findByResetToken(hashedToken);
    if (!user) {
      throw new BadRequestException('Token is invalid or has expired');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordChangedAt = new Date();
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    return { message: 'Password has been successfully reset' };
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { oldPassword, newPassword } = changePasswordDto;

    const user = await this.usersService.findByIdWithPassword(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isOldPasswordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordMatch) {
      throw new UnauthorizedException('Invalid current password');
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordChangedAt = new Date();

    await user.save();

    return { message: 'Password has been successfully updated' };
  }

  async verifyEmail(
    verifyEmailDto: VerifyEmailDto,
  ): Promise<{ message: string; accessToken: string }> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(verifyEmailDto.token)
      .digest('hex');

    const tokenRecord = await this.verificationTokenModel.findOne({
      tokenHash,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenRecord) {
      throw new BadRequestException(
        'Invalid, expired, or previously used verification token',
      );
    }

    const session = await this.verificationTokenModel.db.startSession();
    let user: UserDocument | null = null;

    try {
      session.startTransaction();

      // 1. Mark token as consumed
      tokenRecord.usedAt = new Date();
      await tokenRecord.save({ session });

      // 2. Update user email verification status
      user = await this.userModel.findById(tokenRecord.userId).session(session);
      if (!user) {
        throw new NotFoundException('Associated user account not found');
      }

      user.isEmailVerified = true;
      user.emailVerifiedAt = new Date();
      user.isActive = true;
      await user.save({ session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    // Automatic login access token after successful verification
    const payload = { email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'Email verified successfully',
      accessToken,
    };
  }

  async resendVerification(
    resendVerificationDto: ResendVerificationDto,
  ): Promise<{ message: string }> {
    const neutralResponse = {
      message:
        'If an unverified account exists with this email, a new verification link has been sent.',
    };

    const user = await this.userModel.findOne({
      email: resendVerificationDto.email.toLowerCase(),
    });

    if (!user || user.isEmailVerified) {
      this.logger.warn(
        `resend requset for unfound email ${resendVerificationDto.email}`,
      );
      return neutralResponse;
    }

    // Rate Limiting Cooldown Check (60 seconds)
    const lastToken = await this.verificationTokenModel
      .findOne({ userId: user._id })
      .sort({ createdAt: -1 })
      .exec();

    if (lastToken && lastToken.createdAt) {
      const timeElapsed = Date.now() - new Date(lastToken.createdAt).getTime();
      if (timeElapsed < 60 * 1000) {
        const remainingSeconds = Math.ceil((60000 - timeElapsed) / 1000);
        throw new HttpException(
          `Please wait ${remainingSeconds} seconds before requesting another verification email`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // Revoke previous unused tokens
    await this.verificationTokenModel.updateMany(
      { userId: user._id, usedAt: null },
      { $set: { usedAt: new Date() } },
    );

    // Generate secure token & hash
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiration

    await this.verificationTokenModel.create({
      userId: user._id,
      tokenHash,
      expiresAt,
    });

    // Dispatch background email task
    await this.mailService.sendEmailVerification(user.email, rawToken);

    return neutralResponse;
  }
}
