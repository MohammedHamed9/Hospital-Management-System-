import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'd9f8e7c6b5a43210...',
    description: 'Email verification token sent to user email',
  })
  @IsNotEmpty({ message: 'Verification token is required' })
  @IsString({ message: 'Token must be a string' })
  token: string;
}
