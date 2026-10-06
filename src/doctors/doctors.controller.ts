import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User, UserRole } from 'src/users/user-schema';
import { DoctorsService } from './doctors.service';
import { Doctor } from './doctor-schema';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { CreateDoctorDto } from './dtos/createDoctorDto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateDoctorDto } from './dtos/updateDoctorDto';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorService: DoctorsService) {}

  @UseGuards(AuthGuard(), RolesGuard)
  @Post('create-account')
  @UseInterceptors(FileInterceptor('image'))
  @Roles(UserRole.DOCTOR)
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
  async getMyAccount(@Request() req): Promise<Doctor> {
    return this.doctorService.getMyAccount(req.user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('/get-doctor/:id')
  @Roles(UserRole.ADMIN)
  async getDoctorById(@Param('id') id: string): Promise<Doctor> {
    return this.doctorService.getDoctorById(id);
  }
  /*
  GET /doctors/search name  or specialization
  
  */
}
