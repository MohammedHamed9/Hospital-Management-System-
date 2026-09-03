import { CreateUserDto } from './dtos/createUserDto';
import { UsersService } from './users.service';
import {
  Controller,
  Post,
  UseGuards,
  Body,
  Request,
  Get,
  Param,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User, UserRole } from './user-schema';
import { Roles } from 'src/auth/decorators/role.decorator';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { GetUsersDto } from './dtos/getUsersDro';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post('admin/createUser')
  @Roles(UserRole.ADMIN)
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    return await this.usersService.createUser(createUserDto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('admin/getSomeUsers')
  @Roles(UserRole.ADMIN)
  async getSomeUsers(@Body() getUsersDto: GetUsersDto): Promise<User[]> {
    return await this.usersService.findSomeUsers(getUsersDto);
  }
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('admin/getAllUsers')
  @Roles(UserRole.ADMIN)
  async getAllUsers(): Promise<User[]> {
    return await this.usersService.findAllUsers();
  }
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('admin/getUserById/:id')
  @Roles(UserRole.ADMIN)
  async getUserById(@Param('id') id: string): Promise<User> {
    return await this.usersService.findById(id);
  }
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Delete('admin/deleteUser/:id')
  @Roles(UserRole.ADMIN)
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.usersService.deleteById(id);
  }
}
