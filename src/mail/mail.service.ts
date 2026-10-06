import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendPasswordResetEmail(
    toEmail: string,
    resetToken: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    try {
      await this.mailerService.sendMail({
        to: toEmail,
        subject: 'Password Reset Request',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Password Reset Request</h2>
            <p>You requested to reset your password. Click the link below to set a new password:</p>
            <p>
              <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </p>
            <p>This link will expire in 15 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `,
        from: this.configService.get<string>('MAIL_FROM'),
      });

      this.logger.log(`Password reset email sent to ${toEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${toEmail}`, error.stack);
      throw new InternalServerErrorException('Failed to send reset email');
    }
  }

  async sendEmailVerification(toEmail: string, token: string): Promise<void> {
    const verificationUrl = `https://your-frontend-app.com/verify-email?token=${token}`;
    this.logger.log(`[MailService] Sending email verification to: ${toEmail}`);
    this.logger.log(`[MailService] Verification Link: ${verificationUrl}`);
    try {
      await this.mailerService.sendMail({
        to: toEmail,
        subject: 'Verify Your Email Address',
        html: `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Welcome! Please Verify Your Email</h2>
      <p>Thank you for signing up. Please click the button below to verify your email address and activate your account:</p>
      <p>
        <a href="${verificationUrl}" style="background-color: #28a745; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a>
      </p>
      <p>If you didn't create an account, no further action is required.</p>
    </div>
  `,
        from: this.configService.get<string>('MAIL_FROM'),
      });
    } catch (error) {
      this.logger.error(`Failed to send email to ${toEmail}`, error.stack);
      throw new InternalServerErrorException('Failed to send reset email');
    }
  }
}
