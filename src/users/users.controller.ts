import { CreateUserDto } from './dtos/createUserDto';
import { UsersService } from './users.service';
import { Controller, Post, UseGuards, Body, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User, UserRole } from './user-schema';
import { Roles } from 'src/auth/decorators/role.decorator';
import { RolesGuard } from 'src/auth/guards/role.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
  @UseGuards(AuthGuard(), RolesGuard)
  @Post('admin/createUser')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    return await this.usersService.createUser(createUserDto);
  }
}
