import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from 'node_modules/@nestjs/swagger/dist/decorators/api-property.decorator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Reset token for the user',
    example: 'reset-token-123',
  })
  @IsNotEmpty({ message: 'Reset token is required' })
  @IsString({ message: 'Token must be a string' })
  token: string;

  @ApiProperty({
    description: 'New password for the user',
    example: 'NewPassword123!',
  })
  @IsNotEmpty({ message: 'New password is required' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  newPassword: string;
}
