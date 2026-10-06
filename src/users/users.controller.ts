import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { Roles } from 'src/auth/decorators/role.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { CreateUserDto } from './dtos/createUserDto';
import { GetUsersDto } from './dtos/getUsersDro';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { updateUserDto } from './dtos/updateUserDto';
import { User, UserRole } from './user-schema';
import { UsersService } from './users.service';

@ApiTags('Users & Profile')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private getUserId(req: any): string {
    return req.user?.id || req.user?._id?.toString() || req.user?._id;
  }

  // --- Authenticated Profile & Medical History Endpoints ---

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile data' })
  @ApiResponse({
    status: 200,
    description: 'Returns profile data excluding sensitive fields',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid JWT or deactivated account',
  })
  async getProfile(@Request() req: any): Promise<User> {
    const userId = this.getUserId(req);
    return await this.usersService.getProfile(userId);
  }

  @Get('my-medical-history')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get complete medical history (Completed Appointments + Prescriptions + Service Bookings)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns aggregated medical record history for current patient',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyMedicalHistory(@Request() req: any) {
    const userId = this.getUserId(req);
    return await this.usersService.getMyMedicalHistory(userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profile data for current user' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @Request() req: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    const userId = this.getUserId(req);
    return await this.usersService.updateProfile(userId, updateProfileDto);
  }

  @Delete('deactivate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Deactivate current user account (Alias for deactivate)',
  })
  @ApiResponse({
    status: 200,
    description: 'Account deactivated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAccount(
    @Request() req: any,
  ): Promise<{ message: string; deactivatedAt: Date }> {
    const userId = this.getUserId(req);
    return await this.usersService.deactivateAccount(userId);
  }

  // --- Admin Dashboard & User Management Endpoints ---

  @Get('admin/dashboard-stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get admin dashboard statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns system metrics summary',
  })
  async getDashboardStats() {
    return await this.usersService.getDashboardStats();
  }

  @Post('admin/createUser')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    return await this.usersService.createUser(createUserDto);
  }

  @Patch('admin/activateUser/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Reactivate a deactivated user account (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'User account successfully reactivated',
  })
  async activateUser(@Param('id') id: string): Promise<User> {
    return await this.usersService.activateUser(id);
  }

  @Get('admin/getSomeUsers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getSomeUsers(@Body() getUsersDto: GetUsersDto): Promise<User[]> {
    return await this.usersService.findSomeUsers(getUsersDto);
  }

  @Get('admin/getAllUsers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllUsers(): Promise<User[]> {
    return await this.usersService.findAllUsers();
  }

  @Get('admin/getUserById/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getUserById(@Param('id') id: string): Promise<User> {
    return await this.usersService.findById(id);
  }

  @Patch('admin/updateUserById/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateUserById(
    @Param('id') id: string,
    @Body() updateDoctorDto: updateUserDto,
  ): Promise<User> {
    return await this.usersService.updateUser(id, updateDoctorDto);
  }

  @Delete('admin/deleteUser/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.usersService.deleteById(id);
  }
}
