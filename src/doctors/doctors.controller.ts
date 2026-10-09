import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Query
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/role.decorator';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { UserRole } from 'src/users/user-schema';
import { Doctor } from './doctor-schema';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dtos/createDoctorDto';
import { UpdateDoctorDto } from './dtos/updateDoctorDto';

@ApiTags('Doctors')
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorService: DoctorsService) {}

  @UseGuards(AuthGuard(), RolesGuard)
  @Post('create-account')
  @UseInterceptors(FileInterceptor('image'))
  @Roles(UserRole.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create doctor profile details for authenticated user',
  })
  @ApiResponse({
    status: 201,
    description: 'Doctor profile created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async createAccount(
    @Request() req,
    @Body() createDoctorDto: CreateDoctorDto,
    @UploadedFile() image: Express.Multer.File,
  ): Promise<Doctor> {
    return await this.doctorService.createAccount(
      req.user._id,
      createDoctorDto,
      image,
    );
  }

  @UseGuards(AuthGuard(), RolesGuard)
  @Patch('update-data/:id')
  @UseInterceptors(FileInterceptor('image'))
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update doctor profile data by doctor ID' })
  @ApiResponse({ status: 200, description: 'Doctor data updated successfully' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  async updateData(
    @Param('id') id: string,
    @Body() updateDoctorDto: UpdateDoctorDto,
    @UploadedFile() image: Express.Multer.File,
    @Request() req,
  ): Promise<Doctor> {
    return await this.doctorService.updateData(
      id,
      updateDoctorDto,
      image,
      req.user,
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('/get-me')
  @Roles(UserRole.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get doctor account details for current user' })
  @ApiResponse({ status: 200, description: 'Returns current doctor profile' })
  async getMyAccount(@Request() req): Promise<Doctor> {
    return this.doctorService.getMyAccount(req.user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('/get-doctor/:id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get doctor profile by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns doctor profile' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  async getDoctorById(@Param('id') id: string): Promise<Doctor> {
    return this.doctorService.getDoctorById(id);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search doctors by specialization' })
  @ApiQuery({
    name: 'specialization',
    required: true,
    description: 'Specialization to search for',
    example: 'Cardiology',
  })
  @ApiResponse({
    status: 200,
    description: 'Doctors found successfully',
    type: [Doctor],
  })
  @ApiResponse({
    status: 404,
    description: 'No doctors found for the specified specialization',
  })
  async searchBySpecialization(
    @Query('specialization') specialization: string,
  ): Promise<Doctor[]> {
    return await this.doctorService.findBySpecialization(specialization);
  }
}
