import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/role.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { UserRole } from 'src/users/user-schema';
import { CreatePrescriptionDto } from './dtos/create-prescription.dto';
import { PrescriptionFilterDto } from './dtos/prescription-filter.dto';
import { UpdatePrescriptionDto } from './dtos/update-prescription.dto';
import { PrescriptionService } from './prescriptions.service';

@Controller('prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  private getUserId(req: any): string {
    return req.user?.id || req.user?._id?.toString() || req.user?._id;
  }

  @Post()
  @Roles(UserRole.DOCTOR)
  async createPrescription(
    @Body() createDto: CreatePrescriptionDto,
    @Request() req: any,
  ) {
    const doctorId = this.getUserId(req);
    return await this.prescriptionService.createPrescription(
      createDto,
      doctorId,
      req.user,
    );
  }

  @Get('doctor/:id')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  async getDoctorPrescriptions(
    @Query() filterDto: PrescriptionFilterDto,
    @Param('id') doctorId: string,
    @Request() req: any,
  ) {
    return await this.prescriptionService.getDoctorPrescriptions(
      doctorId,
      req.user,
      filterDto,
    );
  }

  @Get('')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.PATIENT)
  async getPrescriptions(
    @Query() filterDto: PrescriptionFilterDto,
    @Request() req: any,
  ) {
    return await this.prescriptionService.getPrescriptions(filterDto, req.user);
  }

  @Get(':id')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.PATIENT)
  async getPrescriptionById(@Param('id') id: string, @Request() req: any) {
    return await this.prescriptionService.getPrescriptionById(id, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.DOCTOR)
  async updatePrescription(
    @Param('id') id: string,
    @Body() updateDto: UpdatePrescriptionDto,
    @Request() req: any,
  ) {
    const doctorId = this.getUserId(req);
    return await this.prescriptionService.updatePrescription(
      id,
      updateDto,
      doctorId,
    );
  }

  @Patch(':id/finalize')
  @Roles(UserRole.DOCTOR)
  async finalizePrescription(@Param('id') id: string, @Request() req: any) {
    return await this.prescriptionService.finalizePrescription(id, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.DOCTOR)
  async deletePrescription(@Param('id') id: string, @Request() req: any) {
    const doctorId = this.getUserId(req);
    return await this.prescriptionService.deletePrescription(id, doctorId);
  }
}
