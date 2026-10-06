import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { User } from 'src/users/user-schema';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dtos/changePasswordDto';
import { ForgotPasswordDto } from './dtos/forgotPasswordDto';
import { LoginCredentails } from './dtos/loginCredentails';
import { ResendVerificationDto } from './dtos/resend-verification.dto';
import { ResetPasswordDto } from './dtos/resetPasswordDto';
import { SignUpCredentials } from './dtos/signUpCredentials';
import { VerifyEmailDto } from './dtos/verify-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 211, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad Request / Validation Error' })
  @ApiResponse({ status: 409, description: 'Conflict - Email already exists' })
  async signUp(
    @Body() signUpCredentials: SignUpCredentials,
  ): Promise<{ user: User; accessToken: string }> {
    return await this.authService.signUp(signUpCredentials);
  }

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and issue JWT access token' })
  @ApiResponse({ status: 200, description: 'Successfully authenticated' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  async login(
    @Body() loginCredentails: LoginCredentails,
  ): Promise<{ user: User; accessToken: string }> {
    return await this.authService.login(loginCredentails);
  }

  @Post('/forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Request password reset token via email (Generic success response)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Generic success response returned regardless of email existence to prevent enumeration attacks',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error (Invalid email format)',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using valid reset token' })
  @ApiResponse({
    status: 200,
    description: 'Password successfully reset',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid/expired token or password policy validation failure',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto);
  }

  @Patch('/change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password for currently authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Password successfully updated',
  })
  @ApiResponse({
    status: 400,
    description:
      'Validation error or new password identical to current password',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid JWT token or wrong current password',
  })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?._id?.toString() || req.user?._id;
    return await this.authService.changePassword(userId, changePasswordDto);
  }

  @Post('/verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify user email using token' })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully. Returns automatic login token.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid, expired, or previously used verification token',
  })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return await this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('/resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend email verification link/token',
  })
  @ApiResponse({
    status: 200,
    description:
      'Neutral success response returned regardless of email existence/status to prevent enumeration attacks',
  })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests - 60-second cooldown active',
  })
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
  ) {
    return await this.authService.resendVerification(resendVerificationDto);
  }
}
