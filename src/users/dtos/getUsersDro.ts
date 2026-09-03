import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from 'src/users/user-schema';

export class GetUsersDto {
  @IsNotEmpty({ message: 'please provide roles' })
  @IsEnum(UserRole, {
    each: true,
    message: 'each role must be a valid enum value',
  })
  roles: UserRole[];
}
